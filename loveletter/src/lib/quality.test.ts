import { describe, expect, it } from 'vitest'
import { qualityTier } from './quality'

const base = { webgl: true, reducedMotion: false, deviceMemory: 8, coarsePointer: false }

describe('qualityTier', () => {
  it('is none without WebGL', () => {
    expect(qualityTier({ ...base, webgl: false })).toBe('none')
  })
  it('is none when reduced motion is requested', () => {
    expect(qualityTier({ ...base, reducedMotion: true })).toBe('none')
  })
  it('is low on touch devices', () => {
    expect(qualityTier({ ...base, coarsePointer: true })).toBe('low')
  })
  it('is low with 4 GB of memory or less', () => {
    expect(qualityTier({ ...base, deviceMemory: 4 })).toBe('low')
  })
  it('is high on a capable desktop', () => {
    expect(qualityTier(base)).toBe('high')
  })
  it('is high when memory is unknown on a desktop', () => {
    expect(qualityTier({ ...base, deviceMemory: undefined })).toBe('high')
  })
})
