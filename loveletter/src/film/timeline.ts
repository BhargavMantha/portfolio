/** A beat holds for this share of its scroll length, then the tide brings in the next. */
const HOLD = 0.55

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export type StageState = { from: number; to: number; mix: number }

/** Which two beats are on screen, and how far the second has come in. `p` is scroll measured in beats. */
export function stageAt(count: number, p: number): StageState {
  const last = Math.max(0, count - 1)
  const c = Math.min(last, Math.max(0, p))
  const from = Math.min(last, Math.floor(c))
  if (from === last) return { from, to: last, mix: 0 }
  return { from, to: from + 1, mix: smooth(HOLD, 1, c - from) }
}

/** Opacity of beat `i`'s words at scroll position `p`. */
export function textOpacity(i: number, p: number): number {
  const d = p - i
  const fadeIn = i === 0 && d <= 0 ? 1 : smooth(-0.2, 0, d)
  const fadeOut = 1 - smooth(HOLD, 0.8, d)
  return Math.min(fadeIn, fadeOut)
}
