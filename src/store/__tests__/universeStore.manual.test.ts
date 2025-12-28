/**
 * Manual Test Suite for Universe Store
 *
 * This file contains manual tests to verify the universe store functionality.
 * Run these tests by importing this file in a component and checking the console output.
 *
 * Usage:
 *   import './store/__tests__/universeStore.manual.test';
 */

import { useUniverseStore } from '../universeStore';
import type { SectionType } from '../../types/island';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
};

/**
 * Test Suite Runner
 */
export function runUniverseStoreTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Universe Store Manual Test Suite');
  console.log('='.repeat(60) + '\n');

  let passCount = 0;
  let failCount = 0;

  // Helper to run a test
  const test = (name: string, fn: () => boolean) => {
    log.test(name);
    try {
      const result = fn();
      if (result) {
        log.success('PASS');
        passCount++;
      } else {
        log.error('FAIL');
        failCount++;
      }
    } catch (error) {
      log.error(`FAIL - ${error}`);
      failCount++;
    }
    console.log('');
  };

  // Get store instance
  const store = useUniverseStore.getState();

  // Test 1: Initial State
  test('Initial state should be correct', () => {
    return (
      store.currentUniverse === 'hero' &&
      store.isFlying === false &&
      store.targetUniverse === null &&
      store.visitedUniverses.has('hero') &&
      store.visitedUniverses.size === 1 &&
      store.cameraOrbit.phi === 0 &&
      store.cameraOrbit.theta === 0 &&
      store.cameraOrbit.distance === 12 &&
      store.qualityTier === 'high' &&
      store.targetFPS === 60 &&
      store.currentFPS === 60
    );
  });

  // Test 2: Visit Tracking - First Visit
  test('isFirstVisit should return true for unvisited universes', () => {
    return (
      store.isFirstVisit('about') === true &&
      store.isFirstVisit('experience') === true &&
      store.isFirstVisit('projects') === true &&
      store.isFirstVisit('contact') === true &&
      store.isFirstVisit('hero') === false // hero is pre-visited
    );
  });

  // Test 3: Initiate Flight to New Universe
  test('initiateFlightTo should set up flight state correctly', () => {
    const beforeTime = Date.now();
    store.initiateFlightTo('about');
    const afterTime = Date.now();

    const state = useUniverseStore.getState();

    return (
      state.isFlying === true &&
      state.targetUniverse === 'about' &&
      state.flightStartTime >= beforeTime &&
      state.flightStartTime <= afterTime &&
      state.flightDuration >= 4000 && // First visit: 4-6s
      state.flightDuration <= 6000 &&
      state.cameraOrbit.distance === 15 // Camera pulls back during flight
    );
  });

  // Test 4: Complete Flight
  test('completeFlightTo should update universe and mark as visited', () => {
    store.completeFlightTo('about');
    const state = useUniverseStore.getState();

    return (
      state.currentUniverse === 'about' &&
      state.isFlying === false &&
      state.targetUniverse === null &&
      state.visitedUniverses.has('about') &&
      state.visitedUniverses.size === 2 && // hero + about
      state.cameraOrbit.distance === 12 // Camera returns to normal distance
    );
  });

  // Test 5: Repeat Visit Should Have Shorter Duration
  test('Repeat visit should have 3s duration', () => {
    store.initiateFlightTo('hero'); // Going back to hero (already visited)
    const state = useUniverseStore.getState();

    return (
      state.flightDuration === 3000 && // Repeat visit: exactly 3s
      state.isFlying === true &&
      state.targetUniverse === 'hero'
    );
  });

  // Complete the flight for next tests
  store.completeFlightTo('hero');

  // Test 6: Cannot Fly to Current Universe
  test('initiateFlightTo current universe should be ignored', () => {
    const beforeState = useUniverseStore.getState();
    store.initiateFlightTo('hero'); // Already at hero
    const afterState = useUniverseStore.getState();

    return (
      afterState.isFlying === beforeState.isFlying &&
      afterState.targetUniverse === beforeState.targetUniverse
    );
  });

  // Test 7: Camera Orbit Updates
  test('updateCameraOrbit should update phi, theta, distance', () => {
    store.updateCameraOrbit(45, 20, 15);
    const state = useUniverseStore.getState();

    return (
      state.cameraOrbit.phi === 45 &&
      state.cameraOrbit.theta === 20 &&
      state.cameraOrbit.distance === 15
    );
  });

  // Test 8: Phi Normalization
  test('updateCameraOrbit should normalize phi to 0-360 range', () => {
    store.updateCameraOrbit(370, 0); // 370° should normalize to 10°
    let state = useUniverseStore.getState();
    const test1 = state.cameraOrbit.phi === 10;

    store.updateCameraOrbit(-10, 0); // -10° should normalize to 350°
    state = useUniverseStore.getState();
    const test2 = state.cameraOrbit.phi === 350;

    return test1 && test2;
  });

  // Test 9: Theta Clamping
  test('updateCameraOrbit should clamp theta to -45° to 45°', () => {
    store.updateCameraOrbit(0, 60); // Should clamp to 45°
    let state = useUniverseStore.getState();
    const test1 = state.cameraOrbit.theta === 45;

    store.updateCameraOrbit(0, -60); // Should clamp to -45°
    state = useUniverseStore.getState();
    const test2 = state.cameraOrbit.theta === -45;

    return test1 && test2;
  });

  // Test 10: Optional Distance Parameter
  test('updateCameraOrbit should keep existing distance if not provided', () => {
    store.updateCameraOrbit(0, 0, 20); // Set distance to 20
    store.updateCameraOrbit(10, 5); // Update only phi and theta
    const state = useUniverseStore.getState();

    return state.cameraOrbit.distance === 20;
  });

  // Test 11: FPS Update
  test('updateFPS should update currentFPS', () => {
    store.updateFPS(45);
    const state = useUniverseStore.getState();

    return state.currentFPS === 45;
  });

  // Test 12: Quality Adjustment - Downgrade
  test('adjustQuality should downgrade quality when FPS drops', () => {
    // Reset to high quality
    useUniverseStore.setState({ qualityTier: 'high', targetFPS: 60 });

    // FPS drops below target - 10 (60 - 10 = 50)
    store.adjustQuality(45);
    let state = useUniverseStore.getState();
    const test1 = state.qualityTier === 'medium';

    // FPS drops even more
    store.adjustQuality(35);
    state = useUniverseStore.getState();
    const test2 = state.qualityTier === 'low';

    return test1 && test2;
  });

  // Test 13: Quality Adjustment - Upgrade
  test('adjustQuality should upgrade quality when FPS improves', () => {
    // Start at low quality
    useUniverseStore.setState({ qualityTier: 'low', targetFPS: 60 });

    // FPS improves above target + 5 (60 + 5 = 65)
    store.adjustQuality(70);
    let state = useUniverseStore.getState();
    const test1 = state.qualityTier === 'medium';

    // FPS improves more
    store.adjustQuality(70);
    state = useUniverseStore.getState();
    const test2 = state.qualityTier === 'high';

    return test1 && test2;
  });

  // Test 14: Reset Visited Universes
  test('resetVisitedUniverses should reset to hero only', () => {
    // First visit multiple universes
    store.completeFlightTo('about');
    store.completeFlightTo('experience');
    store.completeFlightTo('projects');

    // Reset
    store.resetVisitedUniverses();
    const state = useUniverseStore.getState();

    return (
      state.visitedUniverses.size === 1 &&
      state.visitedUniverses.has('hero') &&
      state.currentUniverse === 'hero'
    );
  });

  // Test 15: Multiple Universe Visits
  test('Should correctly track visits to all universes', () => {
    const universes: SectionType[] = ['hero', 'about', 'experience', 'projects', 'contact'];

    universes.forEach(universe => {
      store.completeFlightTo(universe);
    });

    const state = useUniverseStore.getState();

    return (
      state.visitedUniverses.size === 5 &&
      universes.every(u => state.visitedUniverses.has(u))
    );
  });

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log(`Test Results: ${colors.green}${passCount} passed${colors.reset}, ${colors.red}${failCount} failed${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  return { passCount, failCount, total: passCount + failCount };
}

/**
 * Run tests automatically when this file is imported
 * Comment this out if you want manual control
 */
if (typeof window !== 'undefined') {
  // Only run in browser environment
  console.log('Universe Store tests loaded. Call runUniverseStoreTests() to run.');
}

export default runUniverseStoreTests;
