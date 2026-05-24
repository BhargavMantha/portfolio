import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor — uses passive listeners + rAF + direct DOM transform so we
 * never re-render React on mousemove. Also bails out on touch devices, where
 * the cursor is invisible noise and the listener wastes cycles.
 */
export const CustomCursor = () => {
  const ringRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Coarse pointer (touch) → don't render the cursor at all
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // Respect reduced-motion preference — keep the cursor but skip the lerp
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let pointerNow = false;
    let raf = 0;

    const tick = () => {
      // Lerp toward target — high factor on reduced-motion (effectively snap)
      const k = reduce ? 1 : 0.28;
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      const offset = pointerNow ? 40 : 10;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${current.x - offset}px, ${current.y - offset}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const next =
        window.getComputedStyle(t).cursor === 'pointer' ||
        t.tagName === 'A' ||
        t.tagName === 'BUTTON';
      if (next !== pointerNow) {
        pointerNow = next;
        // Only this state change triggers a React re-render (rare)
        setIsPointer(next);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference will-change-transform"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <div
        className={`rounded-full border border-electric-blue flex items-center justify-center transition-all duration-300 ${
          isPointer ? 'w-20 h-20 border-2 bg-electric-blue/10' : 'w-5 h-5 border-2'
        }`}
      >
        <div
          className={`bg-arc-reactor rounded-full transition-all duration-300 ${
            isPointer ? 'w-2 h-2' : 'w-1 h-1'
          }`}
        />
      </div>

      {/* Trailing crosshairs — only visible over interactive elements */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className={`w-full h-[1px] bg-electric-blue transition-all ${isPointer ? 'scale-x-100' : 'scale-x-0'}`} />
        <div className={`absolute h-full w-[1px] bg-electric-blue transition-all ${isPointer ? 'scale-y-100' : 'scale-y-0'}`} />
      </div>
    </div>
  );
};
