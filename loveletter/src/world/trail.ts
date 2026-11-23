/** How many wake samples the water shader reads. Must match uTrail[] in the sea shader. */
export const TRAIL_LENGTH = 16
const SPACING = 0.14 // seconds between samples
const MIN_SPEED = 0.6

export type Trail = { x: Float32Array; z: Float32Array; born: Float32Array; head: number; last: number }

export function createTrail(): Trail {
  return { x: new Float32Array(TRAIL_LENGTH), z: new Float32Array(TRAIL_LENGTH), born: new Float32Array(TRAIL_LENGTH).fill(-1), head: 0, last: -Infinity }
}

/** Records the boat's position as wake, a few times a second, while it is moving. */
export function pushSample(t: Trail, p: { x: number; z: number }, now: number, speed: number) {
  if (Math.abs(speed) < MIN_SPEED || now - t.last < SPACING) return
  t.x[t.head] = p.x
  t.z[t.head] = p.z
  t.born[t.head] = now
  t.head = (t.head + 1) % TRAIL_LENGTH
  t.last = now
}

/** x, z, age triples for the shader. An age below zero marks an unused slot. */
export function flatten(t: Trail, now: number, out = new Float32Array(TRAIL_LENGTH * 3)): Float32Array {
  for (let i = 0; i < TRAIL_LENGTH; i++) {
    out[i * 3] = t.x[i]
    out[i * 3 + 1] = t.z[i]
    out[i * 3 + 2] = t.born[i] < 0 ? -1 : now - t.born[i]
  }
  return out
}
