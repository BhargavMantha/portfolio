import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useIslandStore } from '../store/islandStore';
import { ROTATION_SENSITIVITY, MOMENTUM_DECAY } from '../constants/pitStops';

export const useIslandRotation = (groupRef: React.RefObject<THREE.Group>) => {
  const { gl } = useThree();
  const isDragging = useIslandStore((state) => state.isDragging);
  const startDrag = useIslandStore((state) => state.startDrag);
  const endDrag = useIslandStore((state) => state.endDrag);
  const setRotation = useIslandStore((state) => state.setRotation);

  const dragState = useRef({
    startX: 0,
    lastX: 0,
    velocity: 0,
  });

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      dragState.current.startX = e.clientX;
      dragState.current.lastX = e.clientX;
      dragState.current.velocity = 0;
      startDrag();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragState.current.lastX;
      const rotationDelta = deltaX * ROTATION_SENSITIVITY;

      if (groupRef.current) {
        groupRef.current.rotation.y += rotationDelta * 0.01;
        setRotation(groupRef.current.rotation.y);
      }

      dragState.current.velocity = rotationDelta;
      dragState.current.lastX = e.clientX;
    };

    const handleMouseUp = () => {
      endDrag();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, gl, startDrag, endDrag, setRotation, groupRef]);

  // Apply momentum after drag ends
  useFrame(() => {
    if (!isDragging && Math.abs(dragState.current.velocity) > 0.01) {
      if (groupRef.current) {
        groupRef.current.rotation.y += dragState.current.velocity * 0.01;
        setRotation(groupRef.current.rotation.y);
      }
      dragState.current.velocity *= MOMENTUM_DECAY;
    }
  });

  // Expose reset function for auto-snap to prevent conflict
  const resetMomentum = () => {
    dragState.current.velocity = 0;
  };

  return { resetMomentum };
};
