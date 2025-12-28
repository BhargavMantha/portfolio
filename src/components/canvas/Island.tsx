import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useIslandRotation } from '../../hooks/useIslandRotation';
import { useAutoSnap } from '../../hooks/useAutoSnap';

export const Island = () => {
  const islandRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/island.glb');

  // Apply drag-to-rotate
  const { resetMomentum } = useIslandRotation(islandRef);

  // Apply auto-snap to nearest pit stop
  useAutoSnap(islandRef, resetMomentum);

  return (
    <group ref={islandRef as any} position={[0, 0, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
};

// Preload model
useGLTF.preload('/models/island.glb');
