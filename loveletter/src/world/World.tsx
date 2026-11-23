import { Html, useGLTF } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  AdditiveBlending,
  AnimationMixer,
  CanvasTexture,
  BackSide,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LinearFilter,
  type Mesh,
  MeshStandardMaterial,
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
import { ROCKS, TREES, groupOf } from './forest'
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

/** How a colour looks before its glade is visited: washed out to pale stone. */
const washed = (c: Color) => {
  const l = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b
  return new Color(l, l, l).lerp(new Color('#d9dccb'), 0.55)
}

/**
 * A toon material that shows its resting colour until its glade is visited,
 * then takes its true colour. `glow` makes it shine with that colour once revealed.
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

function Tone({ color, rest, reveal, glow = 0, always = 0, veil = false }: { color: string; rest?: string; reveal: Reveal; glow?: number; always?: number; veil?: boolean }) {
  const ref = useRef<MeshToonMaterial>(null)
  const full = useMemo(() => new Color(color), [color])
  const dull = useMemo(() => (rest ? new Color(rest) : washed(new Color(color))), [color, rest])
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

const MIST = new Color('#a8d4cc')
const CLEAR = new Color('#cfe7c4')

/** Where the sun is, and so which way shadows fall on the ground. */
const SUN = new Vector3(40, 46, 34)
const SHADOW_DIR = { x: -SUN.x / Math.hypot(SUN.x, SUN.z), z: -SUN.z / Math.hypot(SUN.x, SUN.z) }
const SHADE_BOX = { x: -72, z: -178, w: 144, d: 230 }

/**
 * Tree shadows, painted once into a small texture: a soft dark streak on the
 * ground beside every tree and landmark. Far cheaper than real shadows.
 */
