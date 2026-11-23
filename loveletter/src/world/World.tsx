import { Html } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  type Fog,
  RGBAFormat,
  Vector3,
  Vector4,
} from 'three'
import { sound } from '../audio/sound'
import { CEREMONY, chapterById } from '../content/chapters'
import { CEREMONY_ORDER } from '../content/manifest'
import { CHAPTER_IDS, journey, useJourney, type ChapterId } from '../state/journey'
import { goAshore } from './ashore'
import { MARIGOLDS, collectNear } from './collect'
import { TREES, groupOf } from './forest'
import { ISLANDS, SEA_BOUNDS, bearingTo, islandOf, nearestDockable, type Island } from './islands'
import { sea } from './sea'
import { fireflyFragment, fireflyVertex, groundFragment, groundVertex, skyFragment, skyVertex } from './shaders'
import { forward, pushOut, stepBoat } from './steer'
import { TRAIL_LENGTH, createTrail, flatten, pushSample } from './trail'

const GOLD = '#f2b631'
const CREAM = '#f7f1e5'

/* ───────────────────────── Toon shading ─────────────────────────
 * Four flat steps of light instead of a smooth falloff: the cel-shaded look.
 */
const ramp = (() => {
  const steps = [70, 130, 200, 255]
  const t = new DataTexture(new Uint8Array(steps.flatMap((v) => [v, v, v, 255])), steps.length, 1, RGBAFormat)
  t.minFilter = t.magFilter = NearestFilter
  t.needsUpdate = true
  return t
})()

type Reveal = MutableRefObject<number>

const grey = (c: Color) => {
  const l = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b
  // Cool moonlit grey rather than neutral, so unvisited islands still belong to the night.
  return new Color(l * 0.62, l * 0.68, l * 0.9)
}

/**
 * A toon material that is grey until its island is revealed, then takes its
 * true colour. `glow` makes it shine with that colour once revealed.
 */
/** Where Ana is, for the trees' see-through effect. */
const riderAt = { value: new Vector3() }

/**
 * Lets a material dissolve, as a fine dither, wherever it stands between the
 * camera and Ana. Without it a tree trunk can hide her completely.
 */
function seeThrough(m: MeshToonMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRider = riderAt
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSee;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 seeAt = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          seeAt = instanceMatrix * seeAt;
        #endif
        vSee = (modelMatrix * seeAt).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRider;\nvarying vec3 vSee;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        vec3 sight = uRider - cameraPosition;
        float along = clamp(dot(vSee - cameraPosition, sight) / dot(sight, sight), 0.0, 1.0);
        float off = distance(vSee, cameraPosition + sight * along);
        if (along < 0.94 && off < 2.6) {
          float keep = smoothstep(1.1, 2.6, off) * 0.85 + 0.06;
          if (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) > keep) discard;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'see-through'
}

function Tone({ color, reveal, glow = 0, always = 0, veil = false }: { color: string; reveal: Reveal; glow?: number; always?: number; veil?: boolean }) {
  const ref = useRef<MeshToonMaterial>(null)
  const full = useMemo(() => new Color(color), [color])
  const dull = useMemo(() => grey(new Color(color)), [color])
  const last = useRef(-1)
  useEffect(() => {
    if (veil && ref.current) {
      seeThrough(ref.current)
      ref.current.needsUpdate = true
    }
  }, [veil])
  useFrame(() => {
    const m = ref.current
    const r = reveal.current
    if (!m || Math.abs(r - last.current) < 0.002) return
    last.current = r
    m.color.lerpColors(dull, full, r)
    m.emissiveIntensity = always + glow * r
  })
  return <meshToonMaterial ref={ref} gradientMap={ramp} color={dull} emissive={full} emissiveIntensity={always} />
}

/* ───────────────────────── Forest floor ───────────────────────── */

/** How far each glade has come into colour, 0 to 1. Shared by its landmark, its trees and the ground. */
const REVEAL: Reveal[] = ISLANDS.map(() => ({ current: 0 }))

const NIGHT = new Color('#081420')
const DUSK = new Color('#351d4a')

