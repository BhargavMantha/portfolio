import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { chapterById } from './content/chapters'
import { content, fetchMeta, unlock } from './content/store'
import { ChapterFilm } from './film/ChapterFilm'
import { FallbackFilm } from './film/FallbackFilm'
import { Stage } from './film/Stage'
import { detectEnv, qualityTier, type QualityTier } from './lib/quality'
import { deriveKey, exportKey, importKey } from './lib/vault'
import { sound, unlock as unlockSound } from './audio/sound'
import { Login } from './ui/Login'
import { SoundToggle } from './ui/SoundToggle'
import { Veil } from './ui/Veil'
import { sailOn } from './world/ashore'
import { journey, useJourney } from './state/journey'
import { Finale, Prologue } from './ui/screens'
import { Hud } from './world/Hud'
import { World, resetVoyage } from './world/World'

const SESSION_KEY = 'a-to-b:key'

/** Tries a name and password against the encrypted content. */
async function attempt(name: string, password: string): Promise<boolean> {
  const meta = await fetchMeta()
  const key = await deriveKey(name, password, meta.salt, meta.iterations)
  try {
    await unlock(key)
  } catch (e) {
    // A decryption failure means the wrong name or password; anything else is a real fault.
    if (e instanceof DOMException || (e instanceof Error && e.name === 'OperationError')) return false
    throw e
  }
  try {
    // Remembered for this tab only, so a refresh does not ask again.
    sessionStorage.setItem(SESSION_KEY, await exportKey(key))
  } catch {
    /* private mode: she will simply be asked again */
  }
  return true
}

export function App() {
  // 'checking' while a key saved earlier in this tab is tried.
  const [door, setDoor] = useState<'checking' | 'closed' | 'open'>('checking')
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = sessionStorage.getItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    if (!saved) return setDoor('closed')
    importKey(saved)
      .then(unlock)
      .then(
        () => setDoor('open'),
        () => setDoor('closed'),
      )
  }, [])

  if (door === 'checking') return null
  if (door === 'closed')
    return (
      <Login
        attempt={attempt}
        onOpen={() => {
          // Opening the door is a tap, which is what lets the browser play sound.
          unlockSound()
          setDoor('open')
        }}
      />
    )
  return <Story />
}

function Story() {
  const [tier, setTier] = useState<QualityTier>(() => qualityTier(detectEnv()))
  const [touch] = useState(() => detectEnv().coarsePointer)
  const mode = useJourney((s) => s.mode)
  const current = useJourney((s) => s.current)
  const completed = useJourney((s) => s.completed)
  // Store actions are stable, so they can be read once per render without subscribing.
  const { dock, complete, sayOui, reset } = journey.getState()

  if (tier === 'none') {
    if (mode === 'finale') return <FallbackFinale onAgain={reset} />
    return (
      <FallbackFilm
        m={content.manifest}
        words={content.words}
        startAt={current ?? undefined}
        onOui={() => {
          // The plain page has no docking, so step straight to the end.
          forceEpilogue()
          sayOui()
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  const begun = completed.includes('prologue')
  const sailing = begun && mode === 'sail'
  if (!begun) resetVoyage()
  return (
    <>
      <Canvas
        className={`stage${sailing ? ' stage--live' : ''}`}
        camera={{ fov: 50, near: 0.1, far: 700 }}
        dpr={[1, tier === 'low' ? 1.5 : 2]}
        flat
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // If the graphics context dies, carry on as the plain scrolling film.
          gl.domElement.addEventListener('webglcontextlost', () => setTier('none'))
        }}
      >
        {sailing ? <World /> : <Stage maxWidth={1600} />}
      </Canvas>
      {mode === 'finale' ? (
        <Finale />
      ) : !begun ? (
        <Prologue
          onBegin={() => {
            unlockSound()
            sound.dock()
            dock('prologue')
            complete('prologue')
          }}
        />
      ) : mode === 'film' && current ? (
        <ChapterFilm key={current} chapter={chapterById(current)} onDone={() => sailOn(current)} onOui={() => {
          sound.oui()
          sayOui()
        }} />
      ) : (
        <Hud touch={touch} />
      )}
      <SoundToggle />
      <Veil />
    </>
  )
}

/** Marks every chapter read and opens the epilogue, for the single-page film. */
function forceEpilogue() {
  const s = journey.getState()
  for (const id of ['prologue', 'quiet', 'lumiere', 'colours', 'home', 'days'] as const) {
    s.dock(id)
    s.complete(id)
  }
  s.dock('epilogue')
}

function FallbackFinale({ onAgain }: { onAgain: () => void }) {
  const w = content.words.finale
  return (
    <main className="screen finale is-on finale--plain">
      <p className="fr">{w.fr}</p>
      <h1>Oui.</h1>
      <p className="finale__sign">{w.sign}</p>
      <button type="button" className="finale__again" onClick={onAgain}>
        read it again
      </button>
    </main>
  )
}
