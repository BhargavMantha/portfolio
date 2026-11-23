import { ISLANDS, SEA_BOUNDS } from './islands'

export type Tree = { x: number; z: number; r: number; h: number; turn: number; kind: 0 | 1; glade: number }

/** Distance from a point to the trail that joins the glades in order. */
export function distanceToPath(x: number, z: number): number {
  let best = Infinity
  for (let i = 1; i < ISLANDS.length; i++) {
    const a = ISLANDS[i - 1]
    const b = ISLANDS[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t)))
  }
  return best
}

const TRAIL_CLEAR = 4.2
const GLADE_CLEAR = 3.6
const SPACING = 2.8
const MARGIN = 12

/**
 * The trees, scattered by a fixed seed so the forest is identical on every
 * visit. They thin out away from the trail, and none stands on the trail
 * or in a glade.
 */
function plant(): Tree[] {
  let s = 20221218
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const trees: Tree[] = []
  const cell = SPACING
  const grid = new Map<string, Tree[]>()
  const key = (x: number, z: number) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`

  for (let tries = 0; tries < 2600 && trees.length < 340; tries++) {
    const x = SEA_BOUNDS.minX - MARGIN + rnd() * (SEA_BOUNDS.maxX - SEA_BOUNDS.minX + MARGIN * 2)
    const z = SEA_BOUNDS.minZ - MARGIN + rnd() * (SEA_BOUNDS.maxZ - SEA_BOUNDS.minZ + MARGIN * 2)
    const d = distanceToPath(x, z)
    if (d < TRAIL_CLEAR) continue
    // Dense beside the trail, sparse far from it, where nobody looks closely.
    if (rnd() > 1.15 - d / 42) continue
    if (ISLANDS.some((g) => Math.hypot(x - g.x, z - g.z) < g.r + GLADE_CLEAR)) continue

    const cx = Math.floor(x / cell)
    const cz = Math.floor(z / cell)
    let crowded = false
    for (let i = -1; i <= 1 && !crowded; i++)
      for (let j = -1; j <= 1 && !crowded; j++)
        for (const o of grid.get(`${cx + i},${cz + j}`) ?? []) if (Math.hypot(o.x - x, o.z - z) < SPACING) crowded = true
    if (crowded) continue

    let glade = 0
    let nearest = Infinity
    ISLANDS.forEach((g, i) => {
      const gd = Math.hypot(x - g.x, z - g.z)
      if (gd < nearest) {
        nearest = gd
        glade = i
      }
    })
    const tree: Tree = { x, z, r: 0.55, h: 0.8 + rnd() * 0.9, turn: rnd() * Math.PI * 2, kind: rnd() < 0.72 ? 0 : 1, glade }
    trees.push(tree)
    const k = key(x, z)
    grid.set(k, [...(grid.get(k) ?? []), tree])
  }
  return trees
}

export const TREES = plant()

const groups = ISLANDS.map((_, i) => TREES.filter((t) => t.glade === i))
/** The trees that belong to one glade. They take its colour when it is visited. */
export const groupOf = (glade: number) => groups[glade]