function Ground() {
  const geometry = useMemo(() => new PlaneGeometry(440, 440, 1, 1).rotateX(-Math.PI / 2), [])
  const scene = useThree((s) => s.scene)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIsle: { value: ISLANDS.map((i) => new Vector4(i.x, i.z, 0, i.r)) },
      uIsleCol: { value: ISLANDS.map((i) => new Color(chapterById(i.id).colour)) },
      uBoat: { value: new Vector3(0, 0, 1) },
      uTrail: { value: new Float32Array(TRAIL_LENGTH * 3).fill(-1) },
      uRipple: { value: [0, 1, 2, 3].map(() => new Vector3(0, 0, -1)) },
      uHorizon: { value: NIGHT.clone() },
    }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    sea.now = t
    const { completed } = journey.getState()
    uniforms.uTime.value = t
    uniforms.uBoat.value.set(sea.boat.x, sea.boat.z, 1)
    // Lights come up gently rather than snapping on.
    uniforms.uIsle.value.forEach((u, i) => {
      const lit = completed.includes(ISLANDS[i].id) ? 1 : 0
      u.z += (lit - u.z) * Math.min(1, dt * 0.8)
    })
    pushSample(sea.trail, sea.boat, t, sea.boat.speed)
    flatten(sea.trail, t, uniforms.uTrail.value)
    uniforms.uRipple.value.forEach((u, i) => {
      const r = sea.ripples[i]
      if (r) u.set(r.x, r.z, r.t)
      else u.z = -1
    })
    // The mist the far trees fade into warms from night to dusk as glades are lit.
    uniforms.uHorizon.value.lerpColors(NIGHT, DUSK, completed.length / CHAPTER_IDS.length)
    ;(scene.fog as Fog | null)?.color.copy(uniforms.uHorizon.value)
  })

  const tap = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    sea.target = { x: e.point.x, z: e.point.z }
    sea.ripples = [{ x: e.point.x, z: e.point.z, t: sea.now }, ...sea.ripples].slice(0, 4)
  }

  return (
    <mesh geometry={geometry} position={[0, 0, -62]} onPointerDown={tap}>
      <shaderMaterial uniforms={uniforms} vertexShader={groundVertex} fragmentShader={groundFragment} />
    </mesh>
  )
}

/* ───────────────────────── Trees ─────────────────────────
 * Each glade owns the trees nearest to it. They are drawn in a handful of
 * instanced batches per glade and take colour when that glade does.
 */
function Grove({ glade }: { glade: number }) {
  const trees = groupOf(glade)
  const pines = useMemo(() => trees.filter((t) => t.kind === 0), [trees])
  const rounds = useMemo(() => trees.filter((t) => t.kind === 1), [trees])
  const palette = PALETTE[ISLANDS[glade].id]
  const reveal = REVEAL[glade]

  const place = (list: typeof trees, y: number, scale: (h: number) => [number, number, number]) => (mesh: InstancedMesh | null) => {
    if (!mesh) return
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    list.forEach((t, i) => {
      const [sx, sy, sz] = scale(t.h)
      m.compose(new Vector3(t.x, y * t.h, t.z), q.setFromAxisAngle(up, t.turn), new Vector3(sx, sy, sz))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }

  return (
    <>
      <instancedMesh ref={place(trees, 0.8, (h) => [h, h, h])} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.13, 0.2, 1.6, 5]} />
        <Tone color="#6b4a3a" reveal={reveal} veil />
      </instancedMesh>
      {[0, 1, 2].map((k) => (
        <instancedMesh key={k} ref={place(pines, 1.9 + k * 0.95, (h) => [h * (1 - k * 0.22), h, h * (1 - k * 0.22)])} args={[undefined, undefined, pines.length]}>
          <coneGeometry args={[1.25, 1.7, 6]} />
          <Tone color={palette.tree} reveal={reveal} glow={0.14} veil />
        </instancedMesh>
      ))}
      <instancedMesh ref={place(rounds, 2.6, (h) => [h, h * 1.15, h])} args={[undefined, undefined, rounds.length]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <Tone color={palette.land} reveal={reveal} glow={0.14} veil />
      </instancedMesh>
    </>
  )
}

/* ───────────────────────── Sky ───────────────────────── */

function Sky() {
  const ref = useRef<Group>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDawn: { value: 0 },
      uShootFrom: { value: new Vector3(0, 1, 0) },
      uShootDir: { value: new Vector3(1, 0, 0) },
      uShootT: { value: -1 },
    }),
    [],
  )
  const next = useRef(4)

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    ref.current?.position.copy(camera.position)
    uniforms.uTime.value = t
    const dawn = journey.getState().completed.length / CHAPTER_IDS.length
    uniforms.uDawn.value += (dawn - uniforms.uDawn.value) * Math.min(1, dt * 0.5)

    // A shooting star every so often, always in the half of the sky she is facing.
    if (uniforms.uShootT.value >= 0) {
      uniforms.uShootT.value += dt / 0.9
      if (uniforms.uShootT.value > 1) uniforms.uShootT.value = -1
    } else if (t > next.current) {
      next.current = t + 7 + Math.random() * 9
      const f = forward(sea.boat.heading)
      const side = (Math.random() - 0.5) * 1.6
      uniforms.uShootFrom.value.set(f.x + -f.z * side, 0.55 + Math.random() * 0.35, f.z + f.x * side).normalize()
      uniforms.uShootDir.value.set((Math.random() - 0.5) * 0.9, -0.35 - Math.random() * 0.2, (Math.random() - 0.5) * 0.9)
      uniforms.uShootT.value = 0
    }
  })

  return (
    <group ref={ref}>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[1, 32, 20]} />
        <shaderMaterial uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment} side={BackSide} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}

