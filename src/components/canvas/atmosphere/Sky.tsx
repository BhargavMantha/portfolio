import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { colors } from '../../../constants/colors';

export const Sky = () => {
  const skyRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (skyRef.current) {
      skyRef.current.rotation.y += delta * 0.01; // Slow rotation
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[500, 32, 32]} />
      <meshBasicMaterial
        color={colors.background.secondary}
        side={2} // DoubleSide
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};
