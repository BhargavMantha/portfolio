import { create } from 'zustand';
import { SectionType } from '../types/island';

/**
 * Universe Navigator Store
 *
 * Manages state for the Flying Iron Man Universe Navigator experience.
 * Tracks current universe, flight state, camera orbit, and visit history.
 */

export interface CameraOrbit {
  phi: number;      // Horizontal rotation (0-360°)
  theta: number;    // Vertical rotation (-45° to 45°)
  distance: number; // 12 units default, 15 during flight
}

export interface UniverseStore {
  // Current state
  currentUniverse: SectionType;
  isFlying: boolean;
  targetUniverse: SectionType | null;

  // Visit tracking
  visitedUniverses: Set<SectionType>;

  // Camera state
  cameraOrbit: CameraOrbit;

  // Flight timing
  flightStartTime: number;
  flightDuration: number; // 4-6s first visit, 3s repeat

  // Quality settings
  qualityTier: 'high' | 'medium' | 'low';
  targetFPS: number;
  currentFPS: number;

  // Actions
  initiateFlightTo: (section: SectionType) => void;
  completeFlightTo: (section: SectionType) => void;
  updateCameraOrbit: (phi: number, theta: number, distance?: number) => void;
  adjustQuality: (fps: number) => void;
  isFirstVisit: (section: SectionType) => boolean;
  updateFPS: (fps: number) => void;
  resetVisitedUniverses: () => void;
}

export const useUniverseStore = create<UniverseStore>((set, get) => ({
  // Initial state
  currentUniverse: 'hero',
  isFlying: false,
  targetUniverse: null,

  // Visit tracking - hero is pre-visited as starting universe
  visitedUniverses: new Set<SectionType>(['hero']),

  // Camera defaults
  cameraOrbit: {
    phi: 0,
    theta: 0,
    distance: 12,
  },

  // Flight timing
  flightStartTime: 0,
  flightDuration: 3000, // Default 3s

  // Quality settings
  qualityTier: 'high',
  targetFPS: 60,
  currentFPS: 60,

  // Actions

  /**
   * Initiate flight to target universe
   * - Determines flight duration based on first visit vs repeat
   * - Sets up flight state and timing
   */
  initiateFlightTo: (section: SectionType) => {
    const { visitedUniverses, currentUniverse } = get();

    // Don't fly to current universe
    if (section === currentUniverse) return;

    // Calculate flight duration based on visit history
    const isFirstVisit = !visitedUniverses.has(section);
    const duration = isFirstVisit
      ? 4000 + Math.random() * 2000 // 4-6s varied for first visit
      : 3000; // 3s for repeat visits

    set({
      isFlying: true,
      targetUniverse: section,
      flightStartTime: Date.now(),
      flightDuration: duration,
      cameraOrbit: {
        ...get().cameraOrbit,
        distance: 15, // Pull back camera during flight
      }
    });
  },

  /**
   * Complete flight and arrive at target universe
   * - Updates current universe
   * - Marks universe as visited
   * - Resets flight state
   */
  completeFlightTo: (section: SectionType) => {
    const { visitedUniverses } = get();
    const newVisited = new Set(visitedUniverses);
    newVisited.add(section);

    set({
      currentUniverse: section,
      isFlying: false,
      targetUniverse: null,
      visitedUniverses: newVisited,
      cameraOrbit: {
        ...get().cameraOrbit,
        distance: 12, // Return to normal camera distance
      }
    });
  },

  /**
   * Update camera orbit position
   * - phi: horizontal rotation (0-360°)
   * - theta: vertical rotation (-45° to 45°)
   * - distance: camera distance from Iron Man (optional)
   */
  updateCameraOrbit: (phi: number, theta: number, distance?: number) => {
    const currentOrbit = get().cameraOrbit;

    // Normalize phi to 0-360 range
    const normalizedPhi = ((phi % 360) + 360) % 360;

    // Clamp theta to -45° to 45° range
    const clampedTheta = Math.max(-45, Math.min(45, theta));

    set({
      cameraOrbit: {
        phi: normalizedPhi,
        theta: clampedTheta,
        distance: distance ?? currentOrbit.distance,
      }
    });
  },

  /**
   * Check if a section has been visited
   */
  isFirstVisit: (section: SectionType) => {
    const { visitedUniverses } = get();
    return !visitedUniverses.has(section);
  },

  /**
   * Update current FPS reading
   */
  updateFPS: (fps: number) => {
    set({ currentFPS: fps });
  },

  /**
   * Adjust quality tier based on FPS performance
   * - Monitors FPS and adjusts quality settings dynamically
   */
  adjustQuality: (fps: number) => {
    const { targetFPS, qualityTier } = get();

    set({ currentFPS: fps });

    // Reduce quality if FPS drops below target - 10
    if (fps < targetFPS - 10) {
      if (qualityTier === 'high') {
        set({ qualityTier: 'medium' });
      } else if (qualityTier === 'medium') {
        set({ qualityTier: 'low' });
      }
    }
    // Increase quality if FPS is comfortably above target + 5
    else if (fps > targetFPS + 5) {
      if (qualityTier === 'low') {
        set({ qualityTier: 'medium' });
      } else if (qualityTier === 'medium') {
        set({ qualityTier: 'high' });
      }
    }
  },

  /**
   * Reset visited universes (useful for testing or demo mode)
   */
  resetVisitedUniverses: () => {
    set({
      visitedUniverses: new Set<SectionType>(['hero']),
      currentUniverse: 'hero'
    });
  },
}));
