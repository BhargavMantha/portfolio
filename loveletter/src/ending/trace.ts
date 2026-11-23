/**
 * The constellation she draws at the end: a unicorn's head in profile,
 * horn first. Coordinates are in a 220 × 240 drawing area.
 */
export const UNICORN = {
  width: 220,
  height: 240,
  /** How close a finger must come to a star to connect it. */
  reach: 26,
  stars: [
    [168, 18], // 0 tip of the horn
    [140, 72], // 1 forehead
    [172, 112], // 2 bridge of the nose
    [190, 146], // 3 muzzle
    [160, 162], // 4 chin
    [128, 140], // 5 jaw
    [118, 214], // 6 front of the neck
    [40, 218], // 7 back of the neck
    [56, 138], // 8 mane
    [92, 70], // 9 poll
    [104, 34], // 10 tip of the ear
  ] as [number, number][],
  /** The order the stars are joined in. It ends back at the forehead to close the shape. */
  order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1],
  eye: [150, 100] as [number, number],
}

const LAST = UNICORN.order.length - 1

export const isComplete = (step: number) => step >= LAST

/** `step` is how many joins are made. Returns the new step after the finger is at `p`. */
export function advance(step: number, p: { x: number; y: number }): number {
  if (isComplete(step)) return step
  const [x, y] = UNICORN.stars[UNICORN.order[step + 1]]
  return Math.hypot(p.x - x, p.y - y) <= UNICORN.reach ? step + 1 : step
}

/** The stars joined so far, in drawing order. */
export const pathSoFar = (step: number) => UNICORN.order.slice(0, Math.min(step, LAST) + 1).map((i) => UNICORN.stars[i])
