import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore } from '../../../store/universeStore';
import { PIT_STOPS } from '../../../constants/pitStops';

/**
 * WarpTunnel Component
 *
 * Creates a scrolling wireframe cylinder tunnel effect during flight transitions.
 * The tunnel color matches the target universe for visual continuity.
 *
 * Features:
 * - Wireframe cylinder geometry (large radius to envelop view)
 * - Scrolling texture animation
 * - Rotation animation for motion effect
 * - Color matches target universe
 * - Only visible during flight
 */
export const WarpTunnel = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { isFlying, targetUniverse } = useUniverseStore();

  // Get color from target universe (fallback to cyan if no target)
  const color = targetUniverse ? PIT_STOPS[targetUniverse].color : '#00d4ff';

  // Animate tunnel: scroll texture and rotate
  useFrame(({ clock }) => {
    if (!meshRef.current || !isFlying) return;

    const material = meshRef.current.material as THREE.MeshBasicMaterial;

    // Scroll texture upward (creates forward motion illusion)
    if (material.map) {
      material.map.offset.y = clock.getElapsedTime() * 2;
    }

    // Rotate tunnel for hypnotic effect
    meshRef.current.rotation.z = clock.getElapsedTime() * 0.5;
  });

  // Don't render if not flying
  if (!isFlying) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -5]} // Behind Iron Man
      rotation={[Math.PI / 2, 0, 0]} // Horizontal orientation
    >
      {/* Large cylinder to envelop the view */}
      <cylinderGeometry args={[50, 50, 100, 32, 1, true]} />

      <meshBasicMaterial
        color={color}
        side={THREE.BackSide} // Render inside of cylinder
        transparent
        opacity={0.3}
        wireframe // Wireframe for tunnel effect
      />
    </mesh>
  );
};
