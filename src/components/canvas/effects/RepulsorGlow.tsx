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
      // Active: dramatic bright pulse
      material.emissiveIntensity = 5.0 + Math.sin(t * 4) * 1.5;
      glowRef.current.scale.setScalar(1.4 + Math.sin(t * 4) * 0.2);
    } else {
      // Idle: visible pulse
      material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.5;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    }
  });

  return (
    <group position={position}>
      {/* Core glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isActive ? '#ffffff' : '#00D4FF'}
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={isActive ? 2.5 : 0.8}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
};
