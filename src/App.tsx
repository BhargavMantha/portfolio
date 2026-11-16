import { useCallback, useState } from 'react';
import { SpaceExperience } from './space/SpaceExperience';
import { Classic } from './space/Classic';
import './space/space.css';

type View = 'game' | 'classic';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const canPlay = hasWebGL();

/** Phones, reduced-motion users and browsers without WebGL start on the plain page. */
function initialView(): View {
  const q = new URLSearchParams(window.location.search).get('view');
  if (q === 'classic') return 'classic';
  if (q === 'game' && canPlay) return 'game';
  if (!canPlay) return 'classic';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'classic';
  const smallTouch = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 820;
  return smallTouch ? 'classic' : 'game';
}

function App() {
  const [view, setView] = useState<View>(initialView);

  const go = useCallback((next: View) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.replaceState(null, '', url);
    window.scrollTo(0, 0);
    setView(next);
  }, []);

  return view === 'game' ? <SpaceExperience onSkip={() => go('classic')} /> : <Classic canPlay={canPlay} onPlay={() => go('game')} />;
}

export default App;
