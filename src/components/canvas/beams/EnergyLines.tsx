import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { PIT_STOPS } from '../../../constants/pitStops';
import { SectionType } from '../../../types/island';

// Arc reactor position (center point)
const REACTOR_POS = new THREE.Vector3(0, 0.8, 0.4);

// Target positions for each section (where energy lines point)
const SECTION_TARGETS: Record<SectionType, [number, number, number]> = {
  hero: [0, 3, -0.5],
  about: [-1.5, 1.5, 0],
  experience: [0, 0.8, 1.5], // Forward from reactor
  projects: [1.5, 0, 0.5],
  contact: [-1.5, 0, 0.5],
};

interface EnergyLineProps {
  section: SectionType;
  isActive: boolean;
}

const EnergyLine = ({ section, isActive }: EnergyLineProps) => {
  const lineRef = useRef<THREE.Mesh>(null);
  const color = PIT_STOPS[section].color;
  const target = SECTION_TARGETS[section];

  const curve = useMemo(() => {
    return new THREE.LineCurve3(
      REACTOR_POS.clone(),
      new THREE.Vector3(...target)
    );
  }, [target]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    const material = lineRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.getElapsedTime();

    if (isActive) {
      // Active: bright pulsing
      material.opacity = 0.7 + Math.sin(t * 3) * 0.2;
      material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.5;
    } else {
      // Inactive: subtle
      material.opacity = 0.2;
      material.emissiveIntensity = 0.3;
    }
  });

  return (
    <mesh ref={lineRef}>
      <tubeGeometry args={[curve as THREE.Curve<THREE.Vector3>, 8, isActive ? 0.02 : 0.008, 6, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 1.5 : 0.3}
        transparent
        opacity={isActive ? 0.7 : 0.2}
        toneMapped={false}
      />
    </mesh>
  );
};

export const EnergyLines = () => {
  const activeSection = useIslandStore((state) => state.activeSection);
  const sections: SectionType[] = ['hero', 'about', 'experience', 'projects', 'contact'];

  return (
    <group position={[0, -1.5, 0]}> {/* Match island position */}
      {sections.map((section) => (
        <EnergyLine
          key={section}
          section={section}
          isActive={activeSection === section}
        />
      ))}
    </group>
  );
};
