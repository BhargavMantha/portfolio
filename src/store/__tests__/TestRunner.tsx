/**
 * Universe Store Test Runner Component
 *
 * This component provides a UI to run manual tests for the universe store.
 * Import and render this component to test the store functionality.
 *
 * Usage:
 *   import TestRunner from './store/__tests__/TestRunner';
 *   // In your App or a test route:
 *   <TestRunner />
 */

import { useEffect, useState } from 'react';
import { runUniverseStoreTests } from './universeStore.manual.test';

export default function TestRunner() {
  const [results, setResults] = useState<{
    passCount: number;
    failCount: number;
    total: number;
  } | null>(null);

  const handleRunTests = () => {
    console.clear();
    const testResults = runUniverseStoreTests();
    setResults(testResults);
  };

  useEffect(() => {
    // Auto-run tests on mount
    handleRunTests();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '14px',
      minWidth: '300px',
      zIndex: 10000,
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
        Universe Store Tests
      </h3>

      {results && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ color: '#4CAF50', marginBottom: '5px' }}>
            ✓ Passed: {results.passCount}
          </div>
          <div style={{ color: results.failCount > 0 ? '#f44336' : '#4CAF50', marginBottom: '5px' }}>
            {results.failCount > 0 ? '✗' : '✓'} Failed: {results.failCount}
          </div>
          <div style={{ color: '#2196F3' }}>
            Total: {results.total}
          </div>
        </div>
      )}

      <button
        onClick={handleRunTests}
        style={{
          background: '#4CAF50',
          border: 'none',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'monospace',
          width: '100%',
        }}
      >
        Run Tests
      </button>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
        Check browser console for detailed output
      </div>
    </div>
  );
}
