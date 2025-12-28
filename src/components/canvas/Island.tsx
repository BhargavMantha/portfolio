import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useIslandRotation } from '../../hooks/useIslandRotation';

export const Island = () => {
  const islandRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/island.glb');

  // Apply drag-to-rotate
  useIslandRotation(islandRef);

  return (
    <group ref={islandRef as any} position={[0, 0, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
};

// Preload model
useGLTF.preload('/models/island.glb');
