import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import { useImageSequence } from '../../hooks/useImageSequence';
import { ArcReactorLoader } from '../ui/ArcReactorLoader';
import { SectionOverlay } from './SectionOverlay';
import { Navigation } from '../Navigation';

const TOTAL_FRAMES = 120;
const IMAGE_PATH = '/sequence-hd';
/** Reveal the page once the first ~12 frames are decoded — the rest stream in
 *  while the user is reading the hero. Keeps first paint snappy. */
const PRIME_FRAMES = 12;

export const IronManScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  // Force scroll to top on mount
  // Force scroll to top on mount
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Add small delay to ensure browser doesn't override with restored position
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Load image sequence (WebP, chunked, with prime-then-stream)
  const { images, loading, progress, error } = useImageSequence(IMAGE_PATH, TOTAL_FRAMES, 1, {
    extension: 'webp',
    concurrency: 8,
    primeCount: PRIME_FRAMES,
  });

  // Scroll progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll to frame index
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Update canvas size on mount and resize. Cap DPR at 2 — on 3× displays
  // the extra detail isn't visible and tripling canvas memory tanks scroll FPS.
  useEffect(() => {
    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      setCanvasSize({
        width: Math.floor(window.innerWidth * dpr),
        height: Math.floor(window.innerHeight * dpr),
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize, { passive: true });
    window.addEventListener('orientationchange', updateCanvasSize, { passive: true });
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, []);

  // Render current frame to canvas
  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      willReadFrequently: false,
    });
    if (!ctx) return;

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const unsubscribe = frameIndex.on('change', (latest) => {
      const index = Math.round(latest);
      const img = images[index];

      if (img && img.complete) {
        // Always cover-fit: image fills the viewport so the parts-assembling
        // effect reads at full impact, even on portrait phones/tablets.
        // Sharpness is addressed at the source level (HD WebP) — letterboxing
        // would shrink the image and kill the visual.
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
          // Image is wider than canvas — fit height, crop sides
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than canvas — fit width, crop top/bottom
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(
          img,
          Math.round(offsetX),
          Math.round(offsetY),
          Math.round(drawWidth),
          Math.round(drawHeight)
        );
      }
    });

    return () => unsubscribe();
  }, [images, frameIndex]);

  if (loading) {
    return <ArcReactorLoader progress={progress} />;
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-primary text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Sequence</h2>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
      {/* Sticky Canvas Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full block"
          style={{
            width: '100%',
            height: '100%',
            // Hint the browser to use a sharper downscale filter when the canvas
            // is bigger than its CSS box. Falls back gracefully on browsers
            // that don't recognise either value.
            imageRendering: 'auto',
          }}
        />
        
        {/* Overlays removed as per user request to reduce distortion */}
      </div>

      {/* Section Overlays */}
      <SectionOverlay scrollProgress={scrollYProgress} />
      
      {/* Navigation Bar */}
      <Navigation scrollProgress={scrollYProgress} />
    </div>
  );
};
