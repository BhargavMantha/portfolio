export type SectionType = 'hero' | 'about' | 'experience' | 'projects' | 'contact';

export interface IslandState {
  rotationY: number;           // Current rotation (0-360°)
  targetRotation: number;      // Target for smooth transitions
  activeSection: SectionType | null;
  isRotating: boolean;         // Animating to target?
  isDragging: boolean;         // User actively dragging?
}

export interface PitStop {
  id: SectionType;
  angle: number;               // Rotation angle (0-360°)
  color: string;               // Primary color
  label: string;               // Display name
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  lastX: number;
  velocity: number;
}

/**
 * Universe Navigator Types
 */

export interface UniverseConfig {
  id: SectionType;
  name: string;
  color: string;
  description: string;
  particleCount: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface FlightState {
  isFlying: boolean;
  targetUniverse: SectionType | null;
  startTime: number;
  duration: number;
  progress: number; // 0-1
}

export type FlightPhase =
  | 'idle'          // Hovering in current universe
  | 'preparing'     // 0.5s - flight pose, repulsors charge
  | 'flying'        // 3-6s - animation, warp tunnel
  | 'arriving'      // 1s - deceleration, universe fade-in
  ;

export interface CameraOrbitState {
  phi: number;      // Horizontal rotation (0-360°)
  theta: number;    // Vertical rotation (-45° to 45°)
  distance: number; // Camera distance from Iron Man
}
