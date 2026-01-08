import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { SectionOverlay } from './SectionOverlay';
import { Navigation } from '../Navigation';

export const HeroParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Parallax effects
  // The background image will move slightly slower than the scroll to create depth
  const bgY = useTransform(springScroll, [0, 1], ['0%', '20%']);
  const bgScale = useTransform(springScroll, [0, 1], [1, 1.1]);
  
  // Opacity for the hero image - fade out as we scroll deep
  const heroOpacity = useTransform(springScroll, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="relative bg-primary" style={{ height: '400vh' }}>
      
      {/* Sticky Container for the Background Element */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        
        {/* 
            High-Res Hero Image Layer 
            TODO: Replace the gradient background with the 4K Iron Man Asset:
            backgroundImage: 'url(/path/to/your-4k-asset.jpg)'
        */}
        <motion.div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ 
            y: bgY,
            scale: bgScale,
            opacity: heroOpacity,
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%)', // Fallback Void Gradient
          }}
        >
          {/* Optional: Add a subtle animated grain or grid overlay here for texture */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          
          {/* Placeholder for where the 4K Iron Man would sit */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-[800px] h-[800px] rounded-full bg-electric-blue/5 blur-[120px] animate-pulse" />
          </div>
        </motion.div>

        {/* Global Vigilante/Scanner Overlay - stays visible throughout but subtle */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary to-transparent opacity-80" />
           <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary to-transparent opacity-80" />
        </div>

      </div>

      {/* Content Overlay - Passed through exactly as before to maintain content */}
      <SectionOverlay scrollProgress={scrollYProgress} />
      
      {/* Navigation */}
      <Navigation scrollProgress={scrollYProgress} />
    </div>
  );
};
