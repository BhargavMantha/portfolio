import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useUniverseStore } from '../store/universeStore';
import { useResponsive } from './useResponsive';
import * as THREE from 'three';

/**
 * Camera Orbit Hook
 *
 * Provides camera orbit controls for the Flying Iron Man Universe Navigator.
 *
 * Desktop: Drag to orbit around Iron Man
 * - Horizontal drag controls phi (0-360°)
 * - Vertical drag controls theta (-45° to 45°)
 * - Disabled during flight transitions
 *
 * Mobile: Auto-rotate
 * - Continuous rotation at 10°/second
 * - Provides dynamic viewing experience without drag
 *
 * Camera positioning uses spherical coordinates:
 * - phi: horizontal angle (azimuth)
 * - theta: vertical angle (elevation)
 * - distance: radius from center (12 normal, 15 during flight)
 */
export const useCameraOrbit = () => {
  const { camera } = useThree();
  const { isMobile } = useResponsive();
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const autoRotateSpeed = useRef(0);

  const { cameraOrbit, updateCameraOrbit, isFlying } = useUniverseStore();

  // Desktop: Handle mouse drag to orbit
  useEffect(() => {
    if (isMobile || isFlying) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      // Update phi (horizontal) and theta (vertical)
      // Sensitivity: 0.5 for horizontal, 0.3 for vertical (slower vertical feel)
      const newPhi = cameraOrbit.phi + deltaX * 0.5;
      const newTheta = cameraOrbit.theta + deltaY * 0.3;

      updateCameraOrbit(newPhi, newTheta);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      isDragging.current = false; // Reset drag state on cleanup
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, isFlying, cameraOrbit, updateCameraOrbit]);

  // Mobile: Set auto-rotate speed
  useEffect(() => {
    if (isMobile) {
      autoRotateSpeed.current = 10; // 10 degrees per second
    } else {
      autoRotateSpeed.current = 0; // No auto-rotate on desktop
    }
  }, [isMobile]);

  // Update camera position every frame
  useFrame((_, delta) => {
    // Guard against undefined camera
    if (!camera) return;

    // Auto-rotate on mobile (disabled during flight)
    if (isMobile && !isFlying) {
      const newPhi = cameraOrbit.phi + autoRotateSpeed.current * delta;
      updateCameraOrbit(newPhi, cameraOrbit.theta);
    }

    // Convert spherical coordinates to cartesian
    const phi = THREE.MathUtils.degToRad(cameraOrbit.phi);
    const theta = THREE.MathUtils.degToRad(cameraOrbit.theta);

    // Spherical to cartesian conversion
    // x = distance * cos(theta) * sin(phi)
    // y = distance * sin(theta)
    // z = distance * cos(theta) * cos(phi)
    const x = cameraOrbit.distance * Math.cos(theta) * Math.sin(phi);
    const y = cameraOrbit.distance * Math.sin(theta);
    const z = cameraOrbit.distance * Math.cos(theta) * Math.cos(phi);

    // Smooth lerp to target position (0.1 factor = smooth but responsive)
    camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);

    // Always look at Iron Man (origin)
    camera.lookAt(0, 0, 0);
  });
};
