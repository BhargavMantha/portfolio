import { describe, expect, it } from 'vitest'
import { frame } from './frame'

/** Visible band of the image on one axis, as [min, max] in 0–1. */
const band = (scale: number, center: number) => [center - scale / 2, center + scale / 2]

describe('frame', () => {
  it('fills the view when photo and view have the same shape', () => {
    const f = frame({ w: 1600, h: 900, focal: [0.5, 0.5] }, { w: 1920, h: 1080 })
    expect(f.mode).toBe('cover')
    expect(f.scale[0]).toBeCloseTo(1)
    expect(f.scale[1]).toBeCloseTo(1)
  })

  it('on a phone, crops a landscape photo as far as allowed around the focal point, then floats it', () => {
    const f = frame({ w: 3000, h: 2000, focal: [0.8, 0.4] }, { w: 390, h: 844 })
    expect(f.mode).toBe('contain')
    expect(f.scale[0]).toBeCloseTo(0.55)
    expect(f.scale[1]).toBeGreaterThan(1)
    expect(f.center[1]).toBe(0.5)
    const [min, max] = band(f.scale[0], f.center[0])
    expect(min).toBeLessThanOrEqual(0.8)
    expect(max).toBeGreaterThanOrEqual(0.8)
    expect(max).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('never shows outside the image when the focal point is at an edge', () => {
    const f = frame({ w: 3000, h: 2000, focal: [1, 0] }, { w: 390, h: 844 })
    const [min, max] = band(f.scale[0], f.center[0])
    expect(min).toBeGreaterThanOrEqual(0)
    expect(max).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('on a wide screen, keeps the focal row of a portrait photo and floats it', () => {
    const f = frame({ w: 2000, h: 3000, focal: [0.5, 0.3] }, { w: 1920, h: 1080 })
    expect(f.mode).toBe('contain')
    expect(f.scale[1]).toBeCloseTo(0.55)
    expect(f.scale[0]).toBeGreaterThan(1)
    expect(f.center[0]).toBe(0.5)
    const [min, max] = band(f.scale[1], f.center[1])
    expect(min).toBeLessThanOrEqual(0.3)
    expect(max).toBeGreaterThanOrEqual(0.3)
    expect(min).toBeGreaterThanOrEqual(0)
  })

  it('keeps the focal row visible for a mild crop', () => {
    const f = frame({ w: 2000, h: 2400, focal: [0.5, 0.2] }, { w: 1200, h: 1200 })
    expect(f.mode).toBe('cover')
    const [min, max] = band(f.scale[1], f.center[1])
    expect(min).toBeLessThanOrEqual(0.2)
    expect(max).toBeGreaterThanOrEqual(0.2)
    expect(min).toBeGreaterThanOrEqual(0)
  })

  it('falls back to a centred cover for a zero-sized view', () => {
    const f = frame({ w: 2000, h: 3000, focal: [0.5, 0.5] }, { w: 0, h: 0 })
    expect(f).toEqual({ mode: 'cover', scale: [1, 1], center: [0.5, 0.5] })
  })
})
