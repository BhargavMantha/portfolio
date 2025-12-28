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

          {/* Lighting setup - ULTRA BRIGHT */}
          <ambientLight intensity={2.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={5.0}
            castShadow
          />
          <directionalLight
            position={[-10, 10, -5]}
            intensity={4.0}
          />
          <directionalLight
            position={[0, 5, 10]}
            intensity={3.5}
          />
          <directionalLight
            position={[0, -5, 5]}
            intensity={3.0}
          />
          <pointLight
            position={[-10, 5, -10]}
            intensity={3.0}
            color={colors.atmosphere.cyan}
          />
          <pointLight
            position={[10, 5, 10]}
            intensity={3.0}
            color={colors.atmosphere.blue}
          />
          <pointLight
            position={[0, 0, 15]}
            intensity={4.0}
            color="#ffffff"
          />
          <spotLight
            position={[0, 15, 0]}
            intensity={4.0}
            angle={0.8}
            penumbra={0.3}
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
