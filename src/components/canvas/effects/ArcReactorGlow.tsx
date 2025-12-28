import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArcReactorGlowProps {
  position?: [number, number, number];
}

export const ArcReactorGlow = ({ position = [0, 0.8, 0.4] }: ArcReactorGlowProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current || !ringRef.current) return;

    const t = clock.getElapsedTime();

    // Pulsing intensity: 0.8 -> 1.2 range
    const pulse = 1.0 + Math.sin(t * 2) * 0.2;

    const glowMaterial = glowRef.current.material as THREE.MeshStandardMaterial;
    glowMaterial.emissiveIntensity = pulse * 2;

    const ringMaterial = ringRef.current.material as THREE.MeshStandardMaterial;
    ringMaterial.emissiveIntensity = pulse * 1.5;

    // Subtle scale pulse
    glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
  });

  return (
    <group position={position}>
      {/* Core glow - bright center */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00D4FF"
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00F5FF"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Glow halo (large, faint) */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={0.5}
          toneMapped={false}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
