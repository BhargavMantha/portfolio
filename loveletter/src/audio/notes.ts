const TONIC = 523.25 // C5
const PENTATONIC = [0, 2, 4, 7, 9]
// A small rising phrase; collecting things plays it one note at a time.
const PHRASE = [0, 2, 4, 2, 5, 4, 7, 9, 7, 5, 9, 10]

/** Frequency of the nth note she has earned. Always in the scale, so it cannot sound wrong. */
export function melodyNote(n: number): number {
  const degree = PHRASE[((n % PHRASE.length) + PHRASE.length) % PHRASE.length]
  const octave = Math.floor(degree / PENTATONIC.length)
  const semis = PENTATONIC[degree % PENTATONIC.length] + 12 * octave
  return TONIC * 2 ** (semis / 12)
}
