import { DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RGBAFormat, Texture, TextureLoader } from 'three'
import type { Photo } from '../content/manifest'
import { photoUrl } from '../content/store'

/** Sharp textures kept on the GPU at once. Older ones are freed. */
const MAX_SHARP = 6

type Entry = { tex: Texture; sharp: boolean; used: number }

const loader = new TextureLoader()
const cache = new Map<string, Entry>()
let clock = 0

const blank = new DataTexture(new Uint8Array([11, 16, 38, 255]), 1, 1, RGBAFormat)
blank.needsUpdate = true

function prepare(t: Texture, mipmaps: boolean) {
  // Colours pass through untouched; the shader writes them straight to the screen.
  t.colorSpace = NoColorSpace
  t.generateMipmaps = mipmaps
  t.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter
  t.magFilter = LinearFilter
  t.needsUpdate = true
  return t
}

function evict() {
  const sharp = [...cache.entries()].filter(([, e]) => e.sharp).sort((a, b) => a[1].used - b[1].used)
  while (sharp.length > MAX_SHARP) {
    const [id, e] = sharp.shift()!
    e.tex.dispose()
    cache.delete(id)
  }
}

/**
 * Texture for a photo: the blurred placeholder at once, the real file when it
 * arrives. If the real file never arrives the placeholder simply stays.
 */
export function textureFor(photo: Photo, cssWidth: number, dpr: number): Texture {
  const hit = cache.get(photo.id)
  if (hit) {
    hit.used = ++clock
    return hit.tex
  }
  const entry: Entry = { tex: blank, sharp: false, used: ++clock }
  cache.set(photo.id, entry)

  if (photo.blur) {
    loader.load(photo.blur, (t) => {
      if (cache.get(photo.id) !== entry || entry.sharp) return t.dispose()
      entry.tex = prepare(t, false)
    })
  }
  // Offline or a dropped connection: forget the entry so a later visit retries.
  const forget = () => {
    if (cache.get(photo.id) === entry && !entry.sharp) setTimeout(() => cache.get(photo.id) === entry && cache.delete(photo.id), 4000)
  }
  photoUrl(photo, cssWidth, dpr).then(
    (url) =>
      loader.load(
        url,
        (t) => {
          if (cache.get(photo.id) !== entry) return t.dispose()
          const old = entry.tex
          entry.tex = prepare(t, true)
          entry.sharp = true
          if (old !== blank) old.dispose()
          evict()
        },
        undefined,
        forget,
      ),
    forget,
  )
  return entry.tex
}

export const blankTexture = blank
