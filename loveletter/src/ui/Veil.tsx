import { useEffect, useState } from 'react'
import { veil } from './veil'

export function Veil() {
  const [state, setState] = useState<{ phase: 'idle' | 'cover' | 'reveal'; colour: string }>({ phase: 'idle', colour: '#0b1026' })
  useEffect(() => veil.attach(setState), [])
  return <div className={`veil veil--${state.phase}`} style={{ ['--veil' as string]: state.colour }} aria-hidden="true" />
}
