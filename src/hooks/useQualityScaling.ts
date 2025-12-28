import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIslandStore } from '../store/islandStore';

export const useQualityScaling = () => {
  const setQualityLevel = useIslandStore((state) => state.setQualityLevel);

  const fpsRef = useRef({
    frames: 0,
    lastTime: performance.now(),
    fps: 60,
  });

  useFrame(() => {
    fpsRef.current.frames++;

    const now = performance.now();
    const elapsed = now - fpsRef.current.lastTime;

    // Calculate FPS every second
    if (elapsed >= 1000) {
      const fps = (fpsRef.current.frames * 1000) / elapsed;
      fpsRef.current.fps = fps;
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;

      // Adjust quality based on FPS
      if (fps < 30) {
        setQualityLevel('low');
      } else if (fps < 50) {
        setQualityLevel('medium');
      } else {
        setQualityLevel('high');
      }
    }
  });

  return fpsRef.current.fps;
};
