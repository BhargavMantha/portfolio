import { Html } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, PlaneGeometry, Vector3 } from 'three'
import { CEREMONY, chapterById } from '../content/chapters'
import { CEREMONY_ORDER } from '../content/manifest'
import { CHAPTER_IDS, journey, useJourney, type ChapterId } from '../state/journey'
import { ISLANDS, SEA_BOUNDS, bearingTo, islandOf, nearestDockable, type Island } from './islands'
import { WAVE_GLSL, sea, waveHeight } from './sea'
import { forward, pushOut, stepBoat } from './steer'

const GOLD = '#f2b631'
const CREAM = '#f7f1e5'
const ROCK = '#1b2140'

/* ───────────────────────── Sea ───────────────────────── */

const seaVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  ${WAVE_GLSL}
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    w.y += waveHeight(w.xz, uTime);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const seaFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uIsle[7];      // x, z, lit (0–1)
  uniform vec3 uIsleCol[7];
  uniform vec3 uBoat;         // x, z, lantern strength
  uniform vec3 uHorizon;
  varying vec3 vWorld;
  ${WAVE_GLSL}

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 p = vWorld.xz;
    // Surface normal from the same wave function the vertices use.
    float e = 0.35;
    float hx = waveHeight(p + vec2(e, 0.0), uTime) - waveHeight(p - vec2(e, 0.0), uTime);
    float hz = waveHeight(p + vec2(0.0, e), uTime) - waveHeight(p - vec2(0.0, e), uTime);
    vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

    vec3 col = mix(vec3(0.016, 0.026, 0.078), vec3(0.060, 0.085, 0.200), fres);

    // Moonlight glitter.
    vec3 moon = normalize(vec3(-0.35, 0.55, -0.75));
    float spec = pow(max(dot(reflect(-moon, n), v), 0.0), 90.0);
    col += vec3(0.75, 0.82, 1.0) * spec * 0.55;

    // Each visited island lights the water around it in its own colour.
    float ripple = 0.75 + 0.25 * sin(length(p) * 1.6 - uTime * 1.4 + hx * 9.0);
    for (int i = 0; i < 7; i++) {
      float d = distance(p, uIsle[i].xy);
      col += uIsleCol[i] * uIsle[i].z * exp(-d * d / 150.0) * 0.55 * ripple;
      col += uIsleCol[i] * uIsle[i].z * exp(-d * d / 24.0) * 0.5;
    }
    // The boat's lantern.
    float bd = distance(p, uBoat.xy);
    col += vec3(1.0, 0.78, 0.36) * uBoat.z * (exp(-bd * bd / 14.0) * 0.55 + exp(-bd * bd / 90.0) * 0.12);

    float dist = distance(cameraPosition.xz, p);
    col = mix(col, uHorizon, smoothstep(55.0, 150.0, dist));
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
    gl_FragColor = vec4(col, 1.0);
  }
