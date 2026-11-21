import { describe, expect, it } from 'vitest'
import { CHAPTER_IDS } from '../state/journey'
import { DOCK_RADIUS, ISLANDS, bearingTo, nearestDockable } from './islands'

describe('islands', () => {
  it('has one island per chapter, in order, from A to B', () => {
    expect(ISLANDS.map((i) => i.id)).toEqual([...CHAPTER_IDS])
    expect(ISLANDS[0].label).toBe('A')
    expect(ISLANDS[6].label).toBe('B')
    expect(ISLANDS.slice(1, 6).every((i) => i.label === null)).toBe(true)
  })

  it('spaces neighbours 18 to 30 units apart', () => {
    for (let i = 1; i < ISLANDS.length; i++) {
      const d = Math.hypot(ISLANDS[i].x - ISLANDS[i - 1].x, ISLANDS[i].z - ISLANDS[i - 1].z)
      expect(d).toBeGreaterThanOrEqual(18)
      expect(d).toBeLessThanOrEqual(30)
    }
  })
})

describe('nearestDockable', () => {
  const quiet = ISLANDS[1]
  const beside = { x: quiet.x + quiet.r + 1, z: quiet.z }

  it('finds the island the boat is beside', () => {
    expect(nearestDockable(beside, () => true)).toBe('quiet')
  })
  it('ignores a locked island', () => {
    expect(nearestDockable(beside, (id) => id !== 'quiet')).toBeNull()
  })
  it('finds nothing in open water', () => {
    expect(nearestDockable({ x: quiet.x + quiet.r + DOCK_RADIUS + 1, z: quiet.z }, () => true)).toBeNull()
  })
})

describe('bearingTo', () => {
  it('is zero when the target is dead ahead', () => {
    expect(bearingTo({ x: 0, z: 0, heading: 0 }, { x: 0, z: -10 })).toBeCloseTo(0)
  })
  it('is positive when the target is to the left', () => {
    expect(bearingTo({ x: 0, z: 0, heading: 0 }, { x: -10, z: 0 })).toBeCloseTo(Math.PI / 2)
  })
  it('stays within half a turn either way', () => {
    const b = bearingTo({ x: 0, z: 0, heading: 3 }, { x: 0, z: 10 })
    expect(Math.abs(b)).toBeLessThanOrEqual(Math.PI)
  })
})
