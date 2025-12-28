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

    // Stronger pulsing intensity: 0.7 -> 1.3 range
    const pulse = 1.0 + Math.sin(t * 2.5) * 0.3;

    const glowMaterial = glowRef.current.material as THREE.MeshStandardMaterial;
    glowMaterial.emissiveIntensity = pulse * 4.0;

    const ringMaterial = ringRef.current.material as THREE.MeshStandardMaterial;
    ringMaterial.emissiveIntensity = pulse * 3.0;

    // More pronounced scale pulse
    glowRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.1);
  });

  return (
    <group position={position}>
      {/* Core glow - bright center */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00D4FF"
          emissiveIntensity={4}
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 12, 48]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={3}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 12, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00F5FF"
          emissiveIntensity={4}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Glow halo (large, bright) */}
      <mesh>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};