`

function Sea({ detail }: { detail: number }) {
  const completed = useJourney((s) => s.completed)
  const geometry = useMemo(() => new PlaneGeometry(340, 340, detail, detail).rotateX(-Math.PI / 2), [detail])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIsle: { value: ISLANDS.map((i) => new Vector3(i.x, i.z, 0)) },
      uIsleCol: { value: ISLANDS.map((i) => new Color(chapterById(i.id).colour)) },
      uBoat: { value: new Vector3(0, 0, 1) },
      uHorizon: { value: new Color('#0a0f26') },
    }),
    [],
  )

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uBoat.value.set(sea.boat.x, sea.boat.z, 1)
    // Lights come up gently rather than snapping on.
    uniforms.uIsle.value.forEach((u, i) => {
      const lit = completed.includes(ISLANDS[i].id) ? 1 : 0
      u.z += (lit - u.z) * Math.min(1, dt * 0.8)
    })
  })

  const sailTo = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    sea.target = { x: e.point.x, z: e.point.z }
  }

  return (
    <mesh geometry={geometry} position={[0, 0, -62]} onPointerDown={sailTo}>
      <shaderMaterial uniforms={uniforms} vertexShader={seaVertex} fragmentShader={seaFragment} />
    </mesh>
  )
}

/* ───────────────────────── Sky ───────────────────────── */

function Sky() {
  const group = useRef<Group>(null)
  const stars = useMemo(() => {
    const pts: number[] = []
    // Deterministic scatter so the sky is the same on every visit.
    let s = 1812
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 900; i++) {
      const a = rnd() * Math.PI * 2
      const y = 0.06 + rnd() * 0.94
      const r = Math.sqrt(1 - y * y)
      pts.push(Math.cos(a) * r * 230, y * 230, Math.sin(a) * r * 230)
    }
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pts, 3))
  }, [])

  useFrame(({ camera }) => group.current?.position.set(camera.position.x, 0, camera.position.z))

  return (
    <group ref={group}>
      <points geometry={stars}>
        <pointsMaterial color={CREAM} size={1.6} sizeAttenuation={false} transparent opacity={0.85} depthWrite={false} fog={false} />
      </points>
      <mesh position={[-90, 120, -190]}>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial color="#fdf3d2" fog={false} />
      </mesh>
    </group>
  )
}

/* ───────────────────────── Boat ───────────────────────── */

function paperBoat() {
  // A folded paper boat: a long shallow hull with a low peak along the centreline.
  const bow = [0, 0.62, -2.2]
  const stern = [0, 0.62, 2.2]
  const left = [-0.85, 0.4, 0]
  const right = [0.85, 0.4, 0]
  const keelF = [0, -0.08, -1.0]
  const keelB = [0, -0.08, 1.0]
  const peak = [0, 1.2, 0]
  const sf = [0, 0.36, -1.15]
  const sb = [0, 0.36, 1.15]
  const sl = [-0.2, 0.36, 0]
  const sr = [0.2, 0.36, 0]
  const tris = [
    // hull, port and starboard
    bow, keelF, left, left, keelF, keelB, left, keelB, stern,
    bow, right, keelF, right, keelB, keelF, right, stern, keelB,
    // the folded centre peak: long fore and aft, thin across
    sl, sf, peak, sf, sr, peak, sr, sb, peak, sb, sl, peak,
  ]
  const g = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(tris.flat(), 3))
  g.computeVertexNormals()
  return g
}

function Boat() {
  const ref = useRef<Group>(null)
  const geometry = useMemo(paperBoat, [])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const { x, z, heading, speed } = sea.boat
    const t = clock.elapsedTime
    const f = forward(heading)
    const y = waveHeight(x, z, t)
    const pitch = waveHeight(x + f.x, z + f.z, t) - waveHeight(x - f.x, z - f.z, t)
    const roll = waveHeight(x - f.z, z + f.x, t) - waveHeight(x + f.z, z - f.x, t)
    const turn = (sea.keys.left ? 1 : 0) - (sea.keys.right ? 1 : 0)
    g.position.set(x, y + 0.08, z)
    g.rotation.set(pitch * 0.5, heading, roll * 0.5 + turn * 0.12 * Math.min(1, Math.abs(speed) / 3), 'YXZ')
  })

  return (
    <group ref={ref}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={CREAM} emissive={CREAM} emissiveIntensity={0.16} roughness={0.9} flatShading side={DoubleSide} />
      </mesh>
      {/* The lantern she lit in the prologue. */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial color="#fff1c4" />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color={GOLD} intensity={9} distance={16} decay={1.6} />
    </group>
  )
}

/* ───────────────────────── Islands ───────────────────────── */

type Lit = { lit: boolean; colour: string }

const glow = (on: boolean, colour: string, strength = 1.6) => ({
  emissive: colour,
  emissiveIntensity: on ? strength : 0.04,
})

function Feature({ id, lit, colour }: Lit & { id: ChapterId }) {
  const spin = useRef<Group>(null)
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * (lit ? 0.5 : 0.08)
  })
  const stone = <meshStandardMaterial color="#2a3157" roughness={1} flatShading />

  switch (id) {
    case 'prologue':
      return (
        <group>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 2.2, 6]} />
            {stone}
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <sphereGeometry args={[0.24, 12, 12]} />
            <meshStandardMaterial color="#fff1c4" {...glow(true, GOLD, 2.4)} />
          </mesh>
          <mesh position={[0, 0.42, 3.1]}>
            <boxGeometry args={[1.1, 0.12, 2.6]} />
            {stone}
          </mesh>
        </group>
      )
    case 'quiet':
      return (
        <group position={[0, 1.15, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 1.3, 1.5]} />
            {stone}
          </mesh>
          <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.35, 1, 4]} />
            {stone}
          </mesh>
          {/* One lit window. It was always on. */}
          <mesh position={[0, 0.05, 0.76]}>
            <planeGeometry args={[0.34, 0.46]} />
            <meshStandardMaterial color="#ffe2a0" {...glow(true, GOLD, lit ? 2.6 : 1.3)} />
          </mesh>
        </group>
      )
    case 'lumiere':
      return (
        <group>
          <mesh position={[0, 2.3, 0]}>
            <cylinderGeometry args={[0.38, 0.62, 3.6, 8]} />
            <meshStandardMaterial color="#39406b" roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 4.35, 0]}>
            <sphereGeometry args={[0.42, 14, 14]} />
            <meshStandardMaterial color="#fff1c4" {...glow(lit, colour, 3)} />
          </mesh>
        </group>
      )
    case 'colours':
      return (
        <group ref={spin} position={[0, 0.9, 0]}>
          {CEREMONY_ORDER.map((key, i) => {
            const a = (i / CEREMONY_ORDER.length) * Math.PI * 2
            const c = CEREMONY[key].colour
            return (
              <group key={key} position={[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9]} rotation={[0, -a, 0]}>
                <mesh position={[0, 0.9, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 2.2, 5]} />
                  {stone}
                </mesh>
                <mesh position={[0.32, 1.7, 0]}>
                  <boxGeometry args={[0.6, 0.38, 0.03]} />
                  <meshStandardMaterial color={c} {...glow(lit, c, 1.5)} />
                </mesh>
              </group>
            )
          })}
        </group>
      )
    case 'home':
      return (
        <group position={[0, 1.2, 0]}>
          <mesh position={[-0.4, 0, 0]}>
            <boxGeometry args={[2, 1.4, 1.6]} />
            {stone}
          </mesh>
          <mesh position={[-0.4, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.7, 1, 4]} />
            {stone}
          </mesh>
          {[-0.85, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.05, 0.81]}>
              <planeGeometry args={[0.36, 0.46]} />
              <meshStandardMaterial color="#ffe2a0" {...glow(lit, GOLD, 2.4)} />
            </mesh>
          ))}
          <mesh position={[1.5, 0.5, 0.4]}>
            <coneGeometry args={[0.6, 2.2, 6]} />
            <meshStandardMaterial color="#1f4a3a" roughness={1} flatShading {...glow(lit, '#3f7d4a', 0.5)} />
          </mesh>
        </group>
      )
    case 'days':
      return (
        <group ref={spin} position={[0, 2.4, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.5, i * 0.8, 0]}>
              <torusGeometry args={[1 + i * 0.32, 0.035, 6, 48]} />
              <meshStandardMaterial color={colour} {...glow(lit, colour, 2)} />
            </mesh>
          ))}
        </group>
      )
    case 'epilogue':
      return (
        <group position={[0, 0.7, 0]}>
          <mesh>
            <torusGeometry args={[1.9, 0.16, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#3a2d63" roughness={1} flatShading {...glow(lit, colour, 1.2)} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.3, 14, 14]} />
            <meshStandardMaterial color="#fff1c4" {...glow(true, GOLD, lit ? 3 : 1)} />
          </mesh>
        </group>
      )
  }
}

function IslandMesh({ island }: { island: Island }) {
  const completed = useJourney((s) => s.completed)
  const lit = completed.includes(island.id)
  const next = CHAPTER_IDS.find((id) => !completed.includes(id)) === island.id
  const chapter = chapterById(island.id)
  const beacon = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (!beacon.current) return
    const t = clock.elapsedTime
    beacon.current.position.y = 6.4 + Math.sin(t * 1.6) * 0.35
    beacon.current.rotation.y = t * 0.8
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
      <mesh position={[0, -0.15, 0]} scale={[1, 0.36, 1]}>
        <icosahedronGeometry args={[island.r, 1]} />
        <meshStandardMaterial color={ROCK} roughness={1} flatShading {...glow(lit, chapter.colour, 0.22)} />
      </mesh>
      <Feature id={island.id} lit={lit} colour={chapter.colour} />
      {lit && <pointLight position={[0, 3.2, 0]} color={chapter.colour} intensity={26} distance={20} decay={1.7} />}

      {next && (
        <>
          <group ref={beacon}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.7, 0.05, 8, 40]} />
              <meshBasicMaterial color={GOLD} />
            </mesh>
          </group>
          <mesh position={[0, 20, 0]}>
            <cylinderGeometry args={[0.12, 0.5, 40, 12, 1, true]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
          </mesh>
        </>
      )}

      {(island.label || next) && (
        <Html center position={[0, island.label ? 5.6 : 8, 0]} distanceFactor={16} zIndexRange={[2, 0]} className="isle-tag" pointerEvents="none">
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
const SHORES = ISLANDS.map((i) => ({ x: i.x, z: i.z, r: i.r + 1.1 }))

/** Puts the boat beside the last island visited, pointing at the next. */
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
  sea.placed = true
}

export function World({ detail }: { detail: number }) {
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
        if (sea.near) journey.getState().dock(sea.near)
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

  useFrame(({ clock }, dt) => {
    const k = sea.keys
    const turn = ((k.left ? 1 : 0) - (k.right ? 1 : 0)) as -1 | 0 | 1
    const thrust = ((k.up ? 1 : 0) - (k.down ? 1 : 0)) as -1 | 0 | 1
    sea.boat = pushOut(stepBoat(sea.boat, { turn, thrust, target: sea.target }, dt, SEA_BOUNDS), SHORES)
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

    // Chase camera: behind and above, pulled back further on tall phone screens.
    const tall = size.height > size.width
    const back = tall ? 15 : 10.5
    const up = tall ? 8.5 : 5
    const f = forward(b.heading)
    const t = clock.elapsedTime
    // Slightly off the stern, so the hull is seen three-quarter on.
    const side = tall ? 1.6 : 2.6
    const want = new Vector3(b.x - f.x * back - f.z * side, up + waveHeight(b.x, b.z, t) * 0.3, b.z - f.z * back + f.x * side)
    const ease = first.current ? 1 : 1 - Math.exp(-dt * 2.6)
    camera.position.lerp(want, ease)
    look.current.lerp(new Vector3(b.x + f.x * 5, 1.4, b.z + f.z * 5), first.current ? 1 : 1 - Math.exp(-dt * 4))
    camera.lookAt(look.current)
    first.current = false
  })

  return (
    <>
      <color attach="background" args={['#070b1f']} />
      <ambientLight color="#8d9bff" intensity={0.5} />
      <directionalLight color="#cfd8ff" intensity={0.9} position={[-35, 55, -75]} />
      <Sky />
      <Sea detail={detail} />
      {ISLANDS.map((i) => (
        <IslandMesh key={i.id} island={i} />
      ))}
      <Boat />
    </>
  )
}

/** Called when the journey is reset, so the next voyage starts from A. */
export const resetVoyage = () => {
  sea.placed = false
}
