import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore } from '../../../store/universeStore';
import { UNIVERSES } from '../../../constants/universes';
import { UniverseParticles } from './UniverseParticles';

/**
 * Universe Component
 *
 * Manages the active universe environment and dynamically updates:
 * - Background color
 * - Fog settings (color, near, far)
 * - Universe-specific particle system
 *
 * Automatically responds to universe changes from the store.
 */
export const Universe = () => {
  const { scene } = useThree();
  const currentUniverse = useUniverseStore((state) => state.currentUniverse);

  // Get configuration for current universe
  const config = UNIVERSES[currentUniverse];

  // Update fog when universe changes
  useEffect(() => {
    if (scene.fog) {
      const fog = scene.fog as THREE.Fog;
      fog.color.set(config.fogColor);
      fog.near = config.fogNear;
      fog.far = config.fogFar;
    }
  }, [config, scene]);

  // Update background color when universe changes
  useEffect(() => {
    scene.background = new THREE.Color(config.backgroundColor);
  }, [config.backgroundColor, scene]);

  return (
    <group>
      <UniverseParticles config={config} />
    </group>
  );
};
