import { useEffect, useState } from 'react'
import { sound, unlock } from '../audio/sound'

/** A small wave glyph that turns the sound on and off. The choice is remembered. */
export function SoundToggle() {
  const [muted, setMuted] = useState(sound.muted)
  useEffect(() => sound.onChange(setMuted), [])
  return (
    <button
      type="button"
      className={`sound${muted ? ' is-off' : ''}`}
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      onClick={() => {
        unlock()
        sound.toggle()
      }}
    >
      <i />
      <i />
      <i />
      <i />
    </button>
  )
}
