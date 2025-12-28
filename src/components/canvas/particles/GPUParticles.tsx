import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { colors } from '../../../constants/colors';

// Particle count
const PARTICLE_COUNT = 3000;

// Section attractor positions (in world space, adjusted for island position)
const SECTION_ATTRACTORS: Record<string, [number, number, number]> = {
  hero: [0, 2.5, 0],
  about: [-0.5, 1.8, -0.2],
  experience: [0, 0.8, 0.4],
  projects: [0.8, 0, -0.2],
  contact: [-0.8, 0, -0.2],
};

export const GPUParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const activeSection = useIslandStore((state) => state.activeSection);
  const isDragging = useIslandStore((state) => state.isDragging);

  // Create particles with initial positions in toroidal distribution
  const positions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Toroidal distribution: radius 8-14, height -4 to 4
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 6; // 8-14 units from center
      const height = (Math.random() - 0.5) * 8; // -4 to 4

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, []);

  // Animation state
  const animationRef = useRef({
    velocities: new Float32Array(PARTICLE_COUNT * 3),
    time: 0,
  });

  // Initialize velocities
  useEffect(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      animationRef.current.velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      animationRef.current.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      animationRef.current.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }, []);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    animationRef.current.time += delta;

    const attractorPos = activeSection ? SECTION_ATTRACTORS[activeSection] : null;
    const attractStrength = activeSection ? 0.5 : 0;
    const rotationBoost = isDragging ? 2 : 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // Orbital motion
      const angle = Math.atan2(z, x);
      const radius = Math.sqrt(x * x + z * z);
      const orbitSpeed = (0.1 + (i % 10) * 0.01) * rotationBoost;
      const newAngle = angle + orbitSpeed * delta;

      x = Math.cos(newAngle) * radius;
      z = Math.sin(newAngle) * radius;

      // Vertical bob
      y += Math.sin(animationRef.current.time * 2 + i * 0.1) * 0.01;

      // Attractor influence
      if (attractorPos && Math.random() < 0.1) { // Only affect 10% per frame
        const dx = attractorPos[0] - x;
        const dy = attractorPos[1] - y;
        const dz = attractorPos[2] - z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 2) {
          x += (dx / dist) * attractStrength * delta;
          y += (dy / dist) * attractStrength * delta;
          z += (dz / dist) * attractStrength * delta;
        }
      }

      // Keep in bounds
      const newRadius = Math.sqrt(x * x + z * z);
      if (newRadius > 14) {
        const scale = 14 / newRadius;
        x *= scale;
        z *= scale;
      } else if (newRadius < 6) {
        const scale = 6 / newRadius;
        x *= scale;
        z *= scale;
      }

      y = Math.max(-4, Math.min(4, y));

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={colors.atmosphere.cyan}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
