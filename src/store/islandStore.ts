import { create } from 'zustand';
import { SectionType } from '../types/island';

interface IslandStore {
  rotationY: number;
  targetRotation: number;
  activeSection: SectionType | null;
  isRotating: boolean;
  isDragging: boolean;
  rotationVelocity: number; // for particle flow direction
  qualityLevel: 'high' | 'medium' | 'low'; // for performance scaling

  setRotation: (rotation: number) => void;
  setTargetRotation: (rotation: number) => void;
  setActiveSection: (section: SectionType | null) => void;
  startDrag: () => void;
  endDrag: () => void;
  startRotating: () => void;
  endRotating: () => void;
  setRotationVelocity: (velocity: number) => void;
  setQualityLevel: (level: 'high' | 'medium' | 'low') => void;
}

export const useIslandStore = create<IslandStore>((set) => ({
  rotationY: 0,
  targetRotation: 0,
  activeSection: null,
  isRotating: false,
  isDragging: false,
  rotationVelocity: 0,
  qualityLevel: 'high',

  setRotation: (rotation) => set({ rotationY: rotation }),
  setTargetRotation: (rotation) => set({ targetRotation: rotation }),
  setActiveSection: (section) => set({ activeSection: section }),
  startDrag: () => set({ isDragging: true }),
  endDrag: () => set({ isDragging: false }),
  startRotating: () => set({ isRotating: true }),
  endRotating: () => set({ isRotating: false }),
  setRotationVelocity: (velocity) => set({ rotationVelocity: velocity }),
  setQualityLevel: (level) => set({ qualityLevel: level }),
}));
