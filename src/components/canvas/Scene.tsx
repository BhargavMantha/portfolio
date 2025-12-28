import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Island } from './Island';
import { Sky } from './atmosphere/Sky';
import { DataParticles } from './atmosphere/DataParticles';
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

          <Sky />
          <DataParticles />
          <Island />
        </Suspense>
      </Canvas>
    </div>
  );
};