/* ───────────────────────── Boat and firefly ───────────────────────── */

const COAT = '#fbf6ff'
const MANE = ['#f7a8d0', '#c9a8f5', '#ffd27a', '#f7a8d0', '#c9a8f5']

/** A leg that swings from the hip. */
function Leg({ x, z, phase, gait }: { x: number; z: number; phase: number; gait: MutableRefObject<{ t: number; amp: number }> }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = Math.sin(gait.current.t + phase) * 0.75 * gait.current.amp
  })
  return (
    <group ref={ref} position={[x, 1.02, z]}>
      <mesh position={[0, -0.46, 0]}>
        <cylinderGeometry args={[0.085, 0.07, 0.92, 6]} />
        <meshToonMaterial gradientMap={ramp} color={COAT} emissive={COAT} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.12, 6]} />
        <meshToonMaterial gradientMap={ramp} color={GOLD} emissive={GOLD} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Ana on her unicorn. The light she touched in the prologue is the glow of
 * its horn, and that glow is what colours the forest as she nears.
 */
function Rider() {
  const ref = useRef<Group>(null)
  const body = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const gait = useRef({ t: 0, amp: 0 })
  const coat = <meshToonMaterial gradientMap={ramp} color={COAT} emissive={COAT} emissiveIntensity={0.1} />
  const gown = <meshToonMaterial gradientMap={ramp} color="#7b4bb3" emissive="#7b4bb3" emissiveIntensity={0.2} />

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const { x, z, heading, speed } = sea.boat
    const pace = Math.min(1, Math.abs(speed) / 4)
    gait.current.t += Math.abs(speed) * dt * 2.1
    gait.current.amp += (pace - gait.current.amp) * Math.min(1, dt * 6)
    const turn = (sea.keys.left ? 1 : 0) - (sea.keys.right ? 1 : 0)
    g.position.set(x, 0, z)
    g.rotation.set(0, heading, turn * 0.1 * pace, 'YXZ')
    riderAt.value.set(x, 2, z)
    if (body.current) {
      // A trot: the body rises twice per stride and rocks a little.
      body.current.position.y = Math.abs(Math.sin(gait.current.t)) * 0.11 * gait.current.amp
      body.current.rotation.x = Math.sin(gait.current.t * 2) * 0.035 * gait.current.amp
    }
    if (tail.current) tail.current.rotation.set(0.5 + 0.25 * gait.current.amp, Math.sin(clock.elapsedTime * 2.2) * 0.3, 0)
  })

  return (
    <group ref={ref} scale={0.92}>
      <group ref={body}>
        {/* Unicorn */}
        <mesh position={[0, 1.28, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.42, 0.95, 4, 10]} />
          {coat}
        </mesh>
        <mesh position={[0, 1.82, -0.86]} rotation={[-0.62, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.95, 8]} />
          {coat}
        </mesh>
        <mesh position={[0, 2.26, -1.24]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.32, 0.36, 0.66]} />
          {coat}
        </mesh>
        <mesh position={[0, 2.16, -1.56]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.26, 0.24, 0.26]} />
          <meshToonMaterial gradientMap={ramp} color="#f3dfe8" />
        </mesh>
        {[-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, 2.52, -1.02]} rotation={[-0.2, 0, x * 2]}>
            <coneGeometry args={[0.06, 0.2, 5]} />
            {coat}
          </mesh>
        ))}
        {[-0.165, 0.165].map((x) => (
          <mesh key={x} position={[x, 2.3, -1.38]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#1b1430" />
          </mesh>
        ))}
        {/* The horn, and its light. */}
        <mesh position={[0, 2.66, -1.36]} rotation={[-0.5, 0, 0]}>
          <coneGeometry args={[0.065, 0.6, 7]} />
          <meshBasicMaterial color="#ffe7a3" />
        </mesh>
        <mesh position={[0, 2.9, -1.5]}>
          <sphereGeometry args={[0.36, 12, 12]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 3.0, -1.4]} color="#ffd98a" intensity={26} distance={24} decay={1.5} />
        {MANE.map((c, i) => (
          <mesh key={i} position={[0, 2.42 - i * 0.2, -0.98 + i * 0.16]} rotation={[-0.62, 0, 0]}>
            <boxGeometry args={[0.13, 0.26, 0.3]} />
            <meshToonMaterial gradientMap={ramp} color={c} emissive={c} emissiveIntensity={0.3} />
          </mesh>
        ))}
        <group ref={tail} position={[0, 1.5, 0.92]}>
          {MANE.slice(0, 3).map((c, i) => (
            <mesh key={i} position={[(i - 1) * 0.07, -0.42, 0.14]}>
              <coneGeometry args={[0.11, 0.95, 5]} />
              <meshToonMaterial gradientMap={ramp} color={c} emissive={c} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>

        {/* Ana, in the purple gown. */}
        <mesh position={[0, 1.78, 0.12]} scale={[1.3, 1, 1.05]}>
          <coneGeometry args={[0.5, 0.95, 9]} />
          {gown}
        </mesh>
        <mesh position={[0, 2.32, 0.08]}>
          <cylinderGeometry args={[0.13, 0.18, 0.46, 8]} />
          {gown}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.2, 2.26, -0.16]} rotation={[-1.1, 0, side * 0.25]}>
            <cylinderGeometry args={[0.045, 0.045, 0.5, 6]} />
            <meshToonMaterial gradientMap={ramp} color="#c58d68" />
          </mesh>
        ))}
        <mesh position={[0, 2.72, 0.06]}>
          <sphereGeometry args={[0.175, 12, 12]} />
          <meshToonMaterial gradientMap={ramp} color="#c58d68" />
        </mesh>
        <mesh position={[0, 2.76, 0.11]} scale={[1.08, 1.05, 1.08]}>
          <sphereGeometry args={[0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshToonMaterial gradientMap={ramp} color="#231629" />
        </mesh>
        <mesh position={[0, 2.38, 0.24]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.26, 0.62, 0.1]} />
          <meshToonMaterial gradientMap={ramp} color="#231629" />
        </mesh>
        {/* A marigold tucked in her hair. */}
        <mesh position={[0.15, 2.82, 0.1]}>
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color="#f7a521" />
        </mesh>
      </group>
      <Leg x={-0.24} z={-0.52} phase={0} gait={gait} />
      <Leg x={0.24} z={-0.52} phase={Math.PI} gait={gait} />
      <Leg x={-0.24} z={0.6} phase={Math.PI} gait={gait} />
      <Leg x={0.24} z={0.6} phase={0} gait={gait} />
    </group>
  )
}

