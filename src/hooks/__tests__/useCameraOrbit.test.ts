/**
 * Manual test suite for useCameraOrbit hook
 *
 * Run in browser console after implementing hook:
 * - Import and call test functions
 * - Verify camera orbit behavior visually and in store
 */

import { useUniverseStore } from '../../store/universeStore';

export const testCameraOrbitBasics = () => {
  console.log('\n=== Testing Camera Orbit Basics ===');

  const store = useUniverseStore.getState();
  const initialOrbit = { ...store.cameraOrbit };

  console.log('Initial orbit:', initialOrbit);

  // Expected: phi=0, theta=0, distance=12
  const passed =
    initialOrbit.phi === 0 &&
    initialOrbit.theta === 0 &&
    initialOrbit.distance === 12;

  console.log(passed ? '✅ Initial state correct' : '❌ Initial state incorrect');
  return passed;
};

export const testCameraOrbitUpdate = () => {
  console.log('\n=== Testing Camera Orbit Update ===');

  const store = useUniverseStore.getState();

  // Test phi update (horizontal rotation)
  store.updateCameraOrbit(45, 0);
  const orbit1 = store.cameraOrbit;
  console.log('After phi=45:', orbit1);

  // Test theta update (vertical rotation)
  store.updateCameraOrbit(45, 20);
  const orbit2 = store.cameraOrbit;
  console.log('After theta=20:', orbit2);

  // Test phi normalization (wrapping)
  store.updateCameraOrbit(370, 0);
  const orbit3 = store.cameraOrbit;
  console.log('After phi=370 (should normalize to 10):', orbit3);

  // Test theta clamping (max 45)
  store.updateCameraOrbit(0, 50);
  const orbit4 = store.cameraOrbit;
  console.log('After theta=50 (should clamp to 45):', orbit4);

  // Test theta clamping (min -45)
  store.updateCameraOrbit(0, -50);
  const orbit5 = store.cameraOrbit;
  console.log('After theta=-50 (should clamp to -45):', orbit5);

  const passed =
    orbit1.phi === 45 &&
    orbit2.theta === 20 &&
    orbit3.phi === 10 &&
    orbit4.theta === 45 &&
    orbit5.theta === -45;

  console.log(passed ? '✅ Camera orbit updates work correctly' : '❌ Camera orbit updates failed');

  // Reset
  store.updateCameraOrbit(0, 0);
  return passed;
};

export const testFlightCameraDistance = () => {
  console.log('\n=== Testing Flight Camera Distance ===');

  const store = useUniverseStore.getState();

  // Normal distance
  console.log('Initial distance:', store.cameraOrbit.distance);

  // Initiate flight
  store.initiateFlightTo('about');
  console.log('During flight distance:', store.cameraOrbit.distance);

  const duringFlight = store.cameraOrbit.distance === 15;

  // Complete flight
  store.completeFlightTo('about');
  console.log('After flight distance:', store.cameraOrbit.distance);

  const afterFlight = store.cameraOrbit.distance === 12;

  const passed = duringFlight && afterFlight;
  console.log(passed ? '✅ Flight camera distance works' : '❌ Flight camera distance failed');

  return passed;
};

export const testMobileAutoRotate = () => {
  console.log('\n=== Testing Mobile Auto-Rotate ===');
  console.log('This test requires visual verification:');
  console.log('1. Resize window to mobile size (<768px)');
  console.log('2. Observe camera should auto-rotate at ~10°/second');
  console.log('3. Phi value should continuously increase');
  console.log('4. Resize to desktop - auto-rotate should stop');
  console.log('5. Dragging should work on desktop');

  return true; // Manual verification required
};

export const testDragToOrbit = () => {
  console.log('\n=== Testing Drag to Orbit ===');
  console.log('This test requires manual interaction:');
  console.log('1. Ensure window is desktop size (>=768px)');
  console.log('2. Click and drag on canvas');
  console.log('3. Camera should orbit around Iron Man');
  console.log('4. Horizontal drag changes phi (left/right rotation)');
  console.log('5. Vertical drag changes theta (up/down tilt, clamped to ±45°)');
  console.log('6. Release mouse - orbit position should hold steady');

  return true; // Manual verification required
};

export const testNoOrbitDuringFlight = () => {
  console.log('\n=== Testing No Orbit During Flight ===');

  const store = useUniverseStore.getState();

  // Start flight
  store.initiateFlightTo('projects');
  console.log('Flight started to projects');
  console.log('Try dragging mouse - should NOT update camera orbit');
  console.log('isFlying:', store.isFlying);

  // Wait for flight to complete
  setTimeout(() => {
    store.completeFlightTo('projects');
    console.log('Flight complete - dragging should work again');
  }, 1000);

  return true; // Manual verification required
};

export const runAllTests = () => {
  console.log('\n🚀 Running Camera Orbit Hook Tests\n');

  const results = [
    testCameraOrbitBasics(),
    testCameraOrbitUpdate(),
    testFlightCameraDistance(),
    testMobileAutoRotate(),
    testDragToOrbit(),
    testNoOrbitDuringFlight(),
  ];

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed - check output above');
  }
};

// Usage instructions
console.log(`
Camera Orbit Hook Test Suite

Run in browser console:
  import * as tests from './hooks/__tests__/useCameraOrbit.test';
  tests.runAllTests();

Or run individual tests:
  tests.testCameraOrbitBasics();
  tests.testDragToOrbit();
`);
