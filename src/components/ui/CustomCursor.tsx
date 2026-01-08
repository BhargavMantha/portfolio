import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName === 'A' ||
        target.tagName === 'BUTTON'
      );
    };

    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] mix-blend-difference"
      animate={{
        x: position.x - (isPointer ? 40 : 10),
        y: position.y - (isPointer ? 40 : 10),
        scale: isPointer ? 1.5 : 1,
      }}
      transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
    >
      <div 
        className={`rounded-full border border-electric-blue flex items-center justify-center transition-all duration-300 ${
          isPointer ? 'w-20 h-20 border-2 bg-electric-blue/10' : 'w-5 h-5 border-2'
        }`}
      >
        <div className={`bg-arc-reactor rounded-full transition-all duration-300 ${
           isPointer ? 'w-2 h-2' : 'w-1 h-1'
        }`} />
      </div>
      
      {/* Trailing Crosshairs for "Stark" Tech feel */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className={`w-full h-[1px] bg-electric-blue transition-all ${isPointer ? 'scale-x-100' : 'scale-x-0'}`} />
        <div className={`absolute h-full w-[1px] bg-electric-blue transition-all ${isPointer ? 'scale-y-100' : 'scale-y-0'}`} />
      </div>
    </motion.div>
  );
};
