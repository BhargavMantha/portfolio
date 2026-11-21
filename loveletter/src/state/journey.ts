import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

export const CHAPTER_IDS = ['prologue', 'quiet', 'lumiere', 'colours', 'home', 'days', 'epilogue'] as const
export type ChapterId = (typeof CHAPTER_IDS)[number]
export type Mode = 'sail' | 'film' | 'finale'

export type Journey = {
  mode: Mode
  current: ChapterId | null
  completed: ChapterId[]
  canDock(id: ChapterId): boolean
  dock(id: ChapterId): void
  complete(id: ChapterId): void
  sayOui(): void
  reset(): void
}

const KEY = 'a-to-b:journey'
type Saved = Pick<Journey, 'mode' | 'current' | 'completed'>
const FRESH: Saved = { mode: 'sail', current: null, completed: [] }

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
    return { mode, current, completed }
  } catch {
    return FRESH
  }
}

function save(storage: Storage | undefined, s: Saved) {
  try {
    storage?.setItem(KEY, JSON.stringify({ mode: s.mode, current: s.current, completed: s.completed }))
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
