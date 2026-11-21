export type Boat = { x: number; z: number; heading: number; speed: number }
export type Input = { turn: -1 | 0 | 1; thrust: -1 | 0 | 1; target?: { x: number; z: number } | null }
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number }

export const MAX_SPEED = 6
const ACCEL = 5
const DRAG = 1.3
const TURN_RATE = 1.9
const ARRIVE = 0.5

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Heading 0 faces −z; a positive heading turns left. */
export const forward = (heading: number) => ({ x: -Math.sin(heading), z: -Math.cos(heading) })

/** Advances the boat by one frame. Pure, so it can be tested without a browser. */
export function stepBoat(b: Boat, input: Input, dt: number, bounds: Bounds): Boat {
  // A long frame (tab was hidden) must not fling the boat across the sea.
  dt = clamp(dt, 0, 0.05)
  let { turn, thrust } = input as { turn: number; thrust: number }

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

  const limit = thrust < 0 ? MAX_SPEED / 2 : MAX_SPEED
  let speed = b.speed + thrust * ACCEL * dt
  speed *= Math.exp(-DRAG * dt * (thrust === 0 ? 1.6 : 0.35))
  if (input.target && thrust === 0) speed *= Math.exp(-6 * dt)
  speed = clamp(speed, -MAX_SPEED / 2, limit)

  // A boat barely moving still answers the helm a little.
  const grip = input.target ? 1 : 0.4 + 0.6 * Math.min(1, Math.abs(speed) / 2)
  const heading = wrap(b.heading + turn * TURN_RATE * grip * dt)
  const f = forward(heading)
  const x = clamp(b.x + f.x * speed * dt, bounds.minX, bounds.maxX)
  const z = clamp(b.z + f.z * speed * dt, bounds.minZ, bounds.maxZ)
  return { x, z, heading, speed }
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
