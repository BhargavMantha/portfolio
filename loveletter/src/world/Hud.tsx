import { useEffect, useRef, useState } from 'react'
import { CHAPTERS, chapterById } from '../content/chapters'
import { CHAPTER_IDS, useJourney, type ChapterId } from '../state/journey'
import { goAshore } from './ashore'
import { MARIGOLDS } from './collect'
import { sea } from './sea'

/** Everything drawn over the sea: the course, the compass, the key hints and the dock prompt. */
export function Hud({ touch }: { touch: boolean }) {
  const completed = useJourney((s) => s.completed)
  const marigolds = useJourney((s) => s.marigolds)
  const [near, setNear] = useState<ChapterId | null>(null)
  const needle = useRef<HTMLSpanElement>(null)
  const range = useRef<HTMLSpanElement>(null)
  const nextId = CHAPTER_IDS.find((id) => !completed.includes(id))

  useEffect(() => {
    let raf = 0
    let last: ChapterId | null = null
    const tick = () => {
      if (sea.near !== last) setNear((last = sea.near))
      // Screen rotation is clockwise-positive; bearing is positive to port.
      if (needle.current) needle.current.style.transform = `rotate(${-sea.bearing}rad)`
      if (range.current) range.current.textContent = `${Math.round(sea.distance)} m`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nearChapter = near ? chapterById(near) : null

  return (
    <div className="hud">
      <nav className="hud__course" aria-label="Your course from A to B">
        <b>A</b>
        {CHAPTERS.filter((c) => c.id !== 'prologue').map((c) => (
          <span
            key={c.id}
            className={`isle${completed.includes(c.id) ? ' is-lit' : ''}${c.id === nextId ? ' is-next' : ''}`}
            style={{ ['--tint' as string]: c.colour }}
            title={c.title}
          />
        ))}
        <b>B</b>
      </nav>

      <p className={`hud__flowers${marigolds.length ? ' is-on' : ''}`} key={marigolds.length} aria-live="polite">
        <i aria-hidden="true" />
        {marigolds.length === MARIGOLDS.length ? 'Sept soucis. One for every ceremony.' : `${marigolds.length} / ${MARIGOLDS.length}`}
      </p>

      {nextId && (
        <p className="hud__compass">
          <span className="hud__needle" ref={needle} aria-hidden="true" />
          <span>
            <em>{chapterById(nextId).title}</em>
            <span ref={range} />
          </span>
        </p>
      )}

      {nearChapter ? (
        <button type="button" className="btn btn--oui hud__dock" style={{ ['--tint' as string]: nearChapter.colour }} onClick={() => goAshore(nearChapter.id)}>
          {completed.includes(nearChapter.id) ? 'Revisit' : 'Enter the glade'} · {nearChapter.title}
          {!touch && <kbd>E</kbd>}
        </button>
      ) : (
        <p className="hud__keys" aria-live="polite">
          {touch ? (
            'Tap the ground, or a glade, to ride there'
          ) : (
            <>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> or arrow keys to ride · click the ground to set a course
            </>
          )}
        </p>
      )}
    </div>
  )
}
