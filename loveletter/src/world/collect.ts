import { ISLANDS } from './islands'

const PICKUP_RADIUS = 2.2

/**
 * Seven marigolds drifting along the course, one for each ceremony. Six sit
 * beside the midpoints between islands, alternating sides; one waits near the start.
 */
export const MARIGOLDS: { x: number; z: number }[] = [
  { x: 8, z: -8 },
  ...ISLANDS.slice(1).map((b, i) => {
    const a = ISLANDS[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const d = Math.hypot(dx, dz)
    const side = i % 2 ? 6 : -6
    return { x: (a.x + b.x) / 2 + (-dz / d) * side, z: (a.z + b.z) / 2 + (dx / d) * side }
  }),
]

/** Index of an uncollected marigold the boat is touching, if any. */
export function collectNear(boat: { x: number; z: number }, collected: number[]): number | null {
  for (let i = 0; i < MARIGOLDS.length; i++) {
    if (collected.includes(i)) continue
    if (Math.hypot(boat.x - MARIGOLDS[i].x, boat.z - MARIGOLDS[i].z) <= PICKUP_RADIUS) return i
  }
  return null
}
