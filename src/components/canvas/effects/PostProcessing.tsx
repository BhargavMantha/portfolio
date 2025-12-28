import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useResponsive } from '../../../hooks/useResponsive';

/**
 * Post-processing effects for cinematic visual quality
 *
 * Features:
 * - Film Grain (Noise): Subtle texture overlay for authentic camera feel
 *   - Desktop: 5% opacity for full cinematic effect
 *   - Mobile: 3% opacity for lighter, more performant effect
 * - Vignette: Darkens edges to focus attention on center (50% darkness, 50% offset)
 *
 * Uses @react-three/postprocessing wrapper to avoid double-rendering issues
 * and ensure proper integration with React Three Fiber's render loop.
 */
export const PostProcessingEffects = () => {
  const { isMobile } = useResponsive();

  return (
    <EffectComposer>
      {/* Film Grain - Lighter on mobile (3%) vs desktop (5%) */}
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={isMobile ? 0.03 : 0.05}
      />

      {/* Vignette - Darkens edges to focus on center (cheap effect, keep on mobile) */}
      <Vignette
        offset={0.5}      // 50% offset - vignette starts halfway from edge
        darkness={0.5}    // 50% darkness intensity
        eskil={false}     // Standard vignette technique
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
