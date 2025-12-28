import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SectionType } from '../types/island';
import { useIslandStore } from '../store/islandStore';
import { PIT_STOPS } from '../constants/pitStops';
import { degreesToRadians } from '../utils/rotationUtils';

// Map mesh names (or patterns) to sections
const MESH_TO_SECTION: Record<string, SectionType> = {
  // Helmet parts → About (JARVIS, Intelligence)
  helmet: 'about',
  head: 'about',
  face: 'about',
  mask: 'about',

  // Chest/Arc Reactor → Experience (Power source, core work)
  chest: 'experience',
  torso: 'experience',
  reactor: 'experience',
  body: 'experience',

  // Right hand/arm → Projects (What you build)
  'hand.r': 'projects',
  'arm.r': 'projects',
  righthand: 'projects',
  rightarm: 'projects',

  // Left hand/arm → Contact (Reaching out)
  'hand.l': 'contact',
  'arm.l': 'contact',
  lefthand: 'contact',
  leftarm: 'contact',

  // Legs/feet → Hero (Foundation)
  leg: 'hero',
  foot: 'hero',
};

export const useSuitPartClick = (groupRef: React.RefObject<THREE.Group>) => {
  const { camera, gl } = useThree();
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const setTargetRotation = useIslandStore((state) => state.setTargetRotation);
  const startRotating = useIslandStore((state) => state.startRotating);
  const setActiveSection = useIslandStore((state) => state.setActiveSection);

  const findSectionForMesh = (meshName: string): SectionType | null => {
    const lowerName = meshName.toLowerCase();

    // Check exact matches first
    if (MESH_TO_SECTION[lowerName]) {
      return MESH_TO_SECTION[lowerName];
    }

    // Check partial matches
    for (const [key, section] of Object.entries(MESH_TO_SECTION)) {
      if (lowerName.includes(key)) {
        return section;
      }
    }

    return null;
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!groupRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Raycast to find clicked mesh
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera as any);

      const intersects = raycaster.intersectObjects(groupRef.current.children, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const section = findSectionForMesh(clickedMesh.name);

        if (section) {
          // Navigate to the section
          const targetAngle = PIT_STOPS[section].angle;
          setTargetRotation(degreesToRadians(targetAngle));
          setActiveSection(section);
          startRotating();

          console.log(`Clicked ${clickedMesh.name} → ${section} section`);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!groupRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera as any);

      const intersects = raycaster.intersectObjects(groupRef.current.children, true);

      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        const section = findSectionForMesh(hoveredMesh.name);

        if (section) {
          setHoveredPart(hoveredMesh.name);
          gl.domElement.style.cursor = 'pointer';
        } else {
          setHoveredPart(null);
          gl.domElement.style.cursor = 'grab';
        }
      } else {
        setHoveredPart(null);
        gl.domElement.style.cursor = 'grab';
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [groupRef, camera, gl, setTargetRotation, setActiveSection, startRotating]);

  return { hoveredPart };
};
