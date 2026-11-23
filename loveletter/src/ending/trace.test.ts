import { describe, expect, it } from 'vitest'
import { UNICORN, advance, isComplete, pathSoFar } from './trace'

const at = (i: number) => ({ x: UNICORN.stars[i][0], y: UNICORN.stars[i][1] })

describe('drawing the constellation', () => {
  it('begins with the first star already lit', () => {
    expect(advance(0, { x: -999, y: -999 })).toBe(0)
    expect(pathSoFar(0)).toEqual([UNICORN.stars[UNICORN.order[0]]])
  })

  it('connects the next star when the finger reaches it', () => {
    expect(advance(0, at(UNICORN.order[1]))).toBe(1)
  })

  it('accepts a near miss, because fingers are imprecise', () => {
    const p = at(UNICORN.order[1])
    expect(advance(0, { x: p.x + UNICORN.reach - 1, y: p.y })).toBe(1)
    expect(advance(0, { x: p.x + UNICORN.reach + 1, y: p.y })).toBe(0)
  })

  it('ignores stars touched out of turn', () => {
    expect(advance(0, at(UNICORN.order[4]))).toBe(0)
  })

  it('finishes after the last star and then stays finished', () => {
    let step = 0
    for (let i = 1; i < UNICORN.order.length; i++) step = advance(step, at(UNICORN.order[i]))
    expect(isComplete(step)).toBe(true)
    expect(advance(step, at(UNICORN.order[1]))).toBe(step)
    expect(pathSoFar(step)).toHaveLength(UNICORN.order.length)
  })

  it('keeps every star inside the drawing area', () => {
    for (const [x, y] of UNICORN.stars) {
      expect(x).toBeGreaterThanOrEqual(10)
      expect(x).toBeLessThanOrEqual(UNICORN.width - 10)
      expect(y).toBeGreaterThanOrEqual(10)
      expect(y).toBeLessThanOrEqual(UNICORN.height - 10)
    }
  })

  it('never asks for two stars closer together than the reach, which would connect by accident', () => {
    for (let i = 1; i < UNICORN.order.length; i++) {
      const a = UNICORN.stars[UNICORN.order[i - 1]]
      const b = UNICORN.stars[UNICORN.order[i]]
      if (UNICORN.order[i - 1] === UNICORN.order[i]) continue
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(UNICORN.reach)
    }
  })
})
