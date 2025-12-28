import { useGLTF, Html } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useIslandRotation } from '../../hooks/useIslandRotation';
import { useAutoSnap } from '../../hooks/useAutoSnap';
import { useIslandStore } from '../../store/islandStore';
import { PIT_STOPS } from '../../constants/pitStops';

// Section-specific labels and positions
const SECTION_LABELS = {
  hero: { text: 'MARK 85', position: [0, 3, 0] as [number, number, number] },
  about: { text: 'JARVIS INTERFACE', position: [0, 2.5, 0] as [number, number, number] },
  experience: { text: 'ARC REACTOR', position: [0, 1.5, 0] as [number, number, number] },
  projects: { text: 'REPULSOR TECH', position: [0, 2, 0] as [number, number, number] },
  contact: { text: 'CONNECT', position: [0, 2.8, 0] as [number, number, number] },
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

  return (
    <group ref={islandRef as any} position={[0, -2, 0]}>
      <primitive object={scene} scale={2.5} rotation={[0, 0, 0]} />

      {/* Section-specific floating label */}
      {activeSection && (
        <Html
          position={SECTION_LABELS[activeSection].position}
          center
          distanceFactor={10}
        >
          <div
            className="px-6 py-3 rounded-lg backdrop-blur-md border-2 animate-pulse"
            style={{
              background: `${PIT_STOPS[activeSection].color}20`,
              borderColor: PIT_STOPS[activeSection].color,
              boxShadow: `0 0 20px ${PIT_STOPS[activeSection].color}80`,
            }}
          >
            <div
              className="text-2xl font-bold tracking-wider"
              style={{
                color: PIT_STOPS[activeSection].color,
                textShadow: `0 0 10px ${PIT_STOPS[activeSection].color}`,
              }}
            >
              {SECTION_LABELS[activeSection].text}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Preload optimized Iron Man model
useGLTF.preload('/models/iron_man_mark_85_final.glb');
