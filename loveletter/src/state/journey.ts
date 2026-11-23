import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

export const CHAPTER_IDS = ['prologue', 'quiet', 'lumiere', 'colours', 'home', 'days', 'epilogue'] as const
export type ChapterId = (typeof CHAPTER_IDS)[number]
export type Mode = 'sail' | 'film' | 'finale'

export type Journey = {
  mode: Mode
  current: ChapterId | null
  completed: ChapterId[]
  /** Indexes of the marigolds collected along the way. */
  marigolds: number[]
  canDock(id: ChapterId): boolean
  dock(id: ChapterId): void
  complete(id: ChapterId): void
  sayOui(): void
  pick(i: number): void
  reset(): void
}

const KEY = 'a-to-b:journey'
type Saved = Pick<Journey, 'mode' | 'current' | 'completed' | 'marigolds'>
const FRESH: Saved = { mode: 'sail', current: null, completed: [], marigolds: [] }

function isChapter(x: unknown): x is ChapterId {
  return typeof x === 'string' && (CHAPTER_IDS as readonly string[]).includes(x)
}

function load(storage: Storage | undefined): Saved {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return FRESH
    const s = JSON.parse(raw) as Partial<Saved>
    const completed = Array.isArray(s.completed) ? s.completed.filter(isChapter) : []
    const current = isChapter(s.current) ? s.current : null
    const mode: Mode = s.mode === 'finale' ? 'finale' : current ? 'film' : 'sail'
    const marigolds = Array.isArray(s.marigolds) ? s.marigolds.filter((n): n is number => Number.isInteger(n)) : []
    return { mode, current, completed, marigolds }
  } catch {
    return FRESH
  }
}

function save(storage: Storage | undefined, s: Saved) {
  try {
    storage?.setItem(KEY, JSON.stringify({ mode: s.mode, current: s.current, completed: s.completed, marigolds: s.marigolds }))
  } catch {
    // Private mode or full storage: progress just won't survive a reload.
  }
}

export function createJourney(storage?: Storage): StoreApi<Journey> {
  const store = createStore<Journey>((set, get) => ({
    ...load(storage),
    canDock(id) {
      const { completed } = get()
      if (completed.includes(id)) return true
      const i = CHAPTER_IDS.indexOf(id)
      return i === 0 || completed.includes(CHAPTER_IDS[i - 1])
    },
    dock(id) {
      if (!get().canDock(id)) return
      set({ mode: 'film', current: id })
    },
    complete(id) {
      const { completed, current } = get()
      if (current !== id) return
      set({ mode: 'sail', current: null, completed: completed.includes(id) ? completed : [...completed, id] })
    },
    sayOui() {
      const { current, completed } = get()
      if (current !== 'epilogue') return
      set({
        mode: 'finale',
        current: null,
        completed: completed.includes('epilogue') ? completed : [...completed, 'epilogue'],
      })
    },
    pick(i) {
      const { marigolds } = get()
      if (!marigolds.includes(i)) set({ marigolds: [...marigolds, i] })
    },
    reset() {
      set(FRESH)
    },
  }))
  store.subscribe((s) => save(storage, s))
  return store
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export const journey = createJourney(typeof window === 'undefined' ? undefined : browserStorage())

export function useJourney<T>(selector: (s: Journey) => T): T {
  return useStore(journey, selector)
}