function bakeShadows() {
  const W = 512
  const H = 816
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  const px = W / SHADE_BOX.w
  const angle = Math.atan2(SHADOW_DIR.z, SHADOW_DIR.x)
  const blot = (x: number, z: number, long: number, wide: number, strength: number) => {
    const cx = (x + SHADOW_DIR.x * long * 0.85 - SHADE_BOX.x) * px
    const cy = (z + SHADOW_DIR.z * long * 0.85 - SHADE_BOX.z) * px
    g.save()
    g.translate(cx, cy)
    g.rotate(angle)
    g.scale(long * px, wide * px)
    const grad = g.createRadialGradient(0, 0, 0.25, 0, 0, 1)
    grad.addColorStop(0, `rgba(255,255,255,${strength})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(0, 0, 1, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  g.globalCompositeOperation = 'lighten'
  for (const t of TREES) blot(t.x, t.z, 3.4 * t.h, 1.5 * t.h, 0.95)
  for (const r of ROCKS) blot(r.x, r.z, 1.1 * r.s, 0.8 * r.s, 0.7)
  for (const i of ISLANDS) blot(i.x, i.z, i.r * 1.5, i.r * 1.0, 0.8)
  const texture = new CanvasTexture(canvas)
  texture.flipY = false
  texture.minFilter = texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}

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
      uHorizon: { value: MIST.clone() },
      uShade: { value: bakeShadows() },
      uShadeBox: { value: new Vector4(SHADE_BOX.x, SHADE_BOX.z, SHADE_BOX.w, SHADE_BOX.d) },
      uSun: { value: [SHADOW_DIR.x, SHADOW_DIR.z] },
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
    // The morning mist the far trees fade into lifts as glades are visited.
    uniforms.uHorizon.value.lerpColors(MIST, CLEAR, completed.length / CHAPTER_IDS.length)
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
        <Tone color="#6b4a3a" rest="#6b4a3a" reveal={reveal} veil />
      </instancedMesh>
      {[0, 1, 2].map((k) => (
        <instancedMesh key={k} ref={place(pines, 1.9 + k * 0.95, (h) => [h * (1 - k * 0.22), h, h * (1 - k * 0.22)])} args={[undefined, undefined, pines.length]}>
          <coneGeometry args={[1.25, 1.7, 6]} />
          <Tone color={palette.tree} rest={k === 1 ? "#3a8a3c" : "#2f7a3a"} reveal={reveal} glow={0.1} veil />
        </instancedMesh>
      ))}
      <instancedMesh ref={place(rounds, 2.6, (h) => [h, h * 1.15, h])} args={[undefined, undefined, rounds.length]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <Tone color={palette.land} rest="#5fa83a" reveal={reveal} glow={0.1} veil />
      </instancedMesh>
    </>
  )
}

/** Mossy boulders along the trail. */
function Rocks() {
  const place = (mesh: InstancedMesh | null) => {
    if (!mesh) return
    const m = new Matrix4()
    const q = new Quaternion()
    ROCKS.forEach((r, i) => {
      q.setFromAxisAngle(new Vector3(0.3, 1, 0.2).normalize(), r.turn)
      m.compose(new Vector3(r.x, r.s * 0.32, r.z), q, new Vector3(r.s, r.s * 0.72, r.s * 0.9))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }
  return (
    <instancedMesh ref={place} args={[undefined, undefined, ROCKS.length]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshToonMaterial gradientMap={ramp} color="#8d7c66" />
    </instancedMesh>
  )
}

/* ───────────────────────── Sky ───────────────────────── */

function Sky() {
  const ref = useRef<Group>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uDawn: { value: 0 }, uSunDir: { value: SUN.clone().normalize() } }), [])

  useFrame(({ clock, camera }, dt) => {
    ref.current?.position.copy(camera.position)
    uniforms.uTime.value = clock.elapsedTime
    const dawn = journey.getState().completed.length / CHAPTER_IDS.length
    uniforms.uDawn.value += (dawn - uniforms.uDawn.value) * Math.min(1, dt * 0.5)
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

/* ───────────────────────── Ana and her unicorn ───────────────────────── */

const HORSE_URL = `${import.meta.env.BASE_URL}models/horse.glb`
/** The model is in its own large units; this brings it to about 2.3 high. */
const HORSE_SCALE = 0.0125

/** Position of one vertex of a morph-animated mesh, in the mesh's own space, at this instant. */
function morphed(mesh: Mesh, index: number, out: Vector3) {
  const base = mesh.geometry.attributes.position
  out.fromBufferAttribute(base, index)
  const targets = mesh.geometry.morphAttributes.position
  const weights = mesh.morphTargetInfluences
  if (!targets || !weights) return out
  const relative = mesh.geometry.morphTargetsRelative
  const v = new Vector3()
  let sum = 0
  const origin = out.clone()
  for (let i = 0; i < targets.length; i++) {
    const w = weights[i]
    if (!w) continue
    v.fromBufferAttribute(targets[i], index)
    if (relative) out.addScaledVector(v, w)
    else {
      out.addScaledVector(v.sub(origin), w)
      sum += w
    }
  }
  return out
}

/**
 * Ana on her unicorn. The unicorn is a modelled horse with a real galloping
 * stride; the horn and Ana are attached to points on its head and back, so
 * they move with every stride.
 */
function Rider() {
  const ref = useRef<Group>(null)
  const horn = useRef<Group>(null)
  const ana = useRef<Group>(null)
  const gltf = useGLTF(HORSE_URL)

  const { horse, mixer, head, seat, facing } = useMemo(() => {
    const horse = gltf.scene.clone(true)
    let mesh: Mesh | null = null
    horse.traverse((o) => {
      if ((o as Mesh).isMesh) mesh = o as Mesh
    })
    const m = mesh as unknown as Mesh
    // A white coat, shaded in flat facets like the rest of the world.
    m.material = new MeshStandardMaterial({ color: '#fdfaf6', roughness: 0.85, metalness: 0, flatShading: true })
    const pos = m.geometry.attributes.position
    m.geometry.computeBoundingBox()
    const box = m.geometry.boundingBox!
    // Which end is the head? The neck holds it high, so the highest points sit at that end.
    let high = 0
    let count = 0
    let top = 0
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > box.max.y * 0.86) {
        high += pos.getZ(i)
        count++
      }
      if (pos.getY(i) > pos.getY(top)) top = i
    }
    const midZ = (box.min.z + box.max.z) / 2
    const facing = high / Math.max(1, count) > midZ ? 1 : -1
    // The seat: the highest point on the back, a little behind the middle.
    const seatZ = midZ - facing * (box.max.z - box.min.z) * 0.06
    let seat = 0
    let best = -Infinity
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getZ(i) - seatZ) < 12 && Math.abs(pos.getX(i)) < 9 && pos.getY(i) > best) {
        best = pos.getY(i)
        seat = i
      }
    }
    const mixer = new AnimationMixer(horse)
    if (gltf.animations[0]) mixer.clipAction(gltf.animations[0]).play()
    return { horse, mixer, mesh: m, head: top, seat, facing }
  }, [gltf])

  const body = useMemo(() => {
    let mesh: Mesh | null = null
    horse.traverse((o) => {
      if ((o as Mesh).isMesh) mesh = o as Mesh
    })
    return mesh as unknown as Mesh
  }, [horse])

  const at = useMemo(() => new Vector3(), [])
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const { x, z, heading, speed } = sea.boat
    const pace = Math.min(1, Math.abs(speed) / 6)
    // The stride keeps time with her speed, and stills when she stops.
    mixer.timeScale = pace * 1.25
    mixer.update(dt)
    const turn = (sea.keys.left ? 1 : 0) - (sea.keys.right ? 1 : 0)
    g.position.set(x, 0, z)
    g.rotation.set(0, heading, turn * 0.08 * pace, 'YXZ')
    riderAt.value.set(x, 2, z)
    if (horn.current) horn.current.position.copy(morphed(body, head, at)).multiplyScalar(HORSE_SCALE)
    if (ana.current) ana.current.position.copy(morphed(body, seat, at)).multiplyScalar(HORSE_SCALE)
  })

  const gown = <meshToonMaterial gradientMap={ramp} color="#7b4bb3" emissive="#7b4bb3" emissiveIntensity={0.12} />
  const skin = <meshToonMaterial gradientMap={ramp} color="#c58d68" />
  const hair = <meshToonMaterial gradientMap={ramp} color="#231629" />

  return (
    <group ref={ref}>
      {/* Turned so the horse faces the way she is riding (−z). */}
      <group rotation={[0, facing > 0 ? Math.PI : 0, 0]}>
        <primitive object={horse} scale={HORSE_SCALE} />
        <group ref={horn}>
          <mesh position={[0, 0.22, facing * 0.2]} rotation={[facing * 0.5, 0, 0]}>
            <coneGeometry args={[0.06, 0.62, 8]} />
            <meshStandardMaterial color="#ffd76a" emissive="#ffb82e" emissiveIntensity={0.7} roughness={0.35} metalness={0.4} />
          </mesh>
        </group>
        {/* Ana: purple gown, long dark hair, a small tiara and a marigold. */}
        <group ref={ana} rotation={[0, facing > 0 ? Math.PI : 0, 0]}>
          <mesh position={[0, 0.02, 0]} scale={[1.45, 1, 1.2]}>
            <coneGeometry args={[0.5, 0.95, 10]} />
            {gown}
          </mesh>
          <mesh position={[0, 0.6, -0.02]}>
            <cylinderGeometry args={[0.13, 0.19, 0.5, 8]} />
            {gown}
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.2, 0.58, -0.24]} rotation={[-1.05, 0, side * 0.22]}>
              <cylinderGeometry args={[0.045, 0.04, 0.52, 6]} />
              {skin}
            </mesh>
          ))}
          <mesh position={[0, 1.02, -0.03]}>
            <sphereGeometry args={[0.175, 14, 14]} />
            {skin}
          </mesh>
          <mesh position={[0, 1.06, 0.02]} scale={[1.08, 1.05, 1.08]}>
            <sphereGeometry args={[0.18, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            {hair}
          </mesh>
          <mesh position={[0, 0.62, 0.17]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.27, 0.78, 0.1]} />
            {hair}
          </mesh>
          <mesh position={[0, 1.2, -0.02]}>
            <torusGeometry args={[0.13, 0.018, 6, 20]} />
            <meshStandardMaterial color="#ffd76a" emissive="#ffb82e" emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0.16, 1.1, 0.03]}>
            <dodecahedronGeometry args={[0.06, 0]} />
            <meshBasicMaterial color="#f7a521" />
          </mesh>
        </group>
      </group>
    </group>
  )
}
useGLTF.preload(HORSE_URL)

/** A butterfly that flies ahead of her towards the next glade, showing the way. */
function Companion() {
  const ref = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  const pos = useRef(new Vector3(0, 2, 0))
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const b = sea.boat
    const lead = b.heading + sea.bearing * 0.85
    const f = forward(lead)
    const want = new Vector3(
      b.x + f.x * 4.4 + Math.sin(t * 1.7) * 0.7,
      2.6 + Math.sin(t * 2.3) * 0.4 + Math.sin(t * 0.7) * 0.25,
      b.z + f.z * 4.4 + Math.cos(t * 1.3) * 0.7,
    )
    pos.current.lerp(want, 1 - Math.exp(-dt * 3))
    g.position.copy(pos.current)
    g.rotation.y = lead + Math.sin(t * 1.1) * 0.5
    const flap = Math.sin(t * 16) * 0.9
    if (left.current) left.current.rotation.z = 0.25 + flap
    if (right.current) right.current.rotation.z = -0.25 - flap
  })
  const wing = <meshBasicMaterial color="#ff8fc7" side={DoubleSide} />
  return (
    <group ref={ref}>
      <group ref={left}>
        <mesh position={[-0.17, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 6]} />
          {wing}
        </mesh>
      </group>
      <group ref={right}>
        <mesh position={[0.17, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 6]} />
          {wing}
        </mesh>
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.022, 0.2, 2, 5]} />
        <meshBasicMaterial color="#3a2a4a" />
      </mesh>
    </group>
  )
}

/** Drifting motes of pollen gather over every glade she has visited. */
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
      uColor: { value: new Color('#fffbe6') },
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
      <shaderMaterial uniforms={uniforms} vertexShader={fireflyVertex} fragmentShader={fireflyFragment} transparent depthWrite={false} />
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
        <Tone color="#7fc24e" rest="#6fb040" reveal={reveal} />
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
      {lit && <pointLight position={[0, 4, 0]} color={chapter.colour} intensity={9} distance={16} decay={1.6} />}

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
            <meshBasicMaterial color="#fff3c2" transparent opacity={0.34} depthWrite={false} side={DoubleSide} />
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
      <color attach="background" args={['#a8d4cc']} />
      <hemisphereLight args={['#dff1ff', '#4f7a34', 1.25]} />
      <directionalLight color="#fff1d0" intensity={2.1} position={SUN.toArray()} />
      <fog attach="fog" args={['#a8d4cc', 38, 135]} />
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
      <Rocks />
      <Suspense fallback={null}>
        <Rider />
      </Suspense>
      <Companion />
    </>
  )
}

/** Called when the journey is reset, so the next voyage starts from A. */
export const resetVoyage = () => {
  sea.placed = false
}
