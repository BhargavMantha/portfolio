import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAPTER_IDS, createJourney } from './journey'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  }
}

describe('journey', () => {
  let storage: Storage
  beforeEach(() => {
    storage = memoryStorage()
  })

  it('lists the seven chapters in order', () => {
    expect(CHAPTER_IDS).toEqual(['prologue', 'quiet', 'lumiere', 'colours', 'home', 'days', 'epilogue'])
  })

  it('starts sailing with only the prologue dockable', () => {
    const j = createJourney(storage).getState()
    expect(j.mode).toBe('sail')
    expect(CHAPTER_IDS.filter((id) => j.canDock(id))).toEqual(['prologue'])
  })

  it('ignores docking at a locked island', () => {
    const s = createJourney(storage)
    s.getState().dock('home')
    expect(s.getState().mode).toBe('sail')
    expect(s.getState().current).toBeNull()
  })

  it('enters the film when docking and returns to the sea on completion', () => {
    const s = createJourney(storage)
    s.getState().dock('prologue')
    expect(s.getState().mode).toBe('film')
    expect(s.getState().current).toBe('prologue')
    s.getState().complete('prologue')
    expect(s.getState().mode).toBe('sail')
    expect(s.getState().current).toBeNull()
    expect(s.getState().canDock('quiet')).toBe(true)
    expect(s.getState().canDock('lumiere')).toBe(false)
  })

  it('lets her revisit a finished chapter', () => {
    const s = createJourney(storage)
    s.getState().dock('prologue')
    s.getState().complete('prologue')
    expect(s.getState().canDock('prologue')).toBe(true)
  })

  it('does not record a chapter twice', () => {
    const s = createJourney(storage)
    s.getState().dock('prologue')
    s.getState().complete('prologue')
    s.getState().dock('prologue')
    s.getState().complete('prologue')
    expect(s.getState().completed).toEqual(['prologue'])
  })

  it('only accepts Oui inside the epilogue', () => {
    const s = createJourney(storage)
    s.getState().sayOui()
    expect(s.getState().mode).toBe('sail')
    for (const id of CHAPTER_IDS.slice(0, 6)) {
      s.getState().dock(id)
      s.getState().complete(id)
    }
    s.getState().dock('epilogue')
    s.getState().sayOui()
    expect(s.getState().mode).toBe('finale')
    expect(s.getState().completed).toHaveLength(7)
  })

  it('restores progress after a reload', () => {
    const a = createJourney(storage)
    a.getState().dock('prologue')
    a.getState().complete('prologue')
    a.getState().dock('quiet')
    const b = createJourney(storage).getState()
    expect(b.completed).toEqual(['prologue'])
    expect(b.current).toBe('quiet')
    expect(b.mode).toBe('film')
  })

  it('starts fresh when saved progress is corrupt', () => {
    storage.setItem('a-to-b:journey', '{not json')
    expect(createJourney(storage).getState().completed).toEqual([])
  })

  it('keeps working when storage throws', () => {
    const broken = memoryStorage()
    broken.getItem = vi.fn(() => {
      throw new Error('denied')
    })
    broken.setItem = vi.fn(() => {
      throw new Error('quota')
    })
    const s = createJourney(broken)
    s.getState().dock('prologue')
    expect(s.getState().mode).toBe('film')
  })

  it('reset returns to the very beginning', () => {
    const s = createJourney(storage)
    s.getState().dock('prologue')
    s.getState().complete('prologue')
    s.getState().reset()
    expect(s.getState().completed).toEqual([])
    expect(createJourney(storage).getState().completed).toEqual([])
  })

  it('remembers each marigold she collects, once', () => {
    const s = createJourney(storage)
    s.getState().pick(3)
    s.getState().pick(3)
    s.getState().pick(0)
    expect(s.getState().marigolds).toEqual([3, 0])
    expect(createJourney(storage).getState().marigolds).toEqual([3, 0])
  })

  it('reset also returns the marigolds to the sea', () => {
    const s = createJourney(storage)
    s.getState().pick(1)
    s.getState().reset()
    expect(s.getState().marigolds).toEqual([])
  })

  it('loads progress saved before marigolds existed', () => {
    storage.setItem('a-to-b:journey', JSON.stringify({ mode: 'sail', current: null, completed: ['prologue'] }))
    expect(createJourney(storage).getState().marigolds).toEqual([])
  })
})
