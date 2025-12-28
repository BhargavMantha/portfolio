import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '../../../constants/colors';

export const DataParticles = () => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const count = 500;

  const { positions } = useMemo(() => {
    const positions: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 10 + Math.random() * 5;
      const height = (Math.random() - 0.5) * 10;

      positions.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        )
      );
    }

    return { positions };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    positions.forEach((pos, i) => {
      const offset = i * 0.1;
      const t = delta * 0.5;

      dummy.position.copy(pos);
      dummy.position.y += Math.sin(Date.now() * 0.001 + offset) * 0.5;
      dummy.rotation.y += t;
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef as any} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshStandardMaterial
        color={colors.atmosphere.cyan}
        emissive={colors.atmosphere.cyan}
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
};
