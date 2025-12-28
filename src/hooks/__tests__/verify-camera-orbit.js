/**
 * Camera Orbit Verification Script
 *
 * Run this in browser console after opening http://localhost:5173
 *
 * Usage:
 *   1. Open browser console (F12)
 *   2. Copy and paste this entire script
 *   3. Run: verifyCameraOrbit()
 */

(function() {
  window.verifyCameraOrbit = async function() {
    console.clear();
    console.log('%c=== Camera Orbit Verification ===', 'color: cyan; font-size: 16px; font-weight: bold');

    // Access the store
    const store = window.useUniverseStore?.getState();

    if (!store) {
      console.error('❌ useUniverseStore not found. Make sure the app is running.');
      return;
    }

    console.log('✅ Store found');

    const tests = [];

    // Test 1: Initial State
    console.log('\n📋 Test 1: Initial Camera Orbit State');
    const initialOrbit = store.cameraOrbit;
    console.log('  Current orbit:', initialOrbit);

    const test1Pass =
      typeof initialOrbit.phi === 'number' &&
      typeof initialOrbit.theta === 'number' &&
      initialOrbit.distance === 12;

    console.log(test1Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Initial State', passed: test1Pass });

    // Test 2: Camera Orbit Update
    console.log('\n📋 Test 2: Camera Orbit Update');
    const beforePhi = store.cameraOrbit.phi;
    store.updateCameraOrbit(45, 20);
    const afterUpdate = store.cameraOrbit;
    console.log('  After updateCameraOrbit(45, 20):', afterUpdate);

    const test2Pass = afterUpdate.phi === 45 && afterUpdate.theta === 20;
    console.log(test2Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Camera Orbit Update', passed: test2Pass });

    // Test 3: Phi Normalization
    console.log('\n📋 Test 3: Phi Normalization (370° → 10°)');
    store.updateCameraOrbit(370, 0);
    const normalizedPhi = store.cameraOrbit.phi;
    console.log('  After updateCameraOrbit(370, 0):', normalizedPhi);

    const test3Pass = normalizedPhi === 10;
    console.log(test3Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Phi Normalization', passed: test3Pass });

    // Test 4: Theta Clamping (Max)
    console.log('\n📋 Test 4: Theta Clamping (50° → 45°)');
    store.updateCameraOrbit(0, 50);
    const clampedThetaMax = store.cameraOrbit.theta;
    console.log('  After updateCameraOrbit(0, 50):', clampedThetaMax);

    const test4Pass = clampedThetaMax === 45;
    console.log(test4Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Theta Clamping Max', passed: test4Pass });

    // Test 5: Theta Clamping (Min)
    console.log('\n📋 Test 5: Theta Clamping (-50° → -45°)');
    store.updateCameraOrbit(0, -50);
    const clampedThetaMin = store.cameraOrbit.theta;
    console.log('  After updateCameraOrbit(0, -50):', clampedThetaMin);

    const test5Pass = clampedThetaMin === -45;
    console.log(test5Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Theta Clamping Min', passed: test5Pass });

    // Reset to neutral
    store.updateCameraOrbit(0, 0);

    // Test 6: Flight Camera Distance
    console.log('\n📋 Test 6: Flight Camera Distance Changes');
    console.log('  Before flight:', store.cameraOrbit.distance);

    store.initiateFlightTo('about');
    console.log('  During flight:', store.cameraOrbit.distance);
    const duringFlight = store.cameraOrbit.distance === 15;

    await new Promise(resolve => setTimeout(resolve, 500));

    store.completeFlightTo('about');
    console.log('  After flight:', store.cameraOrbit.distance);
    const afterFlight = store.cameraOrbit.distance === 12;

    const test6Pass = duringFlight && afterFlight;
    console.log(test6Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Flight Camera Distance', passed: test6Pass });

    // Test 7: isFlying State
    console.log('\n📋 Test 7: Flight State Management');
    console.log('  Current isFlying:', store.isFlying);

    store.initiateFlightTo('experience');
    console.log('  After initiateFlightTo:', store.isFlying);
    const flyingTrue = store.isFlying === true;

    store.completeFlightTo('experience');
    console.log('  After completeFlightTo:', store.isFlying);
    const flyingFalse = store.isFlying === false;

    const test7Pass = flyingTrue && flyingFalse;
    console.log(test7Pass ? '  ✅ PASS' : '  ❌ FAIL');
    tests.push({ name: 'Flight State Management', passed: test7Pass });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('%c📊 Test Summary', 'color: cyan; font-size: 14px; font-weight: bold');
    console.log('='.repeat(50));

    const passedCount = tests.filter(t => t.passed).length;
    const totalCount = tests.length;

    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    });

    console.log('\n' + '='.repeat(50));
    if (passedCount === totalCount) {
      console.log(`%c✅ ALL TESTS PASSED (${passedCount}/${totalCount})`, 'color: green; font-size: 16px; font-weight: bold');
    } else {
      console.log(`%c❌ SOME TESTS FAILED (${passedCount}/${totalCount})`, 'color: red; font-size: 16px; font-weight: bold');
    }
    console.log('='.repeat(50));

    // Manual test instructions
    console.log('\n%c📋 Manual Tests Required:', 'color: yellow; font-size: 14px; font-weight: bold');
    console.log('\n1. Desktop Drag Test (window >= 768px):');
    console.log('   - Click and drag mouse on canvas');
    console.log('   - Camera should orbit around Iron Man');
    console.log('   - Horizontal drag changes phi (left/right)');
    console.log('   - Vertical drag changes theta (up/down, clamped ±45°)');

    console.log('\n2. Mobile Auto-Rotate Test (window < 768px):');
    console.log('   - Resize window to mobile size (<768px)');
    console.log('   - Camera should auto-rotate at ~10°/second');
    console.log('   - Run this to measure:');
    console.log('     measureAutoRotateSpeed();');

    console.log('\n3. Flight Override Test:');
    console.log('   - Run: useUniverseStore.getState().initiateFlightTo("projects")');
    console.log('   - Try dragging - should NOT work during flight');
    console.log('   - Wait for completion - dragging should work again');

    return {
      passed: passedCount,
      total: totalCount,
      success: passedCount === totalCount
    };
  };

  // Helper function to measure auto-rotate speed
  window.measureAutoRotateSpeed = function() {
    console.log('\n%c⏱️  Measuring Auto-Rotate Speed...', 'color: cyan; font-size: 14px');
    console.log('Make sure window is < 768px wide for mobile mode');

    const store = window.useUniverseStore?.getState();
    if (!store) {
      console.error('❌ Store not found');
      return;
    }

    const initialPhi = store.cameraOrbit.phi;
    console.log(`Initial phi: ${initialPhi}°`);
    console.log('Measuring for 5 seconds...');

    setTimeout(() => {
      const finalPhi = store.cameraOrbit.phi;
      const deltaPhi = finalPhi - initialPhi;
      const speed = deltaPhi / 5;

      console.log(`Final phi: ${finalPhi}°`);
      console.log(`Delta: ${deltaPhi}° over 5 seconds`);
      console.log(`\n%cSpeed: ${speed.toFixed(2)}°/second`, 'color: yellow; font-size: 16px');
      console.log(`Expected: ~10°/second`);

      if (Math.abs(speed - 10) < 1) {
        console.log('%c✅ Auto-rotate speed is correct!', 'color: green; font-weight: bold');
      } else {
        console.log('%c⚠️  Auto-rotate speed is off', 'color: orange; font-weight: bold');
      }
    }, 5000);
  };

  console.log('%c✅ Camera Orbit Verification Script Loaded', 'color: green; font-size: 14px');
  console.log('\nRun: verifyCameraOrbit()');
  console.log('Or:  measureAutoRotateSpeed() (for mobile test)');
})();
