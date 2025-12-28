import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';

interface RepulsorGlowProps {
  hand: 'left' | 'right';
  position: [number, number, number];
}

export const RepulsorGlow = ({ hand, position }: RepulsorGlowProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const activeSection = useIslandStore((state) => state.activeSection);

  // Determine if this hand's section is active
  const isActive = (hand === 'right' && activeSection === 'projects') ||
                   (hand === 'left' && activeSection === 'contact');

  useFrame(({ clock }) => {
    if (!glowRef.current) return;

    const t = clock.getElapsedTime();
    const material = glowRef.current.material as THREE.MeshStandardMaterial;

    if (isActive) {
      // Active: brighter pulse
      material.emissiveIntensity = 2.5 + Math.sin(t * 4) * 0.5;
      glowRef.current.scale.setScalar(1.2 + Math.sin(t * 4) * 0.1);
    } else {
      // Idle: gentle pulse
      material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.2;
      glowRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      {/* Core glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isActive ? '#ffffff' : '#00D4FF'}
          emissiveIntensity={1}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={isActive ? 1 : 0.3}
          toneMapped={false}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};
