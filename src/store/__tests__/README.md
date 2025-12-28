# Universe Store Tests

## Overview

This directory contains manual tests for the Universe Store functionality. Since the project doesn't have a test framework configured yet, these are manual verification tests.

## Running Tests

### Method 1: Console Tests

1. Import the test runner in any component:
```typescript
import { runUniverseStoreTests } from './store/__tests__/universeStore.manual.test';

// Call it in useEffect or manually
runUniverseStoreTests();
```

2. Check the browser console for detailed test results

### Method 2: UI Test Runner

1. Import the TestRunner component:
```typescript
import TestRunner from './store/__tests__/TestRunner';
```

2. Render it in your app (temporarily):
```typescript
function App() {
  return (
    <>
      <TestRunner />
      {/* Your other components */}
    </>
  );
}
```

3. Tests will auto-run on mount and display results in a fixed overlay
4. Check console for detailed output

## Test Coverage

The test suite covers:

1. ✓ Initial state validation
2. ✓ Visit tracking (first visit detection)
3. ✓ Flight initiation (first visit - 4-6s duration)
4. ✓ Flight completion
5. ✓ Repeat visit (3s duration)
6. ✓ Preventing flight to current universe
7. ✓ Camera orbit updates
8. ✓ Phi normalization (0-360°)
9. ✓ Theta clamping (-45° to 45°)
10. ✓ Optional distance parameter
11. ✓ FPS tracking
12. ✓ Quality downgrade on low FPS
13. ✓ Quality upgrade on high FPS
14. ✓ Reset visited universes
15. ✓ Multiple universe visits tracking

## Expected Results

All 15 tests should pass with the current implementation.

## Future Improvements

- Add proper testing framework (Vitest or Jest)
- Add integration tests with React components
- Add performance benchmarks
- Add edge case testing
