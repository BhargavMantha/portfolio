import { motion, useTransform, MotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArcReactorMenu } from './ArcReactorMenu';

interface NavigationProps {
  scrollProgress: MotionValue<number>;
}

const NAV_ITEMS = [
  { label: 'Hero', range: [0, 0.2] },
  { label: 'About', range: [0.2, 0.4] },
  { label: 'Experience', range: [0.4, 0.6] },
  { label: 'Projects', range: [0.6, 0.8] },
  { label: 'Contact', range: [0.8, 1] },
];

export const Navigation = ({ scrollProgress }: NavigationProps) => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Hide nav on Hero section (0-10%), show after
  const opacity = useTransform(scrollProgress, [0, 0.1, 0.15], [0, 0, 1]);
  const y = useTransform(scrollProgress, [0, 0.1, 0.15], [-20, -20, 0]);

  // Track visibility and active section based on scroll
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (value) => {
      // Update visibility
      setIsVisible(value > 0.1);
      
      // Update active section
      const index = NAV_ITEMS.findIndex(
        (item) => value >= item.range[0] && value <= item.range[1]
      );
      if (index !== -1 && index !== activeSection) {
        setActiveSection(index);
      }
    });

    return () => unsubscribe();
  }, [scrollProgress, activeSection]);

  const scrollToSection = (index: number) => {
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = scrollRange * NAV_ITEMS[index].range[0];
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <motion.nav
      style={{ opacity, y }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center md:top-8 pointer-events-none"
      // Start completely hidden
      animate={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="pointer-events-auto md:hidden">
        <ArcReactorMenu 
          onNavigate={scrollToSection} 
          items={NAV_ITEMS} 
          activeSection={activeSection} 
        />
      </div>

      <div className="hidden md:block bg-secondary/80 backdrop-blur-md border border-electric-blue/30 rounded-full px-3 py-2 md:px-6 md:py-3 shadow-[0_0_30px_rgba(0,212,255,0.2)] pointer-events-auto">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(index)}
              className={`
                relative px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300
                ${
                  activeSection === index
                    ? 'text-arc-reactor'
                    : 'text-text-secondary hover:text-electric-blue'
                }
              `}
            >
              {/* Active indicator */}
              {activeSection === index && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute inset-0 bg-arc-reactor/20 rounded-full border border-arc-reactor/50"
                  style={{
                    boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              {/* Label */}
              <span className="relative z-10 hud-text">{item.label}</span>
              
              {/* Dot indicator */}
              <motion.div
                className={`
                  absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full
                  ${activeSection === index ? 'bg-arc-reactor' : 'bg-electric-blue/30'}
                `}
                animate={{
                  scale: activeSection === index ? [1, 1.3, 1] : 1,
                  opacity: activeSection === index ? [1, 0.7, 1] : 0.5,
                }}
                transition={{
                  duration: 2,
                  repeat: activeSection === index ? Infinity : 0,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

