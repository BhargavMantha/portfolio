import { describe, expect, it } from 'vitest'
import { nextDodge, type Rect } from './dodge'

const viewport = { w: 390, h: 844 }
const btn: Rect = { x: 220, y: 600, w: 120, h: 52 }

const centre = (r: { x: number; y: number }, s: number) => ({
  x: r.x + (btn.w * s) / 2,
  y: r.y + (btn.h * s) / 2,
})

describe('nextDodge', () => {
  it('lands fully inside the viewport, for many pointer positions', () => {
    for (let px = 0; px <= viewport.w; px += 39) {
      for (let py = 0; py <= viewport.h; py += 84) {
        const d = nextDodge(btn, { x: px, y: py }, viewport, 1)
        expect(d.x).toBeGreaterThanOrEqual(0)
        expect(d.y).toBeGreaterThanOrEqual(0)
        expect(d.x + btn.w * d.scale).toBeLessThanOrEqual(viewport.w)
        expect(d.y + btn.h * d.scale).toBeLessThanOrEqual(viewport.h)
      }
    }
  })

  it('ends up at least 120px from the pointer', () => {
    for (const p of [
      { x: 280, y: 626 },
      { x: 5, y: 5 },
      { x: 385, y: 840 },
      { x: 195, y: 422 },
    ]) {
      const d = nextDodge(btn, p, viewport, 2)
      const c = centre(d, d.scale)
      expect(Math.hypot(c.x - p.x, c.y - p.y)).toBeGreaterThanOrEqual(120)
    }
  })

  it('shrinks with each attempt but never below half size', () => {
    const s = [0, 1, 2, 3, 4].map((a) => nextDodge(btn, { x: 280, y: 626 }, viewport, a).scale)
    expect(s[1]).toBeLessThan(s[0])
    expect(s[2]).toBeLessThan(s[1])
    expect(Math.min(...s)).toBeGreaterThanOrEqual(0.5)
  })

  it('gives up and becomes Oui on the fifth attempt', () => {
    expect(nextDodge(btn, { x: 280, y: 626 }, viewport, 4).becomesOui).toBe(false)
    expect(nextDodge(btn, { x: 280, y: 626 }, viewport, 5).becomesOui).toBe(true)
  })

  it('is deterministic, so it cannot flicker between positions', () => {
    const a = nextDodge(btn, { x: 100, y: 100 }, viewport, 3)
    const b = nextDodge(btn, { x: 100, y: 100 }, viewport, 3)
    expect(a).toEqual(b)
  })

  it('still fits on a very small screen', () => {
    const tiny = { w: 240, h: 320 }
    const d = nextDodge({ x: 60, y: 200, w: 120, h: 52 }, { x: 120, y: 226 }, tiny, 1)
    expect(d.x).toBeGreaterThanOrEqual(0)
    expect(d.x + 120 * d.scale).toBeLessThanOrEqual(tiny.w)
    expect(d.y + 52 * d.scale).toBeLessThanOrEqual(tiny.h)
  })
})
