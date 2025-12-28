import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

/**
 * Post-processing effects for cinematic visual quality
 *
 * Features:
 * - Film Grain (Noise): Subtle texture overlay for authentic camera feel (5% opacity)
 * - Vignette: Darkens edges to focus attention on center (50% darkness, 50% offset)
 *
 * Uses @react-three/postprocessing wrapper to avoid double-rendering issues
 * and ensure proper integration with React Three Fiber's render loop.
 */
export const PostProcessingEffects = () => {
  return (
    <EffectComposer>
      {/* Film Grain - 5% opacity for subtle texture */}
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.05}
      />

      {/* Vignette - Darkens edges to focus on center */}
      <Vignette
        offset={0.5}      // 50% offset - vignette starts halfway from edge
        darkness={0.5}    // 50% darkness intensity
        eskil={false}     // Standard vignette technique
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
