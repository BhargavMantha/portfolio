/**
 * The veil is a circle of colour that opens over the screen and then fades.
 * It joins sailing to a chapter and back, so there is never a hard cut.
 */
type Listener = (state: { phase: 'idle' | 'cover' | 'reveal'; colour: string }) => void

export const COVER_MS = 750
let listener: Listener | null = null
let busy = false

export const veil = {
  attach(l: Listener) {
    listener = l
    return () => {
      if (listener === l) listener = null
    }
  },
  get busy() {
    return busy
  },
  /** Covers the screen in `colour`, runs `between` while covered, then clears. */
  async through(colour: string, between: () => void) {
    if (busy) return
    busy = true
    try {
      listener?.({ phase: 'cover', colour })
      await new Promise((r) => setTimeout(r, listener ? COVER_MS : 0))
      between()
      listener?.({ phase: 'reveal', colour })
      await new Promise((r) => setTimeout(r, listener ? 900 : 0))
      listener?.({ phase: 'idle', colour })
    } finally {
      busy = false
    }
  },
}