/** A small light that flies ahead of the boat towards the next island, showing the way. */
function Companion() {
  const ref = useRef<Group>(null)
  const pos = useRef(new Vector3(0, 2, 0))
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const b = sea.boat
    const lead = b.heading + sea.bearing * 0.85
    const f = forward(lead)
    const want = new Vector3(
      b.x + f.x * 4.2 + Math.sin(t * 1.7) * 0.5,
      2.7 + Math.sin(t * 2.3) * 0.35 + Math.sin(t * 0.7) * 0.2,
      b.z + f.z * 4.2 + Math.cos(t * 1.3) * 0.5,
    )
    pos.current.lerp(want, 1 - Math.exp(-dt * 3))
    g.position.copy(pos.current)
    g.scale.setScalar(0.85 + 0.15 * Math.sin(t * 6))
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#fffbe0" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color="#d9ff9a" transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Fireflies gather over every island she has visited. */
function Fireflies() {
  const dpr = useThree((s) => s.viewport.dpr)
  const height = useThree((s) => s.size.height)
  const { geometry, uniforms } = useMemo(() => {
    const per = 22
    const pos: number[] = []
    const isle: number[] = []
    const seed: number[] = []
    let s = 77
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    ISLANDS.forEach((island, i) => {
      for (let k = 0; k < per; k++) {
        const a = rnd() * Math.PI * 2
        const r = rnd() * (island.r + 2.5)
        pos.push(island.x + Math.cos(a) * r, 1.2 + rnd() * 4.5, island.z + Math.sin(a) * r)
        isle.push(i)
        seed.push(rnd())
      }
    })
    const geometry = new BufferGeometry()
      .setAttribute('position', new Float32BufferAttribute(pos, 3))
      .setAttribute('aIsle', new Float32BufferAttribute(isle, 1))
      .setAttribute('aSeed', new Float32BufferAttribute(seed, 1))
    const uniforms = {
      uTime: { value: 0 },
      uLit: { value: new Float32Array(7) },
      uScale: { value: 60 },
      uColor: { value: new Color('#ffe9a8') },
    }
    return { geometry, uniforms }
  }, [])

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uScale.value = height * dpr * 0.11
    const { completed } = journey.getState()
    ISLANDS.forEach((island, i) => {
      const lit = completed.includes(island.id) ? 1 : 0
      uniforms.uLit.value[i] += (lit - uniforms.uLit.value[i]) * Math.min(1, dt * 0.6)
    })
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={fireflyVertex} fragmentShader={fireflyFragment} transparent depthWrite={false} blending={AdditiveBlending} />
    </points>
  )
}

