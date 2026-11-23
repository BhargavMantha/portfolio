import { useEffect, useRef, useState } from 'react'
import { sound } from '../audio/sound'
import { UNICORN, advance, isComplete, pathSoFar } from '../ending/trace'
import { content } from '../content/store'
import { stage } from '../film/Stage'
import { useJourney } from '../state/journey'

/** Points the stage at open water in a given colour. */
function useWater(tint: string, glow: number) {
  useEffect(() => {
    stage.a = null
    stage.b = null
    stage.mix = 0
    stage.tintA = tint
    stage.tintB = tint
    stage.glow = glow
    window.scrollTo(0, 0)
  }, [tint, glow])
}

/** The first screen: one point of light. */
export function Prologue({ onBegin }: { onBegin: () => void }) {
  const w = content.words.prologue
  useWater('#1d1b4b', 0)
  return (
    <main className="screen prologue">
      <p className="fr">{w.fr}</p>
      <h1>
        A <span>to</span> B
      </h1>
      <button type="button" className="light" onClick={onBegin} aria-label="Begin">
        <span />
      </button>
      <p className="screen__hint">{w.hint}</p>
    </main>
  )
}

const PETALS = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 14) * 0.18,
  time: 4.2 + (i % 5) * 0.7,
  drift: ((i * 53) % 60) - 30,
  hue: ['#f2b631', '#f7a521', '#e0436a', '#f7b9d6', '#b497e8'][i % 5],
}))

/**
 * After "Oui": the sky clears and she draws the constellation herself,
 * dragging from star to star. When the last line closes, it catches light.
 */
export function Finale() {
  const reset = useJourney((s) => s.reset)
  const w = content.words.finale
  const [step, setStep] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const done = isComplete(step)
  useWater(done ? '#7b4bb3' : '#2b2a6e', done ? 0.6 : 0.15)

  const reach = (clientX: number, clientY: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box || !box.width) return
    const p = { x: ((clientX - box.left) / box.width) * UNICORN.width, y: ((clientY - box.top) / box.height) * UNICORN.height }
    setStep((now) => {
      const next = advance(now, p)
      if (next !== now) {
        if (isComplete(next)) sound.ignite()
        else sound.touch(next)
        try {
          navigator.vibrate?.(isComplete(next) ? [20, 60, 40] : 10)
        } catch {
          /* no haptics */
        }
      }
      return next
    })
  }

  // Keyboard: each press joins the next star, so the ending is reachable without a pointer.
  const joinNext = () => {
    const [x, y] = UNICORN.stars[UNICORN.order[Math.min(step + 1, UNICORN.order.length - 1)]]
    const box = svg.current?.getBoundingClientRect()
    if (box) reach(box.left + (x / UNICORN.width) * box.width, box.top + (y / UNICORN.height) * box.height)
  }

  const path = pathSoFar(step)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`)
    .join(' ')
  const nextStar = done ? -1 : UNICORN.order[step + 1]
  const joined = new Set(UNICORN.order.slice(0, step + 1))

  return (
    <main className={`screen finale${done ? ' is-on' : ''}`}>
      {done && (
        <div className="petals" aria-hidden="true">
          {PETALS.map((p, i) => (
            <i key={i} style={{ left: `${p.left}%`, background: p.hue, animationDelay: `${p.delay}s`, animationDuration: `${p.time}s`, ['--drift' as string]: `${p.drift}px` }} />
          ))}
        </div>
      )}
      <svg
        ref={svg}
        className="unicorn"
        viewBox={`0 0 ${UNICORN.width} ${UNICORN.height}`}
        role="img"
        aria-label={done ? 'A unicorn, drawn in stars' : 'Stars waiting to be joined'}
        tabIndex={done ? -1 : 0}
        onPointerDown={(e) => {
          setDrawing(true)
          e.currentTarget.setPointerCapture?.(e.pointerId)
          reach(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => drawing && reach(e.clientX, e.clientY)}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            joinNext()
          }
        }}
      >
        <path className="unicorn__line" d={path} />
        {UNICORN.stars.map(([x, y], i) => (
          <g key={i} className={`star${joined.has(i) ? ' is-joined' : ''}${i === nextStar ? ' is-next' : ''}`}>
            <circle className="star__halo" cx={x} cy={y} r={11} />
            <circle className="star__core" cx={x} cy={y} r={joined.has(i) ? 3 : 2.2} />
          </g>
        ))}
        <circle className="unicorn__eye" cx={UNICORN.eye[0]} cy={UNICORN.eye[1]} r={2} />
      </svg>
      {!done && (
        <p className="finale__prompt">
          <span className="fr">Relie les étoiles</span>
          Join the stars, one to the next.
        </p>
      )}
      <p className="fr finale__reveal">{w.fr}</p>
      <h1 className="finale__reveal">Oui.</h1>
      <p className="finale__line finale__reveal">{w.line}</p>
      <p className="finale__sign finale__reveal">{w.sign}</p>
      <button type="button" className="finale__again finale__reveal" onClick={reset} tabIndex={done ? 0 : -1}>
        sail it again
      </button>
    </main>
  )
}
