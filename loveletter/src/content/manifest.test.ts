import { describe, expect, it } from 'vitest'
import { CEREMONY_ORDER, makeManifest, pickSrc, type Photo } from './manifest'

const photo = (over: Partial<Photo>): Photo => ({
  id: 'x',
  chapter: 'colours',
  w: 3000,
  h: 2000,
  focal: [0.5, 0.5],
  blur: 'data:image/webp;base64,AAAA',
  src: { 800: 'x-800', 1600: 'x-1600' },
  ...over,
})

describe('pickSrc', () => {
  const p = photo({})
  it('serves 800 to a phone at 390 css px and 2x', () => {
    expect(pickSrc(p, 390, 2)).toBe('x-800')
  })
  it('serves 800 at 700 css px and 1x', () => {
    expect(pickSrc(p, 700, 1)).toBe('x-800')
  })
  it('serves 1600 at 1400 css px and 1x', () => {
    expect(pickSrc(p, 1400, 1)).toBe('x-1600')
  })
  it('tops out at 1600, the largest size shipped', () => {
    expect(pickSrc(p, 900, 2)).toBe('x-1600')
    expect(pickSrc(p, 3000, 2)).toBe('x-1600')
  })
})

describe('manifest', () => {
  it('orders wedding photos by ceremony, then by id', () => {
    const m = makeManifest([
      photo({ id: 'shaadi-01', ceremony: 'shaadi' }),
      photo({ id: 'reception-01', ceremony: 'reception' }),
      photo({ id: 'haldi-02', ceremony: 'haldi' }),
      photo({ id: 'mehendi-01', ceremony: 'mehendi' }),
      photo({ id: 'haldi-01', ceremony: 'haldi' }),
      photo({ id: 'tota-01', ceremony: 'tota-sambaram' }),
      photo({ id: 'groom-haldi-01', ceremony: 'groom-haldi' }),
      photo({ id: 'ankurarpanam-01', ceremony: 'ankurarpanam' }),
    ])
    expect(m.photosFor('colours').map((p) => p.id)).toEqual([
      'haldi-01',
      'haldi-02',
      'groom-haldi-01',
      'mehendi-01',
      'ankurarpanam-01',
      'tota-01',
      'reception-01',
      'shaadi-01',
    ])
  })

  it('names the seven ceremonies in wedding order', () => {
    expect(CEREMONY_ORDER).toEqual([
      'haldi',
      'groom-haldi',
      'mehendi',
      'ankurarpanam',
      'tota-sambaram',
      'reception',
      'shaadi',
    ])
  })

  it('returns only the photos of the chapter asked for', () => {
    const m = makeManifest([photo({ id: 'a', chapter: 'home' }), photo({ id: 'b', chapter: 'quiet' })])
    expect(m.photosFor('home').map((p) => p.id)).toEqual(['a'])
    expect(m.photosFor('epilogue')).toEqual([])
  })

  it('finds a photo by id and reports a missing one as undefined', () => {
    const m = makeManifest([photo({ id: 'a' })])
    expect(m.byId('a')?.id).toBe('a')
    expect(m.byId('nope')).toBeUndefined()
  })
})