/* ───────────────────────── Marigolds ───────────────────────── */

function Marigold({ index }: { index: number }) {
  const ref = useRef<Group>(null)
  const { x, z } = MARIGOLDS[index]
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + index * 1.7
    g.position.y = 1.0 + Math.sin(t * 1.5) * 0.16
    g.rotation.y = t * 0.6
  })
  return (
    <group ref={ref} position={[x, 0.7, z]}>
      {[
        [0.6, 0, '#f08a1c'],
        [0.46, 0.14, '#f7a521'],
        [0.3, 0.27, '#ffd24a'],
      ].map(([r, y, c], i) => (
        <mesh key={i} position={[0, y as number, 0]} scale={[1, 0.34, 1]} rotation={[0, i * 0.5, 0]}>
          <dodecahedronGeometry args={[r as number, 0]} />
          <meshToonMaterial gradientMap={ramp} color={c as string} emissive={c as string} emissiveIntensity={0.55} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[1.1, 12, 12]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.1} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Marigolds() {
  const collected = useJourney((s) => s.marigolds)
  return (
    <>
      {MARIGOLDS.map((_, i) => (collected.includes(i) ? null : <Marigold key={i} index={i} />))}
    </>
  )
}

/* ───────────────────────── Islands ───────────────────────── */

const PALETTE: Record<ChapterId, { land: string; tree: string; trees: number }> = {
  prologue: { land: '#8fa3c7', tree: '#6f86b3', trees: 2 },
  quiet: { land: '#6b7da3', tree: '#4a5d87', trees: 2 },
  lumiere: { land: '#c9cf6a', tree: '#f0b23a', trees: 4 },
  colours: { land: '#f2a65a', tree: '#e0436a', trees: 3 },
  home: { land: '#8fc77a', tree: '#3f9a5d', trees: 5 },
  days: { land: '#7fc0cf', tree: '#f2b631', trees: 3 },
  epilogue: { land: '#b497e8', tree: '#f7b9d6', trees: 4 },
}

/** A lumpy mound, the same every visit because the bumps come from the island's own seed. */
function mound(r: number, seedN: number) {
  const g = new IcosahedronGeometry(r, 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const bump = 1 + 0.09 * Math.sin(x * 2.1 + seedN) * Math.cos(z * 1.7 + seedN * 2) + 0.05 * Math.sin((x + z) * 4 + seedN)
    p.setXYZ(i, x * bump, Math.max(y, -r * 0.2) * 0.42 * bump, z * bump)
  }
  // The geometry is not indexed, so this gives one flat normal per face: the faceted low-poly look.
  g.computeVertexNormals()
  return g
}

function Tree({ x, z, h, color, reveal }: { x: number; z: number; h: number; color: string; reveal: Reveal }) {
  return (
    <group position={[x, 0.9, z]} scale={h}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.7, 5]} />
        <Tone color="#6b4a3a" reveal={reveal} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.85 + i * 0.42, 0]} rotation={[0, i * 0.7, 0]}>
          <coneGeometry args={[0.55 - i * 0.14, 0.7, 6]} />
          <Tone color={color} reveal={reveal} glow={0.18} />
        </mesh>
      ))}
    </group>
  )
}

