import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { colors } from '../../constants/colors';

export const Scene = () => {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 8, 20]}
            fov={50}
          />

          {/* Lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
          />
          <pointLight
            position={[-10, 5, -10]}
            intensity={0.8}
            color={colors.atmosphere.cyan}
          />
          <pointLight
            position={[10, 5, 10]}
            intensity={0.6}
            color={colors.atmosphere.magenta}
          />

          {/* Test cube to verify rendering */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial
              color={colors.pitStops.hero}
              emissive={colors.pitStops.hero}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Development controls (remove later) */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enablePan={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
