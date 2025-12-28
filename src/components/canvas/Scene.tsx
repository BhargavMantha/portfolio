import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import { Island } from './Island';
import { Sky } from './atmosphere/Sky';
import { GPUParticles } from './particles/GPUParticles';
import { EnergyLines } from './beams/EnergyLines';
import { RotationTrails } from './beams/RotationTrails';
import { Universe } from './universes/Universe';
import { FlightController, WarpTunnel } from './flight';
import { PostProcessingEffects } from './effects';
import { colors } from '../../constants/colors';
import { useCameraOrbit } from '../../hooks/useCameraOrbit';

const SceneContent = () => {
  // Camera orbit hook - handles desktop drag and mobile auto-rotate
  useCameraOrbit();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 10]}
        fov={50}
      />
      <fog attach="fog" args={['#0a1628', 10, 30]} />

      {/* Flight system - manages transitions between universes */}
      <FlightController />
      <WarpTunnel />

      {/* Universe environment - dynamic background, fog, and particles */}
      <Universe />

      {/* Dramatic cinematic lighting */}
      <ambientLight intensity={0.3} />

      {/* Key light - strong from upper right */}
      <directionalLight
        position={[10, 12, 8]}
        intensity={3.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Rim light - strong blue from behind for edge definition */}
      <directionalLight
        position={[0, 5, -10]}
        intensity={4.0}
        color="#0088ff"
      />

      {/* Fill light - subtle cyan from left */}
      <directionalLight
        position={[-8, 6, 5]}
        intensity={1.8}
        color="#00d4ff"
      />

      {/* Accent spotlights for drama */}
      <spotLight
        position={[0, 15, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={5.0}
        color="#ffffff"
        castShadow
      />

      {/* Colorful accent lights - cyberpunk feel */}
      <pointLight position={[-10, 3, 6]} intensity={3.0} color={colors.atmosphere.cyan} distance={25} />
      <pointLight position={[10, 3, 6]} intensity={3.0} color="#ff6600" distance={25} />
      <pointLight position={[0, 8, -5]} intensity={2.5} color="#ff00ff" distance={20} />

      <Sky />
      <GPUParticles />
      <EnergyLines />
      <RotationTrails />
      <Island />
    </>
  );
};

export const Scene = () => {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        {/* Post-processing effects - outside Suspense to persist during loading */}
        <PostProcessingEffects />
      </Canvas>
    </div>
  );
};
