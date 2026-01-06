import { motion } from 'framer-motion';

interface ArcReactorLoaderProps {
  progress: number;
}

export const ArcReactorLoader = ({ progress }: ArcReactorLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      {/* Arc Reactor Core */}
      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          className="w-32 h-32 rounded-full border-4 border-arc-reactor"
          style={{
            boxShadow: '0 0 20px #FFC107, 0 0 40px #FFC107, 0 0 60px #FFC107',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Inner Rings */}
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-electric-blue"
          style={{
            boxShadow: '0 0 15px #00D4FF, 0 0 30px #00D4FF',
          }}
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <motion.div
          className="absolute inset-8 rounded-full bg-arc-reactor"
          style={{
            boxShadow: '0 0 30px #FFC107, 0 0 60px #FFC107, inset 0 0 20px #FFC107',
          }}
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Center Glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 rounded-full bg-white"
            style={{
              boxShadow: '0 0 20px #FFF, 0 0 40px #FFC107',
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Progress Text */}
      <motion.div
        className="absolute mt-48 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-arc-reactor text-2xl font-bold mb-2 text-glow-gold">
          {progress}%
        </div>
        <div className="text-electric-blue text-sm tracking-wider hud-text">
          INITIALIZING SYSTEMS
        </div>
      </motion.div>

      {/* Scanline Effect */}
      <div className="scanline" />
    </div>
  );
};
