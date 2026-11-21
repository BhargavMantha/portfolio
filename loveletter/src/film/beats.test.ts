import { describe, expect, it } from 'vitest'
import { chapterById } from '../content/chapters'
import { makeManifest } from '../content/manifest'
import { photo, words } from '../test/fixtures'
import { chapterBeats } from './beats'

describe('chapterBeats', () => {
  it('builds the wedding chapter as intro, then a title and photos per ceremony in order', () => {
    const m = makeManifest([
      photo('shaadi-01', { ceremony: 'shaadi' }),
      photo('haldi-01', { ceremony: 'haldi' }),
      photo('haldi-02', { ceremony: 'haldi' }),
    ])
    const beats = chapterBeats(chapterById('colours'), m, words)
    expect(beats.map((b) => b.photo?.id ?? b.heading)).toEqual(['Seven colours', 'Haldi', 'haldi-01', 'haldi-02', 'Shaadi', 'shaadi-01'])
    expect(beats[1].text).toBe('Haldi line.')
    expect(beats[2].tint).toBe(beats[1].tint)
    expect(beats[4].tint).not.toBe(beats[1].tint)
  })

  it('skips a ceremony that has no photos', () => {
    const m = makeManifest([photo('haldi-01', { ceremony: 'haldi' })])
    expect(chapterBeats(chapterById('colours'), m, words).map((b) => b.heading)).not.toContain('Mehendi')
  })

  it('keeps the words of a beat whose photo is missing, over open water', () => {
    const beats = chapterBeats(chapterById('quiet'), makeManifest([]), words)
    expect(beats).toHaveLength(3)
    expect(beats[1].photo).toBeUndefined()
    expect(beats[1].text).toBe('First photo line.')
  })

  it('resolves photo ids to photos', () => {
    const m = makeManifest([photo('quiet-01', { chapter: 'quiet' })])
    expect(chapterBeats(chapterById('quiet'), m, words)[1].photo?.id).toBe('quiet-01')
  })

  it('gives every beat a tint, defaulting to the chapter colour', () => {
    const beats = chapterBeats(chapterById('home'), makeManifest([]), words)
    expect(beats.every((b) => /^#[0-9a-f]{6}$/i.test(b.tint))).toBe(true)
    expect(beats[0].tint).toBe(chapterById('home').colour)
    expect(beats[1].tint).toBe('#1d1b4b')
  })

  it('plays nothing for a chapter with no words rather than failing', () => {
    expect(chapterBeats(chapterById('prologue'), makeManifest([]), { ...words, beats: {} as never })).toEqual([])
  })
})
