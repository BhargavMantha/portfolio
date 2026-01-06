import { useScroll } from 'framer-motion';
import { RefObject } from 'react';

export type SectionType = 'hero' | 'about' | 'experience' | 'projects' | 'contact';

interface UseScrollProgressReturn {
  scrollYProgress: any;
  currentSection: SectionType;
  sectionProgress: number;
}

export const useScrollProgress = (
  containerRef: RefObject<HTMLDivElement>
): UseScrollProgressReturn => {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Note: These will be reactive values in the component
  const currentSection = 'hero' as SectionType;
  const sectionProgress = 0;

  return {
    scrollYProgress,
    currentSection,
    sectionProgress,
  };
};
