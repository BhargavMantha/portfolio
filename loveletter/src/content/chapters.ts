import type { ChapterId } from '../state/journey'
import type { Ceremony } from './manifest'

/**
 * The shape of the story. The words themselves are private: they live in
 * content/words.private.json (git-ignored) and ship encrypted. See store.ts.
 */

export type Standout = 'lit-window' | 'day-counter' | 'question'

export type Beat = {
  /** Photo id from the manifest. Without one the beat plays over open water. */
  photo?: string
  heading?: string
  /** French line, set in the script face. */
  fr?: string
  text?: string
  /** Hex colour the tide carries in with this beat. */
  tint?: string
  standout?: Standout
}

export type Chapter = { id: ChapterId; title: string; fr: string; colour: string }

export type Words = {
  prologue: { fr: string; hint: string }
  finale: { fr: string; line: string; sign: string }
  ceremony: Record<Ceremony, string>
  beats: Record<ChapterId, Beat[]>
}

export const CEREMONY: Record<Ceremony, { name: string; colour: string }> = {
  haldi: { name: 'Haldi', colour: '#f2b631' },
  'groom-haldi': { name: 'My haldi', colour: '#f59e0b' },
  mehendi: { name: 'Mehendi', colour: '#3f7d4a' },
  ankurarpanam: { name: 'Ankurarpanam', colour: '#e8632b' },
  'tota-sambaram': { name: 'Tota Sambaram', colour: '#d94f7a' },
  reception: { name: 'Reception', colour: '#7b4bb3' },
  shaadi: { name: 'Shaadi', colour: '#c8102e' },
}

export const CHAPTERS: Chapter[] = [
  { id: 'prologue', title: 'A to B', fr: '', colour: '#f2b631' },
  { id: 'quiet', title: 'The quiet world', fr: 'Avant toi', colour: '#1d1b4b' },
  { id: 'lumiere', title: 'La lumière', fr: 'Et puis, toi', colour: '#f2b631' },
  { id: 'colours', title: 'Seven colours', fr: 'Sept couleurs', colour: '#c8102e' },
  { id: 'home', title: 'Home', fr: 'Chez nous', colour: '#5b2a86' },
  { id: 'days', title: '1,461 days', fr: 'Quatre ans', colour: '#f2b631' },
  { id: 'epilogue', title: 'Épilogue', fr: 'Mon amour éternel', colour: '#5b2a86' },
]

export const chapterById = (id: ChapterId) => CHAPTERS.find((c) => c.id === id)!
