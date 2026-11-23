import { describe, expect, it } from 'vitest'
import { ISLANDS } from './islands'
import { MARIGOLDS, collectNear } from './collect'

describe('marigolds', () => {
  it('scatters seven, one for each ceremony of the wedding', () => {
    expect(MARIGOLDS).toHaveLength(7)
  })

  it('keeps every flower in open water, clear of the islands', () => {
    for (const m of MARIGOLDS) for (const i of ISLANDS) expect(Math.hypot(m.x - i.x, m.z - i.z)).toBeGreaterThan(i.r + 3)
  })

  it('picks up a flower the boat sails over', () => {
    const m = MARIGOLDS[2]
    expect(collectNear({ x: m.x + 0.5, z: m.z }, [])).toBe(2)
  })

  it('does not pick up the same flower twice', () => {
    const m = MARIGOLDS[2]
    expect(collectNear({ x: m.x, z: m.z }, [2])).toBeNull()
  })

  it('picks up nothing in empty water', () => {
    expect(collectNear({ x: 40, z: 20 }, [])).toBeNull()
  })
})
