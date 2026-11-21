import { useEffect, useState } from 'react'
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

// An original unicorn drawn as a constellation: [x, y] stars, joined in order.
const STARS: [number, number][] = [
  [92, 18], [118, 62], [150, 74], [176, 104], [168, 138], [140, 150],
  [120, 178], [124, 232], [96, 196], [70, 236], [72, 176], [44, 150],
  [30, 118], [56, 96], [88, 92], [118, 62],
]

/** After "Oui": every island lit, and a unicorn in the sky. */
export function Finale() {
  const reset = useJourney((s) => s.reset)
  const w = content.words.finale
  const [on, setOn] = useState(false)
  useWater('#f2b631', 1)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60)
    return () => clearTimeout(t)
  }, [])
  const path = STARS.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

  return (
    <main className={`screen finale${on ? ' is-on' : ''}`}>
      <svg className="unicorn" viewBox="0 0 200 250" role="img" aria-label="A unicorn drawn in stars">
        <path d={path} pathLength={1} />
        {STARS.slice(0, -1).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 0 ? 3.2 : 2} style={{ animationDelay: `${0.4 + i * 0.16}s` }} />
        ))}
      </svg>
      <p className="fr">{w.fr}</p>
      <h1>Oui.</h1>
      <p className="finale__line">{w.line}</p>
      <p className="finale__sign">{w.sign}</p>
      <button type="button" className="finale__again" onClick={reset}>
        sail it again
      </button>
    </main>
  )
}
