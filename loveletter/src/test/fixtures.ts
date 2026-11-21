import type { Words } from '../content/chapters'
import type { Photo } from '../content/manifest'

/** Stand-in words for tests. The real ones are private and never in the repository. */
export const words: Words = {
  prologue: { fr: 'Pour toi', hint: 'Touch the light.' },
  finale: { fr: 'Toujours', line: 'A closing line.', sign: 'Signed.' },
  ceremony: {
    haldi: 'Haldi line.',
    'groom-haldi': 'Groom haldi line.',
    mehendi: 'Mehendi line.',
    ankurarpanam: 'Ankurarpanam line.',
    'tota-sambaram': 'Tota line.',
    reception: 'Reception line.',
    shaadi: 'Shaadi line.',
  },
  beats: {
    prologue: [],
    quiet: [
      { heading: 'The quiet world', fr: 'Avant toi', text: 'Opening.' },
      { photo: 'quiet-01', text: 'First photo line.' },
      { standout: 'lit-window', text: 'Window line.' },
    ],
    lumiere: [{ heading: 'La lumière', text: 'Light.' }],
    colours: [{ heading: 'Seven colours', text: 'Intro.' }],
    home: [{ heading: 'Home', text: 'Home line.' }, { text: 'A quiet line.', tint: '#1d1b4b' }],
    days: [{ standout: 'day-counter', text: 'days.' }],
    epilogue: [{ heading: 'Épilogue' }, { standout: 'question', heading: 'Again?' }],
  },
}

export const photo = (id: string, over: Partial<Photo> = {}): Photo => ({
  id,
  chapter: 'colours',
  w: 3000,
  h: 2000,
  focal: [0.5, 0.5],
  blur: 'data:image/webp;base64,AAAA',
  src: { 800: `${id}-800`, 1600: `${id}-1600` },
  ...over,
})
