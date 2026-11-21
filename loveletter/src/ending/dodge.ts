export type Rect = { x: number; y: number; w: number; h: number }

export type Dodge = { x: number; y: number; scale: number; becomesOui: boolean }

const MIN_DISTANCE = 120
const GIVE_UP_AT = 5

/**
 * Where the "Non" button runs to. Deterministic: tries spots on a ring around
 * the pointer, rotating with each attempt, and takes the one farthest from it.
 */
export function nextDodge(btn: Rect, pointer: { x: number; y: number }, viewport: { w: number; h: number }, attempt: number): Dodge {
  const scale = Math.max(0.5, 1 - 0.12 * attempt)
  const w = btn.w * scale
  const h = btn.h * scale
  const maxX = Math.max(0, viewport.w - w)
  const maxY = Math.max(0, viewport.h - h)
  const clampX = (x: number) => Math.min(maxX, Math.max(0, x))
  const clampY = (y: number) => Math.min(maxY, Math.max(0, y))

  const reach = Math.max(MIN_DISTANCE * 1.6, Math.min(viewport.w, viewport.h) * 0.45)
  let best = { x: clampX(btn.x), y: clampY(btn.y), d: -1 }
  for (let k = 0; k < 16; k++) {
    const angle = ((k + attempt * 5) / 16) * Math.PI * 2
    const x = clampX(pointer.x + Math.cos(angle) * reach - w / 2)
    const y = clampY(pointer.y + Math.sin(angle) * reach - h / 2)
    const d = Math.hypot(x + w / 2 - pointer.x, y + h / 2 - pointer.y)
    // First candidate that clears the distance wins, so the direction varies by attempt.
    if (d >= MIN_DISTANCE && best.d < MIN_DISTANCE) best = { x, y, d }
    else if (best.d < MIN_DISTANCE && d > best.d) best = { x, y, d }
  }
  return { x: best.x, y: best.y, scale, becomesOui: attempt >= GIVE_UP_AT }
}
