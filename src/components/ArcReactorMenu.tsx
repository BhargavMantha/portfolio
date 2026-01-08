import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ArcReactorMenuProps {
  onNavigate: (index: number) => void;
  items: { label: string; range: number[] }[];
  activeSection: number;
}

export const ArcReactorMenu = ({ onNavigate, items, activeSection }: ArcReactorMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 space-y-2 min-w-[200px]"
          >
            {items.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onNavigate(index);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300
                  ${
                    activeSection === index
                      ? 'bg-arc-reactor/10 border-arc-reactor text-arc-reactor shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                      : 'bg-black/80 border-white/10 text-gray-400 hover:border-electric-blue/50 hover:text-electric-blue'
                  }
                `}
              >
                <span className="font-display tracking-widest uppercase text-sm">{item.label}</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeSection === index ? 'bg-arc-reactor shadow-[0_0_10px_#FFC107]' : 'bg-gray-600'
                  }`}
                />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reactor Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-full flex items-center justify-center group"
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer Glow Ring */}
        <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
          isOpen ? 'border-arc-reactor shadow-[0_0_30px_rgba(255,193,7,0.5)]' : 'border-electric-blue/30 group-hover:border-electric-blue'
        }`} />
        
        {/* Spinning Core */}
        <motion.div
          animate={{ rotate: isOpen ? 360 : 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-10 h-10"
        >
          {/* Reactor Inner Detail */}
          <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-colors duration-300 ${
            isOpen ? 'border-arc-reactor' : 'border-electric-blue/50'
          }`} />
          
          {/* Inner Light */}
          <div className={`absolute inset-2 rounded-full shadow-[0_0_20px_currentColor] transition-colors duration-300 ${
            isOpen ? 'bg-arc-reactor text-arc-reactor' : 'bg-electric-blue/50 text-electric-blue'
          }`} />
        </motion.div>
      </motion.button>
    </div>
  );
};
