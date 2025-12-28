import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { colors } from '../../../constants/colors';

const TRAIL_COUNT = 100;

// Trail emit positions (shoulders and helmet)
const EMIT_POINTS = [
  [0.6, 2.2, 0],   // Right shoulder
  [-0.6, 2.2, 0],  // Left shoulder
  [0, 3.5, -0.3],  // Helmet top
];

export const RotationTrails = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const isDragging = useIslandStore((state) => state.isDragging);

  const trailData = useRef({
    positions: new Float32Array(TRAIL_COUNT * 3),
    opacities: new Float32Array(TRAIL_COUNT),
    ages: new Float32Array(TRAIL_COUNT),
    lastEmitTime: 0,
  });

  // Initialize positions
  useMemo(() => {
    for (let i = 0; i < TRAIL_COUNT; i++) {
      trailData.current.positions[i * 3] = 0;
      trailData.current.positions[i * 3 + 1] = -100; // Hide initially
      trailData.current.positions[i * 3 + 2] = 0;
      trailData.current.opacities[i] = 0;
      trailData.current.ages[i] = 1;
    }
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = clock.getElapsedTime();
    const data = trailData.current;

    // Emit new particles when dragging
    if (isDragging && time - data.lastEmitTime > 0.03) {
      data.lastEmitTime = time;

      // Find inactive particle slot
      for (let i = 0; i < TRAIL_COUNT; i++) {
        if (data.ages[i] >= 1) {
          // Pick random emit point
          const emitPoint = EMIT_POINTS[Math.floor(Math.random() * EMIT_POINTS.length)];

          positions[i * 3] = emitPoint[0] + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = emitPoint[1] + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 2] = emitPoint[2] + (Math.random() - 0.5) * 0.2;

          data.ages[i] = 0;
          data.opacities[i] = 1;
          break;
        }
      }
    }

    // Update all particles
    for (let i = 0; i < TRAIL_COUNT; i++) {
      if (data.ages[i] < 1) {
        data.ages[i] += 0.02; // Fade over ~1 second
        data.opacities[i] = 1 - data.ages[i];

        // Drift outward and up
        positions[i * 3] *= 1.02;
        positions[i * 3 + 1] += 0.02;
        positions[i * 3 + 2] *= 1.02;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, -1.5, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_COUNT}
          array={trailData.current.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={colors.atmosphere.cyan}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
