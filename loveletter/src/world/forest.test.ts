import { describe, expect, it } from 'vitest'
import { TREES, distanceToPath, groupOf } from './forest'
import { ISLANDS, SEA_BOUNDS } from './islands'

describe('distanceToPath', () => {
  it('is zero on a glade and at the midpoint between two glades', () => {
    expect(distanceToPath(ISLANDS[0].x, ISLANDS[0].z)).toBeCloseTo(0)
    const a = ISLANDS[2]
    const b = ISLANDS[3]
    expect(distanceToPath((a.x + b.x) / 2, (a.z + b.z) / 2)).toBeCloseTo(0)
  })
  it('grows as you step off the trail', () => {
    expect(distanceToPath(40, -60)).toBeGreaterThan(25)
  })
  it('measures from the ends of the trail, not an endless line through them', () => {
    const last = ISLANDS[6]
    expect(distanceToPath(last.x, last.z - 30)).toBeCloseTo(30, 0)
  })
})

describe('the forest', () => {
  it('is a real forest', () => {
    expect(TREES.length).toBeGreaterThan(220)
    expect(TREES.length).toBeLessThan(420)
  })

  it('is the same forest on every visit', async () => {
    const again = (await import('./forest')).TREES
    expect(again.slice(0, 5)).toEqual(TREES.slice(0, 5))
  })

  it('leaves the trail between glades clear to ride', () => {
    for (const t of TREES) expect(distanceToPath(t.x, t.z)).toBeGreaterThan(3.4)
  })

  it('leaves every glade open', () => {
    for (const t of TREES) for (const g of ISLANDS) expect(Math.hypot(t.x - g.x, t.z - g.z)).toBeGreaterThan(g.r + 3)
  })

  it('keeps the trees apart, so she is never boxed in', () => {
    for (let i = 0; i < TREES.length; i++)
      for (let j = i + 1; j < TREES.length; j++) expect(Math.hypot(TREES[i].x - TREES[j].x, TREES[i].z - TREES[j].z)).toBeGreaterThan(2.4)
  })

  it('stays inside the world', () => {
    for (const t of TREES) {
      expect(t.x).toBeGreaterThanOrEqual(SEA_BOUNDS.minX - 14)
      expect(t.x).toBeLessThanOrEqual(SEA_BOUNDS.maxX + 14)
      expect(t.z).toBeGreaterThanOrEqual(SEA_BOUNDS.minZ - 14)
      expect(t.z).toBeLessThanOrEqual(SEA_BOUNDS.maxZ + 14)
    }
  })

  it('assigns every tree to its nearest glade, which is what colours it', () => {
    for (const t of TREES.slice(0, 60)) {
      const nearest = ISLANDS.map((g, i) => [Math.hypot(t.x - g.x, t.z - g.z), i]).sort((a, b) => a[0] - b[0])[0][1]
      expect(t.glade).toBe(nearest)
    }
    expect(groupOf(0).length + groupOf(6).length).toBeGreaterThan(0)
    expect(ISLANDS.map((_, i) => groupOf(i).length).reduce((a, b) => a + b)).toBe(TREES.length)
  })
})
