import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, EffectPass, RenderPass, NoiseEffect, VignetteEffect } from 'postprocessing';
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
 * Uses pmndrs/postprocessing directly with proper render integration.
 * Replaces default renderer to avoid double-rendering.
 */
export const PostProcessingEffects = () => {
  const { gl, scene, camera, size } = useThree();
  const { isMobile } = useResponsive();
  const composerRef = useRef<EffectComposer | null>(null);

  // Initialize effect composer
  useEffect(() => {
    // Disable auto clear so composer can control rendering
    gl.autoClear = false;

    // Create effect composer
    const composer = new EffectComposer(gl);

    // Add render pass (renders the scene)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Film Grain Effect (Noise) - responsive opacity
    const noiseEffect = new NoiseEffect({
      premultiply: true,
      blendFunction: BlendFunction.ADD,
    });
    noiseEffect.blendMode.opacity.value = isMobile ? 0.03 : 0.05;

    // Vignette Effect
    const vignetteEffect = new VignetteEffect({
      offset: 0.5,        // 50% offset - vignette starts halfway from edge
      darkness: 0.5,      // 50% darkness intensity
      eskil: false,       // Standard vignette technique
      blendFunction: BlendFunction.NORMAL,
    });

    // Add effects pass with both effects
    const effectPass = new EffectPass(camera, noiseEffect, vignetteEffect);
    composer.addPass(effectPass);

    composerRef.current = composer;

    // Cleanup on unmount
    return () => {
      gl.autoClear = true; // Restore default
      composer.dispose();
    };
  }, [gl, scene, camera, isMobile]);

  // Handle resize
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  // Render with composer (no priority - replaces default renderer)
  useFrame((_, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta);
    }
  });

  return null; // No visual component, just logic
};
