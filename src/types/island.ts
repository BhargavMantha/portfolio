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
