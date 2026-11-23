/** `yaw` is how fast she is turning right now (rad/s), kept so turns have momentum. */
export type Boat = { x: number; z: number; heading: number; speed: number; yaw?: number }
export type Input = { turn: -1 | 0 | 1; thrust: -1 | 0 | 1; target?: { x: number; z: number } | null; sprint?: boolean }
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number }

/** Top speed at an easy canter. */
export const MAX_SPEED = 6.5
/** Top speed at a full gallop (Shift held). */
export const GALLOP_SPEED = 11
const ACCEL = 4.6
const GALLOP_ACCEL = 6.5
const DRAG = 1.3
/** Turn rate when walking; it falls to about half at a full gallop, so fast turns are wide. */
const TURN_RATE = 2.3
/** How quickly the turn rate follows the reins. Lower is heavier. */
const YAW_RESPONSE = 7
const ARRIVE = 0.5

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Heading 0 faces −z; a positive heading turns left. */
export const forward = (heading: number) => ({ x: -Math.sin(heading), z: -Math.cos(heading) })

export type Gait = 'stand' | 'walk' | 'trot' | 'canter' | 'gallop'
/** The gait a horse would be in at this speed. */
export function gaitOf(speed: number): Gait {
  const s = Math.abs(speed)
  if (s < 0.25) return 'stand'
  if (s < 2) return 'walk'
  if (s < 4.2) return 'trot'
  if (s < 7.5) return 'canter'
  return 'gallop'
}

/** Advances her by one frame. Pure, so it can be tested without a browser. */
export function stepBoat(b: Boat, input: Input, dt: number, bounds: Bounds): Boat {
  // A long frame (tab was hidden) must not fling her across the forest.
  dt = clamp(dt, 0, 0.05)
  let { turn, thrust } = input as { turn: number; thrust: number }
  const sprint = !!input.sprint && !input.target && thrust > 0

  if (input.target) {
    const dx = input.target.x - b.x
    const dz = input.target.z - b.z
    const dist = Math.hypot(dx, dz)
    if (dist < ARRIVE) {
      thrust = 0
      turn = 0
    } else {
      const off = wrap(Math.atan2(-dx, -dz) - b.heading)
      turn = clamp(off * 2.5, -1, 1)
      // Turn on the spot first, ease off on arrival so it does not overshoot.
      const facing = Math.max(0, Math.cos(off))
      thrust = facing * clamp(dist / 5, 0.25, 1)
    }
  }

  const top = sprint ? GALLOP_SPEED : MAX_SPEED
  let speed = b.speed + thrust * (sprint ? GALLOP_ACCEL : ACCEL) * dt
  speed *= Math.exp(-DRAG * dt * (thrust === 0 ? 1.6 : 0.35))
  if (input.target && thrust === 0) speed *= Math.exp(-6 * dt)
  // Letting go of Shift settles her back to a canter rather than stopping dead.
  if (speed > top) speed = Math.max(top, speed - 3.5 * dt)
  speed = clamp(speed, -MAX_SPEED / 2, GALLOP_SPEED)

  // Fast means wide turns; standing still she can still pivot.
  const pace = Math.min(1, Math.abs(speed) / GALLOP_SPEED)
  const grip = input.target ? 1 : 0.55 + 0.45 * Math.min(1, Math.abs(speed) / 1.5)
  const want = turn * TURN_RATE * grip * (1 - 0.5 * pace)
  const yaw = (b.yaw ?? 0) + (want - (b.yaw ?? 0)) * (1 - Math.exp(-YAW_RESPONSE * dt))
  const heading = wrap(b.heading + yaw * dt)
  const f = forward(heading)
  const x = clamp(b.x + f.x * speed * dt, bounds.minX, bounds.maxX)
  const z = clamp(b.z + f.z * speed * dt, bounds.minZ, bounds.maxZ)
  return { x, z, heading, speed, yaw }
}

/** Vertical motion of a jump. Pure. */
export const JUMP_SPEED = 5.4
export const GRAVITY = 15
export function stepJump(j: { y: number; vy: number }, dt: number): { y: number; vy: number; landed: boolean } {
  dt = clamp(dt, 0, 0.05)
  if (j.y <= 0 && j.vy <= 0) return { y: 0, vy: 0, landed: false }
  const vy = j.vy - GRAVITY * dt
  const y = j.y + vy * dt
  if (y <= 0) return { y: 0, vy: 0, landed: true }
  return { y, vy, landed: false }
}

/** Moves a point out of any island it has drifted into. */
export function pushOut<T extends { x: number; z: number }>(p: T, islands: { x: number; z: number; r: number }[]): T {
  let { x, z } = p
  let moved = false
  for (const i of islands) {
    const dx = x - i.x
    const dz = z - i.z
    const d = Math.hypot(dx, dz)
    if (d >= i.r) continue
    const ux = d > 1e-6 ? dx / d : 0
    const uz = d > 1e-6 ? dz / d : 1
    x = i.x + ux * i.r
    z = i.z + uz * i.r
    moved = true
  }
  return moved ? { ...p, x, z } : p
}
