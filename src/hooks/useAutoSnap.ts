import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIslandStore } from '../store/islandStore';
import { detectActiveSection, findNearestPitStop } from '../utils/rotationUtils';
import { SNAP_DURATION } from '../constants/pitStops';

export const useAutoSnap = (
  groupRef: React.RefObject<THREE.Group>,
  resetMomentum: () => void
) => {
  const isDragging = useIslandStore((state) => state.isDragging);
  const setActiveSection = useIslandStore((state) => state.setActiveSection);
  const setRotation = useIslandStore((state) => state.setRotation);

  const snapState = useRef({
    isSnapping: false,
    progress: 0,
    startRotation: 0,
    targetRotation: 0,
  });

  const lastDragState = useRef(false);

  // Detect section changes
  useFrame(() => {
    if (!groupRef.current) return;

    const activeSection = detectActiveSection(groupRef.current.rotation.y);
    setActiveSection(activeSection);
  });

  // Trigger snap when drag ends
  useEffect(() => {
    if (lastDragState.current && !isDragging && groupRef.current) {
      // Drag just ended, start snap
      const nearestAngle = findNearestPitStop(groupRef.current.rotation.y);

      // Reset momentum to prevent conflict with snap animation
      resetMomentum();

      snapState.current = {
        isSnapping: true,
        progress: 0,
        startRotation: groupRef.current.rotation.y,
        targetRotation: nearestAngle,
      };
    }

    lastDragState.current = isDragging;
  }, [isDragging, resetMomentum]);

  // Animate snap
  useFrame((_, delta) => {
    if (!snapState.current.isSnapping || !groupRef.current) return;

    snapState.current.progress += delta / SNAP_DURATION;

    if (snapState.current.progress >= 1) {
      snapState.current.progress = 1;
      snapState.current.isSnapping = false;
    }

    // Ease out cubic
    const t = snapState.current.progress;
    const eased = 1 - Math.pow(1 - t, 3);

    groupRef.current.rotation.y =
      snapState.current.startRotation +
      (snapState.current.targetRotation - snapState.current.startRotation) * eased;

    setRotation(groupRef.current.rotation.y);
  });

  return snapState.current.isSnapping;
};
