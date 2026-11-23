import { describe, expect, it } from 'vitest'
import { melodyNote } from './notes'

describe('melodyNote', () => {
  it('starts on the tonic', () => {
    expect(melodyNote(0)).toBeCloseTo(523.25, 1)
  })
  it('only ever plays notes of the pentatonic scale, so any order sounds right', () => {
    const allowed = [0, 2, 4, 7, 9]
    for (let i = 0; i < 30; i++) {
      const semis = Math.round(12 * Math.log2(melodyNote(i) / 523.25))
      expect(allowed).toContain(((semis % 12) + 12) % 12)
    }
  })
  it('climbs as more are collected', () => {
    expect(melodyNote(6)).toBeGreaterThan(melodyNote(0))
  })
  it('stays in a gentle range however far it goes', () => {
    for (let i = 0; i < 200; i++) expect(melodyNote(i)).toBeLessThan(2200)
  })
})
