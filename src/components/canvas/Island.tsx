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
    position: [-1.0, 7.5, -2.0] as [number, number, number], // Left of head, well above
    arrowPath: [
      [-0.3, 4.2, -0.5],   // Start: top of helmet (slightly left)
      [-0.7, 5.5, -1.2],   // Corner
      [-1.0, 7.5, -2.0],   // End: label position (slanting left from head)
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

// Map sections to specific mesh indices for highlighting
// Testing mode: Assign each section to a different mesh index to identify which is which
const SECTION_TO_MESH_INDEX: Record<SectionType, number> = {
  hero: 0,       // Test: Subdivision_Surface_893_Mat2_0
  about: 1,      // Test: Subdivision_Surface_894_Mat_0
  experience: 2, // Test: Subdivision_Surface_379_Mat1_0
  projects: 3,   // Test: Mesh with encoding issues #1
  contact: 4,    // Test: Mesh with encoding issues #2
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

  // Log mesh names once for debugging (only in development)
  useEffect(() => {
    if (islandRef.current && import.meta.env.DEV) {
      const meshNames: string[] = [];
      islandRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshNames.push(child.name);
        }
      });
      console.log('🦾 Iron Man mesh names:', meshNames);
    }
  }, []);

  // Highlight active section's corresponding part
  useFrame(() => {
    if (!islandRef.current || !activeSection) return;

    const targetMeshIndex = SECTION_TO_MESH_INDEX[activeSection];
    const sectionColor = PIT_STOPS[activeSection].color;

    let currentMeshIndex = 0;
    islandRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const isActivePart = currentMeshIndex === targetMeshIndex;

        // Apply subtle glow to active part
        if (isActivePart) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color(sectionColor);
          // Reduced intensity: 0.15-0.25 range with gentle pulse
          material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.002) * 0.05;
        } else {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color(0x000000);
          material.emissiveIntensity = 0;
        }

        currentMeshIndex++;
      }
    });
  });

  return (
    <group ref={islandRef as any} position={[0, -1.5, 0]}>
      <primitive object={scene} scale={3.2} rotation={[0, 0, 0]} />

      {/* Active label with Iron Man HUD-style angular arrow */}
      {activeSection && (() => {
        const label = SECTION_LABELS[activeSection];
        const sectionColor = PIT_STOPS[activeSection].color;
        const targetPoint = label.arrowPath[label.arrowPath.length - 1];

        return (
          <group>
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
                    emissiveIntensity={1.2}
                    toneMapped={false}
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
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>

            {/* Target point glow */}
            <mesh position={targetPoint}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={sectionColor}
                emissive={sectionColor}
                emissiveIntensity={1.8}
                toneMapped={false}
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
                  background: `${sectionColor}30`,
                  borderColor: sectionColor,
                  borderWidth: '2px',
                  boxShadow: `0 0 15px ${sectionColor}99, inset 0 0 8px ${sectionColor}50`,
                }}
              >
                <div
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{
                    color: sectionColor,
                    textShadow: `0 0 8px ${sectionColor}, 0 0 15px ${sectionColor}`,
                    filter: 'brightness(1.6)',
                    fontFamily: 'monospace',
                  }}
                >
                  {label.text.toUpperCase()}
                </div>
              </div>
            </Html>
          </group>
        );
      })()}
    </group>
  );
};

// Preload optimized Iron Man model
useGLTF.preload('/models/iron_man_mark_85_final.glb');
