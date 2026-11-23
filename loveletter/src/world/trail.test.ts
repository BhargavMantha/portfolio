import { describe, expect, it } from 'vitest'
import { TRAIL_LENGTH, createTrail, flatten, pushSample } from './trail'

describe('wake trail', () => {
  it('starts empty, with every slot marked unused', () => {
    const flat = flatten(createTrail(), 0)
    expect(flat).toHaveLength(TRAIL_LENGTH * 3)
    for (let i = 2; i < flat.length; i += 3) expect(flat[i]).toBeLessThan(0)
  })

  it('records where the boat has been, with the age of each sample', () => {
    const t = createTrail()
    pushSample(t, { x: 1, z: 2 }, 10, 5)
    pushSample(t, { x: 3, z: 4 }, 10.5, 5)
    const flat = flatten(t, 11)
    const samples = [0, 1].map((i) => [flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]])
    expect(samples).toContainEqual([1, 2, 1])
    expect(samples).toContainEqual([3, 4, 0.5])
  })

  it('does not record while the boat is nearly still', () => {
    const t = createTrail()
    pushSample(t, { x: 1, z: 2 }, 10, 0.1)
    expect(flatten(t, 10).filter((_, i) => i % 3 === 2).every((age) => age < 0)).toBe(true)
  })

  it('spaces samples out instead of recording every frame', () => {
    const t = createTrail()
    for (let i = 0; i < 60; i++) pushSample(t, { x: i, z: 0 }, 10 + i / 60, 5)
    const used = flatten(t, 11).filter((v, i) => i % 3 === 2 && v >= 0).length
    expect(used).toBeGreaterThan(3)
    expect(used).toBeLessThan(12)
  })

  it('overwrites the oldest sample once full', () => {
    const t = createTrail()
    for (let i = 0; i < TRAIL_LENGTH + 5; i++) pushSample(t, { x: i, z: 0 }, i, 5)
    const xs = flatten(t, 100).filter((_, i) => i % 3 === 0)
    expect(xs).not.toContain(0)
    expect(xs).toContain(TRAIL_LENGTH + 4)
  })
})
