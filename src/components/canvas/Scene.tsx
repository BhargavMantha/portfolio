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
            position={[0, 2, 10]}
            fov={50}
          />

          {/* Lighting setup - Much brighter */}
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={3.5}
            castShadow
          />
          <directionalLight
            position={[-10, 10, -5]}
            intensity={2.5}
          />
          <directionalLight
            position={[0, 5, 10]}
            intensity={2.0}
          />
          <pointLight
            position={[-10, 5, -10]}
            intensity={2.0}
            color={colors.atmosphere.cyan}
          />
          <pointLight
            position={[10, 5, 10]}
            intensity={1.8}
            color={colors.atmosphere.magenta}
          />
          <spotLight
            position={[0, 10, 0]}
            intensity={2.5}
            angle={0.6}
            penumbra={0.5}
            color="#ffffff"
          />

          <Sky />
          <DataParticles />
          <Island />
        </Suspense>
      </Canvas>
    </div>
  );
};
