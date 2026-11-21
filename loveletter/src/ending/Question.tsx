import { useRef, useState, type FocusEvent, type PointerEvent } from 'react'
import { nextDodge, type Dodge } from './dodge'

const TEASE = ['', 'Non ?', 'Essaie encore.', 'It keeps slipping away.', 'Presque…', 'Almost.']

/**
 * The only question on the site. There is no handler for "no" anywhere:
 * the Non button can only run away, and in the end it becomes a second Oui.
 */
export function Question({ onOui }: { onOui: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [spot, setSpot] = useState<Dodge | null>(null)
  const surrendered = spot?.becomesOui ?? false

  const flee = (pointer?: { x: number; y: number }) => {
    const el = ref.current
    if (!el || surrendered) return
    const r = el.getBoundingClientRect()
    const scale = spot?.scale ?? 1
    // Unscaled size, so repeated dodges do not compound the shrink.
    const btn = { x: r.left, y: r.top, w: r.width / scale || 120, h: r.height / scale || 52 }
    const from = pointer ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    setSpot(nextDodge(btn, from, { w: window.innerWidth, h: window.innerHeight }, attempt))
    setAttempt((a) => a + 1)
  }

  const onPointer = (e: PointerEvent) => flee({ x: e.clientX, y: e.clientY })
  const onFocus = (e: FocusEvent<HTMLButtonElement>) => {
    flee()
    e.currentTarget.blur()
  }

  return (
    <div className="question">
      <div className="question__answers">
        <button type="button" className="btn btn--oui" onClick={onOui}>
          Oui
        </button>
        {surrendered ? (
          <button type="button" data-testid="non" className="btn btn--oui" onClick={onOui}>
            Oui
          </button>
        ) : (
          <button
            ref={ref}
            type="button"
            data-testid="non"
            className={`btn btn--non${spot ? ' is-loose' : ''}`}
            tabIndex={-1}
            aria-hidden="true"
            style={spot ? { transform: `translate(${spot.x}px, ${spot.y}px) scale(${spot.scale})` } : undefined}
            onPointerEnter={onPointer}
            onPointerDown={onPointer}
            onFocus={onFocus}
          >
            Non
          </button>
        )}
      </div>
      <p className="question__tease" aria-live="polite">
        {surrendered ? 'There was only ever one answer.' : TEASE[Math.min(attempt, TEASE.length - 1)]}
      </p>
    </div>
  )
}
