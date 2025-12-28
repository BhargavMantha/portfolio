import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UniverseConfig } from '../../../constants/universes';
import { useResponsive } from '../../../hooks/useResponsive';

interface UniverseParticlesProps {
  config: UniverseConfig;
}

/**
 * Universe Particles Component
 *
 * Creates a dynamic particle system specific to each universe.
 * - Desktop: Full particle count with orbital motion
 * - Mobile: 50% particle count for performance
 * - Particles distributed in toroidal formation around Iron Man
 * - Orbital animation creates dynamic atmosphere
 */
export const UniverseParticles = ({ config }: UniverseParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { isMobile } = useResponsive();

  // Use mobile-optimized particle count on mobile devices
  const particleCount = isMobile ? config.particleCountMobile : config.particleCount;

  // Generate particle positions in toroidal distribution
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Toroidal distribution around Iron Man
      // Creates a ring-like formation that looks good from any angle
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 6; // 8-14 units from center
      const height = (Math.random() - 0.5) * 8; // -4 to 4 units vertically

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, [particleCount]);

  // Animate particles with orbital motion
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const x = positions[i3];
      const z = positions[i3 + 2];

      // Calculate current angle and radius
      const angle = Math.atan2(z, x);
      const radius = Math.sqrt(x * x + z * z);

      // Orbital motion - particles slowly rotate around Iron Man
      const orbitSpeed = 0.1;
      const newAngle = angle + orbitSpeed * clock.getDelta();

      // Update x and z positions (keep y constant for this frame)
      positions[i3] = Math.cos(newAngle) * radius;
      positions[i3 + 2] = Math.sin(newAngle) * radius;
    }

    // Mark positions as needing update for next render
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={config.particleColor}
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