function Feature({ id, reveal, colour }: { id: ChapterId; reveal: Reveal; colour: string }) {
  const spin = useRef<Group>(null)
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * (0.08 + 0.45 * reveal.current)
  })
  const stone = (c = '#8d95b8') => <Tone color={c} reveal={reveal} />

  switch (id) {
    case 'prologue':
      return (
        <group>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 2.2, 6]} />
            {stone('#7a6a58')}
          </mesh>
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.24, 12, 12]} />
            <meshBasicMaterial color="#ffe7a3" />
          </mesh>
        </group>
      )
    case 'quiet':
      return (
        <group position={[0, 1.75, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 1.3, 1.5]} />
            {stone('#aeb6d6')}
          </mesh>
          <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.35, 1, 4]} />
            {stone('#5d6da0')}
          </mesh>
          {/* One lit window. It was always on. */}
          <mesh position={[0, 0.05, 0.76]}>
            <planeGeometry args={[0.34, 0.46]} />
            <meshBasicMaterial color="#ffd98a" />
          </mesh>
        </group>
      )
    case 'lumiere':
      return (
        <group position={[0, 0.6, 0]}>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.38, 0.62, 3.6, 8]} />
            {stone('#f4efe2')}
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.47, 0.52, 0.5, 8]} />
            <Tone color="#e0436a" reveal={reveal} />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <sphereGeometry args={[0.44, 14, 14]} />
            <Tone color="#fff1c4" reveal={reveal} glow={2.6} always={0.35} />
          </mesh>
          <mesh position={[0, 4.75, 0]}>
            <coneGeometry args={[0.55, 0.5, 8]} />
            <Tone color="#e0436a" reveal={reveal} />
          </mesh>
        </group>
      )
    case 'colours':
      return (
        <group ref={spin} position={[0, 1.3, 0]}>
          {CEREMONY_ORDER.map((key, i) => {
            const a = (i / CEREMONY_ORDER.length) * Math.PI * 2
            const c = CEREMONY[key].colour
            return (
              <group key={key} position={[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9]} rotation={[0, -a, 0]}>
                <mesh position={[0, 0.9, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 2.2, 5]} />
                  {stone('#c9b08a')}
                </mesh>
                <mesh position={[0.34, 1.7, 0]}>
                  <boxGeometry args={[0.64, 0.4, 0.03]} />
                  <Tone color={c} reveal={reveal} glow={0.9} />
                </mesh>
              </group>
            )
          })}
        </group>
      )
    case 'home':
      return (
        <group position={[0, 1.75, 0]}>
          <mesh position={[-0.4, 0, 0]}>
            <boxGeometry args={[2, 1.4, 1.6]} />
            {stone('#f4e3c8')}
          </mesh>
          <mesh position={[-0.4, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.7, 1, 4]} />
            <Tone color="#c8553d" reveal={reveal} />
          </mesh>
          {[-0.85, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.05, 0.81]}>
              <planeGeometry args={[0.36, 0.46]} />
              <Tone color="#ffe2a0" reveal={reveal} glow={2.4} />
            </mesh>
          ))}
          <mesh position={[-0.4, -0.3, 0.81]}>
            <planeGeometry args={[0.3, 0.7]} />
            <Tone color="#7a4a36" reveal={reveal} />
          </mesh>
        </group>
      )
    case 'days':
      return (
        <group ref={spin} position={[0, 3.1, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.5, i * 0.8, 0]}>
              <torusGeometry args={[1 + i * 0.32, 0.04, 6, 48]} />
              <Tone color={colour} reveal={reveal} glow={1.8} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.28, 12, 12]} />
            <Tone color="#fff1c4" reveal={reveal} glow={2.2} always={0.2} />
          </mesh>
        </group>
      )
    case 'epilogue':
      return (
        <group position={[0, 1.2, 0]}>
          <mesh>
            <torusGeometry args={[1.9, 0.16, 8, 32, Math.PI]} />
            <Tone color="#e9d9ff" reveal={reveal} glow={0.7} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.3, 14, 14]} />
            <meshBasicMaterial color="#ffe7a3" />
          </mesh>
        </group>
      )
  }
}

