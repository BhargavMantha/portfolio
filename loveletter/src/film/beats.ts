import { CEREMONY, type Beat, type Chapter, type Words } from '../content/chapters'
import { CEREMONY_ORDER, type Photo, type makeManifest } from '../content/manifest'

export type FilmBeat = Omit<Beat, 'photo' | 'tint'> & { photo?: Photo; tint: string }

type Manifest = ReturnType<typeof makeManifest>

/** Turns a chapter's written beats into what the film plays, with photos resolved. */
export function chapterBeats(chapter: Chapter, m: Manifest, words: Words): FilmBeat[] {
  const resolve = (b: Beat): FilmBeat => ({
    ...b,
    photo: b.photo ? m.byId(b.photo) : undefined,
    tint: b.tint ?? chapter.colour,
  })
  const beats = (words.beats[chapter.id] ?? []).map(resolve)
  if (chapter.id !== 'colours') return beats

  const wedding = m.photosFor('colours')
  for (const key of CEREMONY_ORDER) {
    const photos = wedding.filter((p) => p.ceremony === key)
    if (!photos.length) continue
    const c = CEREMONY[key]
    beats.push({ heading: c.name, text: words.ceremony[key], tint: c.colour })
    for (const photo of photos) beats.push({ photo, tint: c.colour, text: photo.caption })
  }
  return beats
}
