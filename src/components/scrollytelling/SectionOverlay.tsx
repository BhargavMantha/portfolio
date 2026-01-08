import { motion, MotionValue, useTransform } from 'framer-motion';
import { PROFILE, METRICS, EXPERIENCE, PROJECTS } from '../../constants/content';
import { BentoGrid, BentoGridItem } from '../ui/BentoGrid';
import { TechStack } from '../ui/TechStack';

interface SectionOverlayProps {
  scrollProgress: MotionValue<number>;
}

export const SectionOverlay = ({ scrollProgress }: SectionOverlayProps) => {
  return (
    <>
      <HeroSection scrollProgress={scrollProgress} />
      <AboutSection scrollProgress={scrollProgress} />
      <ExperienceSection scrollProgress={scrollProgress} />
      <ProjectsSection scrollProgress={scrollProgress} />
      <ContactSection scrollProgress={scrollProgress} />
    </>
  );
};

// Hero Section (0-20%)
const HeroSection = ({ scrollProgress }: SectionOverlayProps) => {
  const opacity = useTransform(scrollProgress, [0, 0.05, 0.15, 0.20], [1, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0, 0.2], [0, -100]);
  const scale = useTransform(scrollProgress, [0, 0.2], [1, 0.8]);

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="text-center max-w-5xl px-8 select-none relative z-10">
        <motion.div
           className="p-12 rounded-3xl bg-black/60 backdrop-blur-md border border-white/5"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1 }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative inline-block"
        >
          <div className="absolute -inset-8 bg-electric-blue/20 blur-3xl rounded-full opacity-20 animate-pulse" />
          <h1 className="text-8xl md:text-9xl font-bold mb-4 tracking-tighter text-white relative z-10">
            {PROFILE.name.toUpperCase()}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="h-[1px] w-12 bg-electric-blue/50" />
          <p className="text-2xl text-electric-blue tracking-[0.2em] font-light">
            {PROFILE.title}
          </p>
          <div className="h-[1px] w-12 bg-electric-blue/50" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-4xl font-display font-light text-arc-reactor mb-12 text-gradient-gold"
        >
          {PROFILE.tagline}
        </motion.h2>

        {/* System Status Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="stark-glass-card rounded-lg p-4 flex flex-col items-center justify-center border-t border-white/10"
            >
              <div 
                className="text-3xl font-bold mb-1 font-display" 
                style={{ color: metric.color }}
              >
                {metric.value}
              </div>
              <div className="text-xs text-text-secondary uppercase tracking-widest">
                {metric.label}
              </div>
            </div>
          ))}
        </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// About Section (20-40%)
const AboutSection = ({ scrollProgress }: SectionOverlayProps) => {
  const opacity = useTransform(scrollProgress, [0.20, 0.25, 0.35, 0.40], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0.2, 0.4], [50, -50]);

  const skills = [
    { name: 'Architecture', level: 95, color: '#00D4FF' },
    { name: 'Node.js/TS', level: 90, color: '#FFC107' },
    { name: 'Cloud/AWS', level: 85, color: '#00F5FF' },
    { name: 'System Design', level: 88, color: '#9333EA' },
  ];

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="w-full max-w-6xl px-4">
        <h2 className="text-5xl font-bold text-white mb-8 text-center font-display drop-shadow-2xl">
          System Diagnostics
        </h2>

        <BentoGrid className="max-w-5xl mx-auto bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/5">
          {/* Main Profile Card */}
          <BentoGridItem
            title={<span className="text-xl text-electric-blue">Overview</span>}
            description={
              <div className="text-sm leading-relaxed text-gray-300">
                {PROFILE.description}
                <br /><br />
                <span className="text-white font-semibold">Specialty:</span> Building high-performance backend systems.
              </div>
            }
            header={<div className="h-full w-full bg-gradient-to-br from-blue-900/20 to-transparent rounded-xl flex items-center justify-center text-4xl">👨‍💻</div>}
            className="md:col-span-1"
          />

          {/* Tech Stack Meter */}
          <BentoGridItem 
            title="Core Capabilities"
            description="Real-time proficiency metrics."
            header={
              <div className="p-2">
                <TechStack skills={skills} />
              </div>
            }
            className="md:col-span-2"
          />
          
          {/* Additional Info Cards */}
           <BentoGridItem
            title="Hobbies"
            description="Compiler Design, Gaming on Linux, Cooking."
            header={<div className="h-16 w-full bg-tertiary/30 rounded-lg mb-2 flex items-center justify-center">🎮 🍳 🐧</div>}
            className="md:col-span-1"
          />
           <BentoGridItem
            title="Philosophy"
            description="Code is art. Performance is key. Simplicity is ultimate sophistication."
            header={<div className="h-16 w-full bg-tertiary/30 rounded-lg mb-2 text-center pt-4 text-arc-reactor">Keep It Simple</div>}
            className="md:col-span-1"
          />
           <BentoGridItem
            title="Location"
            description="Remote / Global"
            header={<div className="h-16 w-full bg-tertiary/30 rounded-lg mb-2 flex items-center justify-center text-2xl">🌍</div>}
            className="md:col-span-1"
          />

        </BentoGrid>
      </div>
    </motion.div>
  );
};

