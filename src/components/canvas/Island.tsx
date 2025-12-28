import { useGLTF, Html } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useFrame } from '@react-three/fiber';
import { useIslandRotation } from '../../hooks/useIslandRotation';
import { useAutoSnap } from '../../hooks/useAutoSnap';
import { useSuitPartClick } from '../../hooks/useSuitPartClick';
import { useIslandStore } from '../../store/islandStore';
import { PIT_STOPS } from '../../constants/pitStops';
import { SectionType } from '../../types/island';

// Section-specific labels and positions with arrow indicators
const SECTION_LABELS = {
  hero: {
    text: 'Home',
    position: [-2, -1, 0] as [number, number, number],
    lineStart: [-1.5, -1, 0] as [number, number, number],
    lineEnd: [0, -1.5, 0] as [number, number, number]
  },
  about: {
    text: 'About',
    position: [-2.5, 2, 0] as [number, number, number],
    lineStart: [-2, 2, 0] as [number, number, number],
    lineEnd: [0, 2.2, 0] as [number, number, number]
  },
  experience: {
    text: 'Experience',
    position: [2.5, 0.5, 0] as [number, number, number],
    lineStart: [2, 0.5, 0] as [number, number, number],
    lineEnd: [0, 0.8, 0] as [number, number, number]
  },
  projects: {
    text: 'Projects',
    position: [2.5, -0.5, 0] as [number, number, number],
    lineStart: [2, -0.5, 0] as [number, number, number],
    lineEnd: [1.2, -0.3, 0] as [number, number, number]
  },
  contact: {
    text: 'Contact',
    position: [-2.5, -0.5, 0] as [number, number, number],
    lineStart: [-2, -0.5, 0] as [number, number, number],
    lineEnd: [-1.2, -0.3, 0] as [number, number, number]
  },
};

// Map sections to part keywords for highlighting
const SECTION_TO_PART_KEYWORDS: Record<SectionType, string[]> = {
  hero: ['leg', 'foot'],
  about: ['helmet', 'head', 'face', 'mask'],
  experience: ['chest', 'torso', 'reactor', 'body'],
  projects: ['hand.r', 'arm.r', 'right'],
  contact: ['hand.l', 'arm.l', 'left'],
};

export const Island = () => {
  const islandRef = useRef<THREE.Group>(null);

  // Setup Draco decoder for compressed model
  useEffect(() => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    return () => {
      dracoLoader.dispose();
    };
  }, []);

  // Load optimized Iron Man model (4.9MB with Draco compression)
  const { scene } = useGLTF('/models/iron_man_mark_85_final.glb');
  const activeSection = useIslandStore((state) => state.activeSection);

  // Apply drag-to-rotate
  const { resetMomentum } = useIslandRotation(islandRef);

  // Apply auto-snap to nearest pit stop
  useAutoSnap(islandRef, resetMomentum);

  // Enable clickable parts
  useSuitPartClick(islandRef);

  // Highlight active section's corresponding part
  useFrame(() => {
    if (!islandRef.current || !activeSection) return;

    const keywords = SECTION_TO_PART_KEYWORDS[activeSection];
    const sectionColor = PIT_STOPS[activeSection].color;

    islandRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const meshName = child.name.toLowerCase();
        const isActivePart = keywords.some((keyword) =>
          meshName.includes(keyword.toLowerCase())
        );

        // Apply glow to active part
        if (isActivePart) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color(sectionColor);
          material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
        } else {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color(0x000000);
          material.emissiveIntensity = 0;
        }
      }
    });
  });

  return (
    <group ref={islandRef as any} position={[0, -1.5, 0]}>
      <primitive object={scene} scale={3.2} rotation={[0, 0, 0]} />

      {/* Section-specific label with arrow line */}
      {activeSection && (
        <>
          {/* Arrow line pointing to suit part */}
          <mesh position={[0, 0, 0]}>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(...SECTION_LABELS[activeSection].lineEnd),
                  new THREE.Vector3(...SECTION_LABELS[activeSection].lineStart),
                ]) as any,
                20,
                0.015,
                8,
                false,
              ]}
            />
            <meshBasicMaterial color={PIT_STOPS[activeSection].color} />
          </mesh>

          {/* Arrow tip */}
          <mesh
            position={SECTION_LABELS[activeSection].lineEnd}
            rotation={[0, 0, 0]}
          >
            <coneGeometry args={[0.05, 0.1, 8]} />
            <meshBasicMaterial color={PIT_STOPS[activeSection].color} />
          </mesh>

          {/* Compact section label */}
          <Html
            position={SECTION_LABELS[activeSection].position}
            center
            distanceFactor={10}
          >
            <div
              className="px-3 py-1.5 rounded backdrop-blur-sm border"
              style={{
                background: `${PIT_STOPS[activeSection].color}15`,
                borderColor: PIT_STOPS[activeSection].color,
                boxShadow: `0 0 10px ${PIT_STOPS[activeSection].color}60`,
              }}
            >
              <div
                className="text-sm font-semibold tracking-wide"
                style={{
                  color: PIT_STOPS[activeSection].color,
                  textShadow: `0 0 8px ${PIT_STOPS[activeSection].color}`,
                }}
              >
                {SECTION_LABELS[activeSection].text}
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

// Preload optimized Iron Man model
useGLTF.preload('/models/iron_man_mark_85_final.glb');
