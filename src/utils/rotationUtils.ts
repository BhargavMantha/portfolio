import { SectionType } from '../types/island';
import { PIT_STOPS, SNAP_THRESHOLD } from '../constants/pitStops';

/**
 * Normalize rotation to 0-360° range
 */
export const normalizeRotation = (rotation: number): number => {
  const degrees = (rotation * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
};

/**
 * Convert degrees to radians
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Detect which pit stop is currently active based on rotation
 */
export const detectActiveSection = (rotationY: number): SectionType | null => {
  const normalizedDegrees = normalizeRotation(rotationY);

  for (const pitStop of Object.values(PIT_STOPS)) {
    const diff = Math.abs(normalizedDegrees - pitStop.angle);
    const wrappedDiff = Math.abs(360 - diff);
    const minDiff = Math.min(diff, wrappedDiff);

    if (minDiff <= SNAP_THRESHOLD) {
      return pitStop.id;
    }
  }

  return null;
};

/**
 * Find nearest pit stop angle from current rotation
 */
export const findNearestPitStop = (rotationY: number): number => {
  const normalizedDegrees = normalizeRotation(rotationY);
  let nearestAngle = 0;
  let minDiff = Infinity;

  for (const pitStop of Object.values(PIT_STOPS)) {
    const diff = Math.abs(normalizedDegrees - pitStop.angle);
    const wrappedDiff = Math.abs(360 - diff);
    const actualDiff = Math.min(diff, wrappedDiff);

    if (actualDiff < minDiff) {
      minDiff = actualDiff;
      nearestAngle = pitStop.angle;
    }
  }

  return degreesToRadians(nearestAngle);
};

/**
 * Calculate shortest rotation path to target
 */
export const calculateRotationPath = (
  current: number,
  target: number
): number => {
  const currentDeg = normalizeRotation(current);
  const targetDeg = normalizeRotation(target);

  const diff = targetDeg - currentDeg;
  const wrappedDiff = diff > 180 ? diff - 360 : diff < -180 ? diff + 360 : diff;

  return degreesToRadians(wrappedDiff);
};