// Experience Section (40-60%)
const ExperienceSection = ({ scrollProgress }: SectionOverlayProps) => {
  const opacity = useTransform(scrollProgress, [0.40, 0.45, 0.55, 0.60], [0, 1, 1, 0]);
  const x = useTransform(scrollProgress, [0.4, 0.6], [100, -100]);

  return (
    <motion.div
      style={{ opacity, x }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="max-w-6xl w-full px-8 flex flex-col h-[80vh] justify-center">
        <h2 className="text-5xl font-bold text-white mb-12 text-left ml-12 font-display">
          Mission Log
        </h2>

        <div className="relative border-l-2 border-white/10 ml-12 space-y-12 bg-black/60 backdrop-blur-md p-8 rounded-r-3xl border-y border-r border-white/5">
          {EXPERIENCE.map((exp) => (
            <div key={exp.company} className="relative pl-8">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-arc-reactor glow-gold" />
              
              <div className="stark-glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white font-display mb-1">{exp.company}</h3>
                    <p className="text-arc-reactor text-lg font-mono">{exp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-electric-blue font-mono text-sm">{exp.period}</p>
                    <p className="text-text-tertiary text-xs mt-1">{exp.location}</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {exp.achievements.slice(0, 3).map((achievement, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start">
                      <span className="text-electric-blue mr-2 mt-1">▹</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
                
                <div className="flex gap-2 flex-wrap">
                  {exp.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-electric-blue">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Projects Section (60-80%)
const ProjectsSection = ({ scrollProgress }: SectionOverlayProps) => {
  const opacity = useTransform(scrollProgress, [0.60, 0.65, 0.75, 0.80], [0, 1, 1, 0]);
  const scale = useTransform(scrollProgress, [0.6, 0.8], [0.8, 1]);

  return (
    <motion.div
      style={{ opacity, scale }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="max-w-7xl w-full px-8">
        <h2 className="text-5xl font-bold text-white mb-12 text-center font-display">
          Project Archive
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROJECTS.map((project, idx) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="stark-glass-card rounded-2xl p-6 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 font-mono text-xs text-electric-blue">
                {project.category}
              </div>
              
              <div className="mt-8 mb-4">
                 <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-electric-blue transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

               <div className="flex gap-2 flex-wrap mt-auto">
                  {project.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 rounded text-[10px] uppercase tracking-wider bg-black/50 border border-white/10 text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Hover Glow Effect */}
                <div 
                  className="absolute -bottom-20 -right-20 w-40 h-40 bg-electric-blue/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-500" 
                />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Contact Section (80-100%)
const ContactSection = ({ scrollProgress }: SectionOverlayProps) => {
  const opacity = useTransform(scrollProgress, [0.80, 0.85, 1], [0, 1, 1]);
  const pointerEvents = useTransform(scrollProgress, (value) => value >= 0.85 ? 'auto' : 'none');

  return (
    <motion.div
      style={{ opacity, pointerEvents }}
      className="fixed inset-0 flex items-center justify-center z-10"
    >
      <div className="text-center max-w-4xl px-8 w-full">
         <div className="stark-glass-card p-12 rounded-3xl border border-electric-blue/20 bg-black/60 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(0,212,255,0.3)]">
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight">
              Establish Uplink
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Ready to deploy scalable solutions? Initiating protocol...
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
               <a 
                href={`mailto:${PROFILE.email}`}
                className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform duration-300"
               >
                 Send Transmission
               </a>
               <a 
                 href={PROFILE.linkedin}
                 target="_blank"
                 className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 transition-all font-medium text-white"
               >
                 Connect on LinkedIn
               </a>
            </div>

             <div className="flex justify-center gap-8 text-gray-400 text-sm uppercase tracking-widest">
              <a href={PROFILE.github} className="hover:text-electric-blue transition-colors">GitHub</a>
              <a href={PROFILE.blog} className="hover:text-electric-blue transition-colors">Blog</a>
              <a href="/Bhargav_Mantha.pdf" className="hover:text-electric-blue transition-colors">Resume_v4.2.pdf</a>
             </div>
         </div>
      </div>
    </motion.div>
  );
};
