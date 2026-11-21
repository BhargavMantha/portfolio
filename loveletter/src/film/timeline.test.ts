import { describe, expect, it } from 'vitest'
import { stageAt, textOpacity } from './timeline'

describe('stageAt', () => {
  it('holds on the first beat at the start', () => {
    expect(stageAt(5, 0)).toEqual({ from: 0, to: 1, mix: 0 })
  })

  it('holds for the first part of a beat', () => {
    expect(stageAt(5, 2.3).mix).toBe(0)
    expect(stageAt(5, 2.3).from).toBe(2)
  })

  it('is halfway into the next beat late in the current one', () => {
    const s = stageAt(5, 2.775)
    expect(s.from).toBe(2)
    expect(s.to).toBe(3)
    expect(s.mix).toBeCloseTo(0.5, 1)
  })

  it('rests on the last beat and never points past it', () => {
    expect(stageAt(5, 4.9)).toEqual({ from: 4, to: 4, mix: 0 })
    expect(stageAt(5, 99)).toEqual({ from: 4, to: 4, mix: 0 })
  })

  it('clamps negative scroll (overscroll bounce) to the start', () => {
    expect(stageAt(5, -0.4)).toEqual({ from: 0, to: 1, mix: 0 })
  })

  it('handles a single beat', () => {
    expect(stageAt(1, 0.8)).toEqual({ from: 0, to: 0, mix: 0 })
  })
})

describe('textOpacity', () => {
  it('is fully visible while its beat holds', () => {
    expect(textOpacity(2, 2.2)).toBe(1)
  })
  it('is gone before its beat begins and after it has left', () => {
    expect(textOpacity(2, 1.5)).toBe(0)
    expect(textOpacity(2, 2.95)).toBe(0)
  })
  it('shows the first beat immediately', () => {
    expect(textOpacity(0, 0)).toBe(1)
  })
})
