import { CHAPTER_IDS, type ChapterId } from '../state/journey'

export type Island = { id: ChapterId; x: number; z: number; r: number; label: 'A' | 'B' | null }

/** How close to an island's shore the boat must be to dock. */
export const DOCK_RADIUS = 4

const SPOTS: [number, number][] = [
  [0, 0],
  [-10, -22],
  [8, -42],
  [-8, -62],
  [10, -82],
  [-8, -102],
  [2, -124],
]

/** Seven islands on a winding course north, from A (the start) to B (the question). */
export const ISLANDS: Island[] = CHAPTER_IDS.map((id, i) => ({
  id,
  x: SPOTS[i][0],
  z: SPOTS[i][1],
  r: 3.4,
  label: i === 0 ? 'A' : i === CHAPTER_IDS.length - 1 ? 'B' : null,
}))

export const SEA_BOUNDS = { minX: -46, maxX: 46, minZ: -150, maxZ: 24 }

export const islandOf = (id: ChapterId) => ISLANDS.find((i) => i.id === id)!

export function nearestDockable(boat: { x: number; z: number }, canDock: (id: ChapterId) => boolean): ChapterId | null {
  let best: ChapterId | null = null
  let bestD = Infinity
  for (const i of ISLANDS) {
    const d = Math.hypot(boat.x - i.x, boat.z - i.z) - i.r
    if (d <= DOCK_RADIUS && d < bestD && canDock(i.id)) {
      best = i.id
      bestD = d
    }
  }
  return best
}

/** Angle from the bow to a target: 0 dead ahead, positive to port (left), within ±π. */
export function bearingTo(boat: { x: number; z: number; heading: number }, target: { x: number; z: number }): number {
  const a = Math.atan2(-(target.x - boat.x), -(target.z - boat.z)) - boat.heading
  return Math.atan2(Math.sin(a), Math.cos(a))
}
