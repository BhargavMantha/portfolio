/* BootSplash.tsx — the glassy HUD boot-up sequence. A frosted panel with a
   spinning arc-reactor, a determinate progress bar that fills as the scene
   warms up (fonts + first WebGL frame), cycling diagnostic text, and scanlines.
   When the engine signals `ready`, the bar snaps to 100% and the whole panel
   reveals with a glass-fade. Tokens + colors match the Stark-HUD system. */
import { useEffect, useRef, useState } from 'react';

const BOOT_LINES = [
  'INITIALIZING FLIGHT SYSTEMS',
  'CALIBRATING REPULSOR THRUSTERS',
  'SPINNING UP ARC REACTOR',
  'LOADING FLIGHT CHOREOGRAPHY',
  'HUD ONLINE — STANDING BY',
];

interface BootSplashProps {
  /** True once fonts are loaded and the first frame has painted. */
  ready: boolean;
  /** Called after the reveal animation completes so the parent can unmount. */
  onDone: () => void;
}

export function BootSplash({ ready, onDone }: BootSplashProps) {
  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  // Determinate progress: ease toward 92% while loading, then race to 100 on ready.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setProgress((prev) => {
        const ceiling = readyRef.current ? 100 : 92;
        const step = (ceiling - prev) * (readyRef.current ? 0.25 : 0.04) + 0.15;
        return Math.min(prev + step, ceiling);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cycle the diagnostic boot lines.
  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, BOOT_LINES.length - 1));
    }, 520);
    return () => window.clearInterval(id);
  }, []);

  // Once ready AND the bar has visually reached 100, play the reveal then unmount.
  useEffect(() => {
    if (!ready || progress < 99.5) return;
    setLineIdx(BOOT_LINES.length - 1);
    setRevealing(true);
    const t = window.setTimeout(onDone, 780); // matches CSS reveal duration
    return () => window.clearTimeout(t);
  }, [ready, progress, onDone]);

  return (
    <div className={'boot' + (revealing ? ' boot--reveal' : '')} role="status" aria-live="polite" aria-label="Loading flight experience">
      <div className="boot__grid" />
      <div className="boot__panel">
        <div className="boot__reactor">
          <i className="boot__ring boot__ring--1" />
          <i className="boot__ring boot__ring--2" />
          <i className="boot__ring boot__ring--3" />
          <i className="boot__core" />
        </div>

        <div className="boot__title">MARK&#8209;BM · FLIGHT SYSTEM</div>

        <div className="boot__log">
          <span className="boot__caret">▸</span> {BOOT_LINES[lineIdx]}
          <span className="boot__blink">_</span>
        </div>

        <div className="boot__bar">
          <div className="boot__bar-track">
            <div className="boot__bar-fill" style={{ width: progress + '%' }} />
          </div>
          <div className="boot__pct">{Math.round(progress).toString().padStart(3, '0')}%</div>
        </div>

        <div className="scan-line" />
      </div>
    </div>
  );
}
