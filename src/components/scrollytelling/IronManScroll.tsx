import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import { useImageSequence } from '../../hooks/useImageSequence';
import { ArcReactorLoader } from '../ui/ArcReactorLoader';
import { SectionOverlay } from './SectionOverlay';
import { Navigation } from '../Navigation';

const TOTAL_FRAMES = 120;
const IMAGE_PATH = '/sequence-hd';

export const IronManScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  // Load image sequence
  const { images, loading, progress, error } = useImageSequence(IMAGE_PATH, TOTAL_FRAMES);

  // Scroll progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll to frame index (0-119)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateCanvasSize = () => {
      // Cap DPR at 2 for performance on mobile/high-DPI screens while maintaining quality
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      setCanvasSize({
        width: Math.floor(window.innerWidth * dpr),
        height: Math.floor(window.innerHeight * dpr),
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
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
        // Clear canvas with integer dimensions
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to cover entire canvas while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than canvas
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        // Draw with rounded coordinates to prevent sub-pixel blur
        ctx.drawImage(
          img, 
          Math.floor(offsetX), 
          Math.floor(offsetY), 
          Math.ceil(drawWidth), 
          Math.ceil(drawHeight)
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
          className="w-full h-full object-cover"
          style={{ imageRendering: 'auto' }}
        />

        {/* Scanline Effect */}
        <div className="scanline" />
      </div>

      {/* Section Overlays */}
      <SectionOverlay scrollProgress={scrollYProgress} />
      
      {/* Navigation Bar */}
      <Navigation scrollProgress={scrollYProgress} />
    </div>
  );
};
