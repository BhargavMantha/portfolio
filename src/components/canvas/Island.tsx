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

// Section-specific labels attached to suit parts (billboarded to camera)
const SECTION_LABELS = {
  hero: {
    text: 'Home',
    position: [0, -2.2, 0.8] as [number, number, number], // Below feet
    lineStart: [0, -2.2, 0.5] as [number, number, number],
    lineEnd: [0, -2, 0] as [number, number, number]
  },
  about: {
    text: 'About',
    position: [0, 2.5, 0.8] as [number, number, number], // Above helmet
    lineStart: [0, 2.5, 0.5] as [number, number, number],
    lineEnd: [0, 2.2, 0] as [number, number, number]
  },
  experience: {
    text: 'Experience',
    position: [0, 1, 1] as [number, number, number], // Front of chest/arc reactor
    lineStart: [0, 1, 0.7] as [number, number, number],
    lineEnd: [0, 0.8, 0.2] as [number, number, number]
  },
  projects: {
    text: 'Projects',
    position: [1.2, 0, 0.6] as [number, number, number], // Right hand side
    lineStart: [1, 0, 0.4] as [number, number, number],
    lineEnd: [0.8, 0, 0.1] as [number, number, number]
  },
  contact: {
    text: 'Contact',
    position: [-1.2, 0, 0.6] as [number, number, number], // Left hand side
    lineStart: [-1, 0, 0.4] as [number, number, number],
    lineEnd: [-0.8, 0, 0.1] as [number, number, number]
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

      {/* Section-specific label with fluorescent arrow line */}
      {activeSection && (
        <>
          {/* Fluorescent arrow line pointing to suit part */}
          <mesh position={[0, 0, 0]}>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(...SECTION_LABELS[activeSection].lineEnd),
                  new THREE.Vector3(...SECTION_LABELS[activeSection].lineStart),
                ]) as any,
                20,
                0.02,
                8,
                false,
              ]}
            />
            <meshStandardMaterial
              color={PIT_STOPS[activeSection].color}
              emissive={PIT_STOPS[activeSection].color}
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>

          {/* Fluorescent arrow tip */}
          <mesh
            position={SECTION_LABELS[activeSection].lineEnd}
            rotation={[0, 0, 0]}
          >
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshStandardMaterial
              color={PIT_STOPS[activeSection].color}
              emissive={PIT_STOPS[activeSection].color}
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>

          {/* Fluorescent section label (billboarded) */}
          <Html
            position={SECTION_LABELS[activeSection].position}
            center
            distanceFactor={8}
            sprite
            transform
            occlude
          >
            <div
              className="px-4 py-2 rounded-md backdrop-blur-sm border-2"
              style={{
                background: `${PIT_STOPS[activeSection].color}25`,
                borderColor: PIT_STOPS[activeSection].color,
                boxShadow: `0 0 20px ${PIT_STOPS[activeSection].color}, 0 0 40px ${PIT_STOPS[activeSection].color}80, inset 0 0 10px ${PIT_STOPS[activeSection].color}40`,
              }}
            >
              <div
                className="text-sm font-bold tracking-wider uppercase"
                style={{
                  color: PIT_STOPS[activeSection].color,
                  textShadow: `0 0 10px ${PIT_STOPS[activeSection].color}, 0 0 20px ${PIT_STOPS[activeSection].color}`,
                  filter: 'brightness(1.3)',
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
