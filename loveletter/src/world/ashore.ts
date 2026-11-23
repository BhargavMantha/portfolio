import { sound } from '../audio/sound'
import { chapterById } from '../content/chapters'
import { journey, type ChapterId } from '../state/journey'
import { veil } from '../ui/veil'
import { sea } from './sea'

/** Dock at an island: the camera dives, the island's colour opens over the screen, the chapter begins. */
export function goAshore(id: ChapterId) {
  if (veil.busy || !journey.getState().canDock(id)) return
  sea.diving = id
  sea.target = null
  sound.dock()
  try {
    navigator.vibrate?.(18)
  } catch {
    /* no haptics on this device */
  }
  void veil.through(chapterById(id).colour, () => {
    journey.getState().dock(id)
    sea.diving = null
  })
}

/** Leave a chapter and return to the boat. */
export function sailOn(id: ChapterId) {
  void veil.through('#0b1026', () => journey.getState().complete(id))
}
