import { useEffect, useRef, useState } from 'react'
import { CHAPTERS, type Words } from '../content/chapters'
import type { Photo, makeManifest } from '../content/manifest'
import { photoUrl } from '../content/store'
import { Question } from '../ending/Question'
import { chapterBeats } from './beats'
import { DayCounter, LitWindow } from './standouts'

type Manifest = ReturnType<typeof makeManifest>
type Resolve = (photo: Photo, cssWidth: number, dpr: number) => Promise<string>

function Picture({ photo, resolve, eager }: { photo: Photo; resolve: Resolve; eager: boolean }) {
  const ref = useRef<HTMLImageElement>(null)
  const [src, setSrc] = useState(photo.blur)

  useEffect(() => {
    let live = true
    const load = () =>
      resolve(photo, window.innerWidth, Math.min(2, window.devicePixelRatio || 1)).then(
        (url) => live && setSrc(url),
        () => {}, // offline: the placeholder stays
      )
    // Each photo is decrypted only as it approaches the screen.
    if (eager || typeof IntersectionObserver === 'undefined') {
      load()
      return () => void (live = false)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          load()
        }
      },
      { rootMargin: '150% 0px' },
    )
    if (ref.current) io.observe(ref.current)
    return () => {
      live = false
      io.disconnect()
    }
  }, [photo, resolve, eager])

  return (
    <img
      ref={ref}
      alt=""
      decoding="async"
      width={photo.w}
      height={photo.h}
      src={src}
      style={{ objectPosition: `${Math.round(photo.focal[0] * 100)}% ${Math.round(photo.focal[1] * 100)}%` }}
    />
  )
}

type Props = {
  m: Manifest
  words: Words
  onOui: () => void
  startAt?: string
  resolve?: Resolve
  /** Load every photo at once instead of as it nears the screen. */
  eager?: boolean
}

/**
 * The whole story as one plain scrolling page. Used when the device has no
 * WebGL, loses its graphics context, or asks for reduced motion.
 */
export function FallbackFilm({ m, words, onOui, startAt, resolve = photoUrl, eager = false }: Props) {
  return (
    <main className="fallback">
      {CHAPTERS.map((chapter) => (
        <section
          key={chapter.id}
          id={chapter.id}
          className="fallback__chapter"
          style={{ ['--tint' as string]: chapter.colour }}
          ref={startAt === chapter.id ? (el) => el?.scrollIntoView() : undefined}
        >
          <header>
            <p className="fr">{chapter.id === 'prologue' ? words.prologue.fr : chapter.fr}</p>
            <h2>{chapter.title}</h2>
          </header>
          {chapterBeats(chapter, m, words).map((beat, i) => (
            <div key={i} className="fallback__beat" style={{ ['--tint' as string]: beat.tint }}>
              {beat.photo && <Picture photo={beat.photo} resolve={resolve} eager={eager} />}
              {beat.heading && beat.heading !== chapter.title && <h3>{beat.heading}</h3>}
              {beat.fr && beat.fr !== chapter.fr && <p className="fr">{beat.fr}</p>}
              {beat.standout === 'lit-window' && <LitWindow />}
              {beat.standout === 'day-counter' && <DayCounter active animate={false} />}
              {beat.text && <p>{beat.text}</p>}
              {beat.standout === 'question' && <Question onOui={onOui} />}
            </div>
          ))}
        </section>
      ))}
    </main>
  )
}