function IslandMesh({ island, index }: { island: Island; index: number }) {
  const completed = useJourney((s) => s.completed)
  const lit = completed.includes(island.id)
  const next = CHAPTER_IDS.find((id) => !completed.includes(id)) === island.id
  const chapter = chapterById(island.id)
  const palette = PALETTE[island.id]
  const beacon = useRef<Group>(null)
  const reveal = REVEAL[index]
  const land = useMemo(() => mound(island.r * 0.9, index * 3.7), [island.r, index])

  const trees = useMemo(() => {
    let s = 911 + index * 131
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    return Array.from({ length: palette.trees }, () => {
      const a = rnd() * Math.PI * 2
      const r = island.r * (0.5 + rnd() * 0.25)
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 0.75 + rnd() * 0.55 }
    })
  }, [index, island.r, palette.trees])

  useFrame(({ clock }, dt) => {
    // Colour arrives for good once visited; before that, her lantern coaxes a little out as she nears.
    const d = Math.hypot(sea.boat.x - island.x, sea.boat.z - island.z)
    const near = Math.min(1, Math.max(0, (15 - d) / 9))
    const want = lit ? 1 : near * 0.4
    reveal.current += (want - reveal.current) * Math.min(1, dt * (lit ? 0.7 : 2))
    if (beacon.current) {
      const t = clock.elapsedTime
      beacon.current.position.y = 7 + Math.sin(t * 1.6) * 0.35
      beacon.current.rotation.y = t * 0.8
    }
  })

  const approach = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (island.id === 'prologue' || !journey.getState().canDock(island.id)) return
    // Sail to the shore on the side the boat is coming from.
    const dx = sea.boat.x - island.x
    const dz = sea.boat.z - island.z
    const d = Math.hypot(dx, dz) || 1
    sea.target = { x: island.x + (dx / d) * (island.r + 2.2), z: island.z + (dz / d) * (island.r + 2.2) }
  }

  return (
    <group position={[island.x, 0, island.z]} onPointerDown={approach}>
      {/* A mossy rise in the clearing. */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[island.r * 1.02, island.r * 1.22, 0.36, 11]} />
        <Tone color="#7fae6e" reveal={reveal} />
      </mesh>
      <mesh geometry={land} position={[0, 0.3, 0]}>
        <Tone color={palette.land} reveal={reveal} glow={0.12} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = index * 1.3 + i * 2.2
        return (
          <mesh key={i} position={[Math.cos(a) * island.r * 0.98, 0.35, Math.sin(a) * island.r * 0.98]} rotation={[i, a, 0]} scale={0.35 + i * 0.12}>
            <dodecahedronGeometry args={[1, 0]} />
            <Tone color="#9aa3c4" reveal={reveal} />
          </mesh>
        )
      })}
      {trees.map((t, i) => (
        <Tree key={i} {...t} color={palette.tree} reveal={reveal} />
      ))}
      <Feature id={island.id} reveal={reveal} colour={chapter.colour} />
      {lit && <pointLight position={[0, 4, 0]} color={chapter.colour} intensity={30} distance={22} decay={1.6} />}

      {next && (
        <>
          <group ref={beacon}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.7, 0.05, 8, 40]} />
              <meshBasicMaterial color={GOLD} />
            </mesh>
          </group>
          <mesh position={[0, 20, 0]}>
            <cylinderGeometry args={[0.1, 0.45, 40, 12, 1, true]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.13} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
          </mesh>
        </>
      )}

      {(island.label || next) && (
        <Html center position={[0, island.label ? 6 : 8.6, 0]} distanceFactor={16} zIndexRange={[2, 0]} className="isle-tag" pointerEvents="none">
          {island.label && <b>{island.label}</b>}
          {next && <span>{chapter.title}</span>}
        </Html>
      )}
    </group>
  )
}

/* ───────────────────────── Voyage ───────────────────────── */

const KEYMAP: Record<string, keyof typeof sea.keys> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
}
const DOCK_KEYS = new Set(['KeyE', 'Enter', 'Space'])
const CANOPY = TREES.map((t) => ({ x: t.x, z: t.z, r: 2.6 * t.h }))
// Things she cannot ride through: the rise in each glade, and every tree.
const SOLID = [...ISLANDS.map((i) => ({ x: i.x, z: i.z, r: i.r + 1.1 })), ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.95 }))]

/** Puts her beside the last glade visited, facing the next. */
function placeBoat() {
  const { completed } = journey.getState()
  const at = islandOf(completed[completed.length - 1] ?? 'prologue')
  const nextId = CHAPTER_IDS.find((id) => !completed.includes(id))
  const to = nextId ? islandOf(nextId) : at
  const dx = to.x - at.x
  const dz = to.z - at.z
  const d = Math.hypot(dx, dz) || 1
  const ux = nextId && d > 1 ? dx / d : 0
  const uz = nextId && d > 1 ? dz / d : 1
  sea.boat = { x: at.x + ux * (at.r + 8), z: at.z + uz * (at.r + 8), heading: Math.atan2(-ux, -uz), speed: 0 }
  sea.target = null
  sea.trail = createTrail()
  sea.ripples = []
  sea.placed = true
}

