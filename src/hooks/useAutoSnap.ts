import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIslandStore } from '../store/islandStore';
import { detectActiveSection, findNearestPitStop } from '../utils/rotationUtils';
import { SNAP_DURATION, NAV_DURATION } from '../constants/pitStops';

export const useAutoSnap = (
  groupRef: React.RefObject<THREE.Group>,
  resetMomentum: () => void
) => {
  const isDragging = useIslandStore((state) => state.isDragging);
  const targetRotation = useIslandStore((state) => state.targetRotation);
  const isRotating = useIslandStore((state) => state.isRotating);
  const setActiveSection = useIslandStore((state) => state.setActiveSection);
  const setRotation = useIslandStore((state) => state.setRotation);
  const endRotating = useIslandStore((state) => state.endRotating);

  const snapState = useRef({
    isSnapping: false,
    progress: 0,
    startRotation: 0,
    targetRotation: 0,
    duration: SNAP_DURATION, // Track duration for current animation
  });

  const lastDragState = useRef(false);

  // Detect section changes
  useFrame(() => {
    if (!groupRef.current) return;

    const activeSection = detectActiveSection(groupRef.current.rotation.y);
    setActiveSection(activeSection);
  });

  // Handle button navigation - trigger when isRotating becomes true
  useEffect(() => {
    if (isRotating && groupRef.current) {
      // Button navigation triggered
      resetMomentum();

      snapState.current = {
        isSnapping: true,
        progress: 0,
        startRotation: groupRef.current.rotation.y,
        targetRotation: targetRotation,
        duration: NAV_DURATION, // Use longer duration for button navigation
      };
    }
  }, [isRotating, targetRotation, resetMomentum]);

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
        duration: SNAP_DURATION, // Use shorter duration for drag snap
      };
    }

    lastDragState.current = isDragging;
  }, [isDragging, resetMomentum]);

  // Animate snap
  useFrame((_, delta) => {
    if (!snapState.current.isSnapping || !groupRef.current) return;

    snapState.current.progress += delta / snapState.current.duration;

    if (snapState.current.progress >= 1) {
      snapState.current.progress = 1;
      snapState.current.isSnapping = false;
      endRotating(); // End rotation when snap completes
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
