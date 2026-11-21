import type { ChapterId } from '../state/journey'

export const CEREMONY_ORDER = [
  'haldi',
  'groom-haldi',
  'mehendi',
  'ankurarpanam',
  'tota-sambaram',
  'reception',
  'shaadi',
] as const
export type Ceremony = (typeof CEREMONY_ORDER)[number]

export type Photo = {
  id: string
  chapter: ChapterId
  ceremony?: Ceremony
  year?: number
  w: number
  h: number
  /** Point that must stay in frame, 0–1 from top-left. */
  focal: [number, number]
  /** Tiny base64 placeholder shown until the real file arrives. */
  blur: string
  /** Names of the encrypted files, by width. */
  src: { 800: string; 1600: string }
  caption?: string
}

const WIDTHS = [800, 1600] as const

/** Smallest file that still covers the device pixels it will be drawn at. */
export function pickSrc(p: Photo, cssWidth: number, dpr: number): string {
  const need = cssWidth * dpr
  const w = WIDTHS.find((x) => x >= need) ?? 1600
  return p.src[w]
}

export function makeManifest(photos: Photo[]) {
  const rank = (p: Photo) => (p.ceremony ? CEREMONY_ORDER.indexOf(p.ceremony) : -1)
  const sorted = [...photos].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
  return {
    all: sorted,
    photosFor: (chapter: ChapterId) => sorted.filter((p) => p.chapter === chapter),
    byId: (id: string) => sorted.find((p) => p.id === id),
  }
}
