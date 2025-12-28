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

// Section-specific labels with Iron Man HUD-style angular arrows
const SECTION_LABELS = {
  hero: {
    text: 'Home',
    position: [0, 3.5, -1.2] as [number, number, number], // Helmet/Head
    arrowPath: [
      [0, 3.5, -1.2],  // Label position
      [0, 3.2, -0.8],  // Corner
      [0, 2.5, -0.3],  // Target: top of helmet
    ] as [number, number, number][]
  },
  about: {
    text: 'About',
    position: [-2, 2.2, -1] as [number, number, number], // Left upper area
    arrowPath: [
      [-2, 2.2, -1],   // Label position
      [-1.2, 2.0, -0.6], // Corner
      [-0.5, 1.8, -0.2], // Target: left shoulder
    ] as [number, number, number][]
  },
  experience: {
    text: 'Experience',
    position: [0, 1.2, -1.5] as [number, number, number], // Arc reactor
    arrowPath: [
      [0, 1.2, -1.5],  // Label position
      [0, 1.0, -1.0],  // Corner
      [0, 0.8, -0.3],  // Target: arc reactor center
    ] as [number, number, number][]
  },
  projects: {
    text: 'Projects',
    position: [2.2, 0, -1] as [number, number, number], // Right hand
    arrowPath: [
      [2.2, 0, -1],    // Label position
      [1.5, 0, -0.6],  // Corner
      [0.8, 0, -0.2],  // Target: right hand
    ] as [number, number, number][]
  },
  contact: {
    text: 'Contact',
    position: [-2.2, 0, -1] as [number, number, number], // Left hand
    arrowPath: [
      [-2.2, 0, -1],   // Label position
      [-1.5, 0, -0.6], // Corner
      [-0.8, 0, -0.2], // Target: left hand
    ] as [number, number, number][]
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

      {/* ALL labels with Iron Man HUD-style angular arrows */}
      {Object.entries(SECTION_LABELS).map(([sectionKey, label]) => {
        const section = sectionKey as SectionType;
        const isActive = section === activeSection;
        const sectionColor = PIT_STOPS[section].color;
        const targetPoint = label.arrowPath[label.arrowPath.length - 1];

        return (
          <group key={section}>
            {/* Angular arrow lines - Iron Man HUD style */}
            {label.arrowPath.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = label.arrowPath[index - 1];

              return (
                <mesh key={index} position={[0, 0, 0]}>
                  <tubeGeometry
                    args={[
                      new THREE.LineCurve3(
                        new THREE.Vector3(...prevPoint),
                        new THREE.Vector3(...point)
                      ) as any,
                      1,
                      0.015,
                      8,
                      false,
                    ]}
                  />
                  <meshStandardMaterial
                    color={sectionColor}
                    emissive={sectionColor}
                    emissiveIntensity={isActive ? 2.0 : 1.2}
                    toneMapped={false}
                    opacity={isActive ? 1 : 0.7}
                    transparent
                  />
                </mesh>
              );
            })}

            {/* Arrow tip at target point */}
            <mesh
              position={targetPoint}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.06, 0.12, 6]} />
              <meshStandardMaterial
                color={sectionColor}
                emissive={sectionColor}
                emissiveIntensity={isActive ? 2.5 : 1.5}
                toneMapped={false}
                opacity={isActive ? 1 : 0.8}
                transparent
              />
            </mesh>

            {/* Target point glow */}
            <mesh position={targetPoint}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={sectionColor}
                emissive={sectionColor}
                emissiveIntensity={isActive ? 3.0 : 2.0}
                toneMapped={false}
                transparent
                opacity={isActive ? 1 : 0.8}
              />
            </mesh>

            {/* HUD-style label */}
            <Html
              position={label.position}
              center
              distanceFactor={6}
              sprite
              zIndexRange={[100, 0]}
            >
              <div
                className="px-4 py-2 rounded backdrop-blur-sm border transition-all duration-300"
                style={{
                  background: `${sectionColor}25`,
                  borderColor: sectionColor,
                  borderWidth: '1px',
                  boxShadow: isActive
                    ? `0 0 20px ${sectionColor}aa, inset 0 0 10px ${sectionColor}40`
                    : `0 0 12px ${sectionColor}80, inset 0 0 6px ${sectionColor}30`,
                  opacity: isActive ? 1 : 0.85,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{
                    color: sectionColor,
                    textShadow: isActive
                      ? `0 0 10px ${sectionColor}, 0 0 20px ${sectionColor}`
                      : `0 0 6px ${sectionColor}, 0 0 12px ${sectionColor}`,
                    filter: isActive ? 'brightness(1.4)' : 'brightness(1.2)',
                    fontFamily: 'monospace',
                  }}
                >
                  {label.text.toUpperCase()}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Preload optimized Iron Man model
useGLTF.preload('/models/iron_man_mark_85_final.glb');
