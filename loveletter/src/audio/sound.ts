import { melodyNote } from './notes'

/**
 * All sound is synthesised in the browser: there are no audio files to load
 * or license. Browsers only allow sound after a touch, so nothing starts
 * until unlock() is called from a tap.
 */

const KEY = 'a-to-b:sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let echo: GainNode | null = null
let seaStarted = false
let melody = 0
let muted = readMuted()
const listeners = new Set<(muted: boolean) => void>()

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'off'
  } catch {
    return false
  }
}

const LEVEL = 0.75

/** Call from a tap or key press. Safe to call many times. */
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : LEVEL
      master.connect(ctx.destination)

      // A soft echo that gives the chimes some air.
      const delay = ctx.createDelay(1)
      delay.delayTime.value = 0.31
      const feedback = ctx.createGain()
      feedback.gain.value = 0.34
      const damp = ctx.createBiquadFilter()
      damp.type = 'lowpass'
      damp.frequency.value = 2200
      echo = ctx.createGain()
      echo.gain.value = 0.5
      echo.connect(delay)
      delay.connect(damp)
      damp.connect(feedback)
      feedback.connect(delay)
      damp.connect(master)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    startSea()
  } catch {
    // No audio on this device: the site is simply silent.
    ctx = null
  }
}

/** The bed: two layers of filtered noise breathing like slow waves, and a faint warm drone. */
function startSea() {
  if (!ctx || !master || seaStarted) return
  seaStarted = true
  const seconds = 4
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    // Brown-ish noise: smoother and lower than white noise.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.2
  }

  const layer = (cutoff: number, level: number, period: number, phase: number) => {
    const src = ctx!.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const filter = ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const gain = ctx!.createGain()
    gain.gain.value = level
    const lfo = ctx!.createOscillator()
    lfo.frequency.value = 1 / period
    const depth = ctx!.createGain()
    depth.gain.value = level * 0.7
    lfo.connect(depth)
    depth.connect(gain.gain)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(master!)
    src.start(0, phase)
    lfo.start()
  }
  layer(520, 0.5, 9, 0)
  layer(1400, 0.16, 6.3, 1.7)

  for (const [freq, level] of [
    [130.81, 0.035],
    [196.0, 0.022],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.value = level
    osc.connect(gain)
    gain.connect(master)
    osc.start()
  }
}

/** One music-box note: a sine with a bright partial and a long, soft tail. */
function pluck(freq: number, when = 0, level = 0.22, length = 2.2) {
  if (!ctx || !master || !echo) return
  const t = ctx.currentTime + when
  const out = ctx.createGain()
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(level, t + 0.008)
  out.gain.exponentialRampToValueAtTime(0.0008, t + length)
  out.connect(master)
  out.connect(echo)
  for (const [mult, amount] of [
    [1, 1],
    [2, 0.28],
    [3.01, 0.1],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    const g = ctx.createGain()
    g.gain.value = amount
    osc.connect(g)
    g.connect(out)
    osc.start(t)
    osc.stop(t + length + 0.1)
  }
}

export const sound = {
  /** The next note of the melody she is writing by collecting things. */
  collect() {
    pluck(melodyNote(melody++))
  },
  /** Arriving at an island. */
  dock() {
    pluck(melodyNote(0) / 2, 0, 0.2, 2.6)
    pluck(melodyNote(2) / 2, 0.09, 0.16, 2.6)
    pluck(melodyNote(4), 0.2, 0.14, 3)
  },
  /** A small tick for touching a star or a light. */
  touch(step = 0) {
    pluck(melodyNote(step), 0, 0.16, 1.4)
  },
  /** "Oui." */
  oui() {
    ;[0, 2, 4, 5, 7].forEach((d, i) => pluck(melodyNote(d), i * 0.11, 0.2, 3.2))
  },
  /** The constellation catching light: one low bell, then a rising shimmer. */
  ignite() {
    pluck(melodyNote(0) / 4, 0, 0.3, 5)
    ;[0, 4, 7, 9, 10, 11].forEach((d, i) => pluck(melodyNote(d), 0.5 + i * 0.16, 0.14, 4))
  },
  get muted() {
    return muted
  },
  toggle() {
    muted = !muted
    try {
      localStorage.setItem(KEY, muted ? 'off' : 'on')
    } catch {
      /* not remembered, that is all */
    }
    if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 0.15)
    listeners.forEach((l) => l(muted))
  },
  onChange(l: (muted: boolean) => void) {
    listeners.add(l)
    return () => void listeners.delete(l)
  },
}

// Silence when the tab is hidden, so it never plays from a pocket.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
}
