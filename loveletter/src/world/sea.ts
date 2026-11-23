import type { ChapterId } from '../state/journey'
import type { Boat } from './steer'
import { createTrail } from './trail'

/**
 * Live state of the voyage. The render loop writes it every frame; the HUD
 * reads it on its own frame loop, so sailing never re-renders React.
 */
export const sea = {
  boat: { x: 0, z: 6, heading: 0, speed: 0 } as Boat,
  placed: false,
  target: null as { x: number; z: number } | null,
  keys: { up: false, down: false, left: false, right: false },
  /** Island the boat is close enough to dock at. */
  near: null as ChapterId | null,
  /** Bearing and distance to the next unvisited island. */
  bearing: 0,
  distance: 0,
  /** Island the camera is diving towards while docking. */
  diving: null as ChapterId | null,
  trail: createTrail(),
  /** The render clock, so taps can be timed against the shader. */
  now: 0,
  /** Recent taps on the water: x, z, time. */
  ripples: [] as { x: number; z: number; t: number }[],
}

/** Height of the water at a point. Mirrored exactly in the sea's vertex shader. */
export function waveHeight(x: number, z: number, t: number): number {
  return 0.16 * Math.sin(x * 0.33 + t * 0.9) + 0.11 * Math.sin(z * 0.47 + t * 1.15 + x * 0.12) + 0.05 * Math.sin((x + z) * 0.9 - t * 1.7)
}

export const WAVE_GLSL = /* glsl */ `
  float waveHeight(vec2 p, float t) {
    return 0.16 * sin(p.x * 0.33 + t * 0.9) + 0.11 * sin(p.y * 0.47 + t * 1.15 + p.x * 0.12) + 0.05 * sin((p.x + p.y) * 0.9 - t * 1.7);
  }
`