export function World() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const look = useRef(new Vector3())
  const first = useRef(true)

  useEffect(() => {
    if (!sea.placed) placeBoat()
    const set = (down: boolean) => (e: KeyboardEvent) => {
      const k = KEYMAP[e.code]
      if (k) {
        sea.keys[k] = down
        if (down) sea.target = null
        e.preventDefault()
      } else if (down && DOCK_KEYS.has(e.code) && !e.repeat) {
        // Let a focused button handle its own Enter/Space.
        if (e.target instanceof HTMLButtonElement && e.code !== 'KeyE') return
        e.preventDefault()
        if (sea.near) goAshore(sea.near)
      }
    }
    const down = set(true)
    const up = set(false)
    const release = () => Object.keys(sea.keys).forEach((k) => (sea.keys[k as keyof typeof sea.keys] = false))
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
      release()
    }
  }, [])

  useFrame((_, dt) => {
    const k = sea.keys
    const diving = sea.diving ? islandOf(sea.diving) : null
    const turn = (diving ? 0 : (k.left ? 1 : 0) - (k.right ? 1 : 0)) as -1 | 0 | 1
    const thrust = (diving ? 0 : (k.up ? 1 : 0) - (k.down ? 1 : 0)) as -1 | 0 | 1
    sea.boat = pushOut(stepBoat(sea.boat, { turn, thrust, target: diving ? null : sea.target }, dt, SEA_BOUNDS), SOLID)
    const b = sea.boat
    if (sea.target && Math.hypot(sea.target.x - b.x, sea.target.z - b.z) < 0.6 && Math.abs(b.speed) < 0.3) sea.target = null

    const j = journey.getState()
    sea.near = nearestDockable(b, (id) => id !== 'prologue' && j.canDock(id))
    const nextId = CHAPTER_IDS.find((id) => !j.completed.includes(id))
    if (nextId) {
      const n = islandOf(nextId)
      sea.bearing = bearingTo(b, n)
      sea.distance = Math.max(0, Math.hypot(n.x - b.x, n.z - b.z) - n.r)
    }

    const picked = collectNear(b, j.marigolds)
    if (picked !== null) {
      j.pick(picked)
      sound.collect()
      try {
        navigator.vibrate?.(12)
      } catch {
        /* no haptics */
      }
    }

    const tall = size.height > size.width
    let want: Vector3
    let aim: Vector3
    if (diving) {
      // Docking: the camera leaves the boat and swoops in on the island.
      const dx = b.x - diving.x
      const dz = b.z - diving.z
      const d = Math.hypot(dx, dz) || 1
      want = new Vector3(diving.x + (dx / d) * 5.5, 3.2, diving.z + (dz / d) * 5.5)
      aim = new Vector3(diving.x, 2, diving.z)
    } else {
      // Chase camera: behind, above and slightly off the stern, pulled back on tall phone screens.
      const back = tall ? 14 : 10
      const up = tall ? 8.5 : 5.4
      const side = tall ? 1.4 : 2.4
      const f = forward(b.heading)
      // Keep the camera out of the trees, so a trunk never fills the screen.
      const clear = pushOut({ x: b.x - f.x * back - f.z * side, z: b.z - f.z * back + f.x * side }, CANOPY)
      want = new Vector3(clear.x, up, clear.z)
      aim = new Vector3(b.x + f.x * 5, 2.1, b.z + f.z * 5)
    }
    const snap = first.current
    camera.position.lerp(want, snap ? 1 : 1 - Math.exp(-dt * (diving ? 2.2 : 2.6)))
    look.current.lerp(aim, snap ? 1 : 1 - Math.exp(-dt * 4))
    camera.lookAt(look.current)
    first.current = false
  })

  return (
    <>
      <color attach="background" args={['#070b1f']} />
      <hemisphereLight args={['#aab6ff', '#1a1f45', 0.85]} />
      <directionalLight color="#dfe6ff" intensity={1.25} position={[-35, 50, -78]} />
      <fog attach="fog" args={['#081420', 34, 130]} />
      <Sky />
      <Ground />
      {ISLANDS.map((_, n) => (
        <Grove key={n} glade={n} />
      ))}
      {ISLANDS.map((i, n) => (
        <IslandMesh key={i.id} island={i} index={n} />
      ))}
      <Marigolds />
      <Fireflies />
      <Rider />
      <Companion />
    </>
  )
}

/** Called when the journey is reset, so the next voyage starts from A. */
export const resetVoyage = () => {
  sea.placed = false
}
