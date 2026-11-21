export type QualityTier = 'high' | 'low' | 'none'

export type QualityEnv = {
  webgl: boolean
  reducedMotion: boolean
  deviceMemory?: number
  coarsePointer: boolean
}

/** Decides how much 3D the device gets. 'none' means the DOM scroll film. */
export function qualityTier(env: QualityEnv): QualityTier {
  if (!env.webgl || env.reducedMotion) return 'none'
  if (env.coarsePointer) return 'low'
  if (env.deviceMemory !== undefined && env.deviceMemory <= 4) return 'low'
  return 'high'
}

export function detectEnv(): QualityEnv {
  let webgl = false
  try {
    const c = document.createElement('canvas')
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webgl = false
  }
  return {
    webgl,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
  }
}
