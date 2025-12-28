import { useFrame } from '@react-three/fiber';
import { useUniverseStore } from '../../../store/universeStore';

/**
 * FlightController Component
 *
 * Manages the flight animation sequence timing and state transitions.
 * This is a logic-only component with no visual representation.
 *
 * Flight Sequence (3-part):
 * 1. Phase 1 (0-30%): Fade out current universe
 * 2. Phase 2 (30-70%): Warp tunnel travel
 * 3. Phase 3 (70-100%): Fade in new universe
 *
 * Smart Timing:
 * - First visit: 4-6 seconds (varied for cinematics)
 * - Repeat visit: 3 seconds (quick transition)
 *
 * The timing logic is handled by useUniverseStore.initiateFlightTo()
 */
export const FlightController = () => {
  const {
    isFlying,
    flightStartTime,
    flightDuration,
    targetUniverse,
    completeFlightTo,
  } = useUniverseStore();

  useFrame(() => {
    // Only run when actively flying
    if (!isFlying || !targetUniverse) return;

    // Calculate flight progress (0 to 1)
    const elapsed = Date.now() - flightStartTime;
    const progress = Math.min(elapsed / flightDuration, 1);

    // Flight complete - trigger arrival
    if (progress >= 1) {
      completeFlightTo(targetUniverse);
    }

    // Future enhancement: Expose progress for other components
    // This could be used for:
    // - Universe fade in/out based on progress
    // - Camera effects during different phases
    // - Post-processing intensity ramping
    //
    // Phase breakdown:
    // - 0-30%: Fade out current universe
    // - 30-70%: Warp tunnel at full intensity
    // - 70-100%: Fade in new universe
  });

  // No visual component - purely logic
  return null;
};
