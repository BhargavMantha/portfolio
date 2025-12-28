import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, EffectPass, RenderPass, NoiseEffect, VignetteEffect } from 'postprocessing';
import { BlendFunction } from 'postprocessing';

/**
 * Post-processing effects for cinematic visual quality
 *
 * Features:
 * - Film Grain (Noise): Subtle texture overlay for authentic camera feel (5% opacity)
 * - Vignette: Darkens edges to focus attention on center (50% darkness, 30% offset)
 *
 * Note: Using pmndrs/postprocessing directly instead of @react-three/postprocessing
 * due to compatibility issues with Three.js 0.156.1
 */
export const PostProcessingEffects = () => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  // Initialize effect composer
  useEffect(() => {
    // Create effect composer
    const composer = new EffectComposer(gl, {
      frameBufferType: gl.capabilities.isWebGL2 ? undefined : undefined,
    });

    // Add render pass (renders the scene)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Film Grain Effect (Noise)
    const noiseEffect = new NoiseEffect({
      premultiply: true,
      blendFunction: BlendFunction.ADD,
    });
    noiseEffect.blendMode.opacity.value = 0.05; // 5% opacity for subtle grain

    // Vignette Effect
    const vignetteEffect = new VignetteEffect({
      offset: 0.3,        // 30% offset - how far from edge the vignette starts
      darkness: 0.5,      // 50% darkness - intensity of the darkening
      eskil: false,       // Use standard vignette (not Eskil's technique)
      blendFunction: BlendFunction.NORMAL,
    });

    // Add effects pass with both effects
    const effectPass = new EffectPass(camera, noiseEffect, vignetteEffect);
    composer.addPass(effectPass);

    composerRef.current = composer;

    // Cleanup on unmount
    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera]);

  // Handle resize
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  // Render the composer instead of the default renderer
  useFrame((_, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta);
    }
  }, 1); // Priority 1 to render after scene updates

  return null; // No visual component, just logic
};
