import Lenis from 'lenis'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Chapter } from '../content/chapters'
import { content } from '../content/store'
import { Question } from '../ending/Question'
import { chapterBeats } from './beats'
import { stage } from './Stage'
import { DayCounter, LitWindow } from './standouts'
import { textureFor } from './textures'
import { stageAt, textOpacity } from './timeline'

/** Scroll length of one beat, in viewport heights. */
const BEAT_VH = 1.15

/**
 * One chapter played as a scroll film. The page scrolls; the photos live on
 * the WebGL stage behind, and each beat's words fade in over them.
 */
export function ChapterFilm({ chapter, onDone, onOui }: { chapter: Chapter; onDone: () => void; onOui: () => void }) {
  const beats = useMemo(() => chapterBeats(chapter, content.manifest, content.words), [chapter])
  const words = useRef<(HTMLElement | null)[]>([])
  const bar = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [atEnd, setAtEnd] = useState(false)
  const endsOnQuestion = beats[beats.length - 1]?.standout === 'question'

  useEffect(() => {
    window.scrollTo(0, 0)
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    let raf = 0
    let lastActive = -1
    let lastEnd = false

    const tick = (t: number) => {
      lenis.raf(t)
      const p = window.scrollY / (window.innerHeight * BEAT_VH)
      const s = stageAt(beats.length, p)
      const from = beats[s.from]
      const to = beats[s.to]
      stage.a = from.photo ?? null
      stage.b = to.photo ?? null
      stage.mix = s.mix
      stage.tintA = from.tint
      stage.tintB = to.tint
      stage.drift = Math.min(1, Math.max(0, p - s.from))
      stage.glow = 0.4

      // Have the photo after next ready before the tide reaches it.
      const ahead = beats[s.to + 1]?.photo
      if (ahead) textureFor(ahead, window.innerWidth, Math.min(2, window.devicePixelRatio || 1))

      words.current.forEach((el, i) => {
        if (!el) return
        const o = textOpacity(i, p)
        el.style.opacity = String(o)
        el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`
        el.style.visibility = o > 0.01 ? 'visible' : 'hidden'
      })
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, p / Math.max(1, beats.length - 1))})`

      const nowActive = Math.min(beats.length - 1, Math.max(0, Math.round(p)))
      if (nowActive !== lastActive) setActive((lastActive = nowActive))
      const nowEnd = p >= beats.length - 1.25
      if (nowEnd !== lastEnd) setAtEnd((lastEnd = nowEnd))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [beats])

  return (
    <div className="film" style={{ ['--tint' as string]: chapter.colour }}>
      <div className="film__bar" ref={bar} />
      {/* The track only provides scroll length. */}
      <div className="film__track" style={{ height: `${(beats.length - 1) * BEAT_VH * 100 + 100}vh` }} />
      <div className="film__words">
        {beats.map((beat, i) => (
          <article
            key={i}
            ref={(el) => void (words.current[i] = el)}
            className={`beat${beat.heading || beat.standout ? ' beat--title' : ''}${beat.photo ? ' beat--photo' : ''}`}
            style={{ ['--tint' as string]: beat.tint }}
            aria-hidden={i !== active}
          >
            {beat.fr && <p className="fr">{beat.fr}</p>}
            {beat.heading && <h2>{beat.heading}</h2>}
            {beat.standout === 'lit-window' && <LitWindow />}
            {beat.standout === 'day-counter' && <DayCounter active={i === active} />}
            {beat.text && <p className="beat__text">{beat.text}</p>}
            {beat.standout === 'question' && i === active && <Question onOui={onOui} />}
          </article>
        ))}
      </div>
      {!endsOnQuestion && (
        <button type="button" className={`btn btn--continue${atEnd ? ' is-on' : ''}`} onClick={onDone} tabIndex={atEnd ? 0 : -1}>
          Sail on
        </button>
      )}
      <p className={`film__hint${active === 0 ? ' is-on' : ''}`} aria-hidden="true">
        scroll
      </p>
    </div>
  )
}
