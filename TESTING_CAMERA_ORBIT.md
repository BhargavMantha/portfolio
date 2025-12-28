# Camera Orbit Hook Testing Guide

## Automated Tests

Run tests in browser console after starting dev server:

```javascript
// In browser console
import * as tests from './src/hooks/__tests__/useCameraOrbit.test';
tests.runAllTests();
```

## Manual Testing Checklist

### Desktop Tests (Window Width >= 768px)

1. **Drag to Orbit - Horizontal**
   - [ ] Click and drag mouse left/right on canvas
   - [ ] Camera should orbit horizontally around Iron Man
   - [ ] Movement should feel smooth and responsive
   - [ ] Release mouse - camera position should hold

2. **Drag to Orbit - Vertical**
   - [ ] Click and drag mouse up/down on canvas
   - [ ] Camera should tilt up/down (constrained to ±45°)
   - [ ] Vertical movement should be slower than horizontal
   - [ ] Cannot tilt beyond 45° up or 45° down

3. **Drag to Orbit - Combined**
   - [ ] Drag diagonally (both horizontal and vertical)
   - [ ] Both phi and theta should update smoothly
   - [ ] Camera always looks at Iron Man (center)

4. **Store State Verification**
   ```javascript
   // In browser console
   const store = useUniverseStore.getState();
   console.log(store.cameraOrbit);
   // Should show: { phi: number, theta: number, distance: 12 }
   ```

### Mobile Tests (Window Width < 768px)

5. **Auto-Rotate**
   - [ ] Resize browser to mobile size (<768px)
   - [ ] Camera should automatically rotate horizontally at ~10°/second
   - [ ] Rotation should be smooth and continuous
   - [ ] Mouse drag should NOT work on mobile

6. **Auto-Rotate Speed**
   ```javascript
   // Measure rotation speed in console
   const store = useUniverseStore.getState();
   const initialPhi = store.cameraOrbit.phi;
   setTimeout(() => {
     const finalPhi = store.cameraOrbit.phi;
     const degreesPer5Seconds = finalPhi - initialPhi;
     console.log(`Rotation speed: ${degreesPer5Seconds / 5}°/second`);
     // Should be approximately 10°/second
   }, 5000);
   ```

### Flight State Tests

7. **No Orbit During Flight**
   - [ ] Trigger flight to another universe:
     ```javascript
     useUniverseStore.getState().initiateFlightTo('about');
     ```
   - [ ] Try to drag mouse - should NOT update camera
   - [ ] Wait for flight to complete
   - [ ] Drag should work again after flight

8. **Camera Distance During Flight**
   ```javascript
   const store = useUniverseStore.getState();
   console.log('Before flight:', store.cameraOrbit.distance); // 12

   store.initiateFlightTo('projects');
   console.log('During flight:', store.cameraOrbit.distance); // 15

   // Wait for completion
   setTimeout(() => {
     store.completeFlightTo('projects');
     console.log('After flight:', store.cameraOrbit.distance); // 12
   }, 1000);
   ```

### Edge Cases

9. **Phi Normalization (360° wrapping)**
   ```javascript
   const store = useUniverseStore.getState();
   store.updateCameraOrbit(370, 0);
   console.log(store.cameraOrbit.phi); // Should be 10 (normalized)

   store.updateCameraOrbit(-10, 0);
   console.log(store.cameraOrbit.phi); // Should be 350 (normalized)
   ```

10. **Theta Clamping (±45° limits)**
    ```javascript
    const store = useUniverseStore.getState();
    store.updateCameraOrbit(0, 60);
    console.log(store.cameraOrbit.theta); // Should be 45 (clamped)

    store.updateCameraOrbit(0, -60);
    console.log(store.cameraOrbit.theta); // Should be -45 (clamped)
    ```

### Performance Tests

11. **Smooth Frame Rate**
    - [ ] Open Chrome DevTools > Performance Monitor
    - [ ] Drag camera orbit continuously for 10 seconds
    - [ ] Frame rate should stay above 50fps
    - [ ] No stuttering or jank during rotation

12. **Memory Stability**
    - [ ] Drag camera for 1 minute continuously
    - [ ] Check DevTools Memory tab
    - [ ] No memory leaks or increasing memory usage
    - [ ] Event listeners properly cleaned up

## Success Criteria

- ✅ All manual tests pass
- ✅ Desktop drag-to-orbit works smoothly
- ✅ Mobile auto-rotate at 10°/second
- ✅ No orbit during flight transitions
- ✅ Camera distance changes during flight (12 → 15 → 12)
- ✅ Phi normalizes to 0-360° range
- ✅ Theta clamps to ±45° range
- ✅ Frame rate stays above 50fps
- ✅ No memory leaks

## Known Issues / Expected Behavior

1. **Vertical drag sensitivity**: Intentionally slower (0.3x) than horizontal (0.5x) for better control
2. **Camera lerp**: Uses 0.1 factor for smooth but responsive movement
3. **Mobile drag disabled**: Prevents conflict with scroll and auto-rotate
4. **Flight override**: Camera orbit locked during flight for cinematic effect

## Next Steps After Testing

If all tests pass:
1. Commit changes with detailed message
2. Move to Task 3: Universe Environment Components
3. Document any issues found in GitHub issues
