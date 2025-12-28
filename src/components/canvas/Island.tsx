import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Island = () => {
  const islandRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/island.glb');

  // Temporary rotation for testing (will replace with drag controls)
  useFrame((_, delta) => {
    if (islandRef.current) {
      islandRef.current.rotation.y += delta * 0.2; // Slow rotation
    }
  });

  return (
    <group ref={islandRef as any} position={[0, 0, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
};

// Preload model
useGLTF.preload('/models/island.glb');
