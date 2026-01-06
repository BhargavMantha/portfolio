import { motion, MotionValue, useTransform } from 'framer-motion';
import { PROFILE, METRICS, EXPERIENCE, PROJECTS } from '../../constants/content';

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
  // Fade in from 0-5%, stay visible 5-15%, fade out 15-20%
  const opacity = useTransform(scrollProgress, [0, 0.05, 0.15, 0.20], [1, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0, 0.2], [0, -100]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="text-center max-w-4xl px-8">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-7xl font-bold text-white mb-4 tracking-tight"
        >
          {PROFILE.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-electric-blue text-2xl mb-2 hud-text"
        >
          {PROFILE.title}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-4xl font-bold text-arc-reactor mb-8 text-glow-gold"
        >
          {PROFILE.tagline}
        </motion.h2>

        {/* Animated Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="grid grid-cols-4 gap-6 mt-12"
        >
          {METRICS.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4 + idx * 0.1 }}
              className="text-center"
            >
              <div
                className="text-5xl font-bold mb-2"
                style={{
                  color: metric.color,
                  textShadow: `0 0 20px ${metric.color}`,
                }}
              >
                {metric.value}
              </div>
              <div className="text-text-secondary text-sm tracking-wider">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

// About Section (20-40%)
const AboutSection = ({ scrollProgress }: SectionOverlayProps) => {
  // Fade in 20-25%, stay visible 25-35%, fade out 35-40%
  const opacity = useTransform(scrollProgress, [0.20, 0.25, 0.35, 0.40], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0.2, 0.4], [50, -50]);

  const hobbies = [
    { component: 'Helmet (AI Chip)', hobby: 'Compiler Design (Athena Lang)', desc: 'Building systems from scratch' },
    { component: 'Arc Reactor (Core)', hobby: 'AI/ML Engineering', desc: 'Pattern recognition and optimization' },
    { component: 'Repulsors (Hands)', hobby: 'Cooking & Sketching', desc: 'Precision and creativity' },
    { component: 'Boot Jets (Legs)', hobby: 'Gaming on Linux', desc: 'Optimizing performance under constraints' },
  ];

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="max-w-5xl px-8">
        <h2 className="text-5xl font-bold text-white mb-4 text-center">
          About Me
        </h2>
        <p className="text-text-secondary text-xl text-center mb-12 max-w-3xl mx-auto">
          {PROFILE.description}. 8+ years backend engineering specializing in Node.js, TypeScript, NestJS, AWS.
        </p>

        {/* Suit Components Mapped to Hobbies */}
        <div className="grid grid-cols-2 gap-6">
          {hobbies.map((item, idx) => (
            <motion.div
              key={item.component}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-secondary/50 backdrop-blur-md border border-electric-blue/30 rounded-lg p-6"
              style={{
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
              }}
            >
              <div className="text-electric-blue text-sm mb-2 hud-text">
                {item.component}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {item.hobby}
              </h3>
              <p className="text-text-tertiary text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Experience Section (40-60%)
const ExperienceSection = ({ scrollProgress }: SectionOverlayProps) => {
  // Fade in 40-45%, stay visible 45-55%, fade out 55-60%
  const opacity = useTransform(scrollProgress, [0.40, 0.45, 0.55, 0.60], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0.4, 0.6], [50, -50]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10 overflow-y-auto"
    >
      <div className="max-w-6xl px-8 py-20">
        <h2 className="text-5xl font-bold text-white mb-12 text-center">
          Experience
        </h2>

        <div className="space-y-8">
          {EXPERIENCE.map((exp, idx) => (
            <motion.div
              key={exp.company}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-secondary/50 backdrop-blur-md border-l-4 border-arc-reactor rounded-lg p-6"
              style={{
                boxShadow: '0 0 30px rgba(255, 193, 7, 0.1)',
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{exp.company}</h3>
                  <p className="text-arc-reactor text-lg font-semibold">{exp.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-electric-blue text-sm hud-text">{exp.period}</p>
                  <p className="text-text-tertiary text-xs">📍 {exp.location}</p>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {exp.achievements.slice(0, 3).map((achievement, i) => (
                  <li key={i} className="text-text-secondary text-sm leading-relaxed flex">
                    <span className="text-electric-blue mr-2">▸</span>
                    {achievement}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-tertiary/50 border border-electric-blue/30 rounded-full text-xs text-electric-blue"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Projects Section (60-80%)
const ProjectsSection = ({ scrollProgress }: SectionOverlayProps) => {
  // Fade in 60-65%, stay visible 65-75%, fade out 75-80%
  const opacity = useTransform(scrollProgress, [0.60, 0.65, 0.75, 0.80], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [0.6, 0.8], [50, -50]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div className="max-w-6xl px-8">
        <h2 className="text-5xl font-bold text-white mb-12 text-center">
          Featured Projects
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {PROJECTS.map((project, idx) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-secondary/50 backdrop-blur-md border-2 rounded-lg p-6 relative overflow-hidden"
              style={{
                borderColor: project.color === 'purple' ? '#9333EA' : project.color === 'cyan' ? '#00D4FF' : '#FF6B35',
                boxShadow: `0 0 30px ${project.color === 'purple' ? '#9333EA' : project.color === 'cyan' ? '#00D4FF' : '#FF6B35'}40`,
              }}
            >
              {/* Location Marker */}
              <div className="absolute top-4 right-4">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: project.color === 'purple' ? '#9333EA' : project.color === 'cyan' ? '#00D4FF' : '#FF6B35',
                    boxShadow: `0 0 20px ${project.color === 'purple' ? '#9333EA' : project.color === 'cyan' ? '#00D4FF' : '#FF6B35'}`,
                  }}
                />
              </div>

              <div className="text-xs text-electric-blue mb-2 hud-text">
                {project.category}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {project.name}
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-tertiary/50 rounded text-xs text-text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Contact Section (80-100%)
const ContactSection = ({ scrollProgress }: SectionOverlayProps) => {
  // Fade in 80-85%, stay visible 85-100%
  const opacity = useTransform(scrollProgress, [0.80, 0.85, 1], [0, 1, 1]);
  const scale = useTransform(scrollProgress, [0.8, 0.9], [0.8, 1]);
  
  // Enable pointer events only when section is visible (85-100%)
  const pointerEvents = useTransform(scrollProgress, (value) => {
    return value >= 0.85 ? 'auto' : 'none';
  });

  const contactMethods = [
    { label: 'Email', value: PROFILE.email, href: `mailto:${PROFILE.email}`, icon: '📧' },
    { label: 'GitHub', value: '/BhargavMantha', href: PROFILE.github, icon: '💻' },
    { label: 'LinkedIn', value: '/in/bhargavmantha', href: PROFILE.linkedin, icon: '💼' },
    { label: 'Blog', value: 'dev.to/bhargavmantha', href: PROFILE.blog, icon: '✍️' },
  ];

  return (
    <motion.div
      style={{ opacity, scale, pointerEvents }}
      className="fixed inset-0 flex items-center justify-center z-10"
    >
      <div className="text-center max-w-3xl px-8">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold text-white mb-6"
        >
          Let's Build Something
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-text-secondary text-xl mb-12"
        >
          Ready to architect scalable systems together?
        </motion.p>

        {/* Holographic Contact Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {contactMethods.map((method, idx) => (
            <motion.a
              key={method.label}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-secondary/50 backdrop-blur-md border-2 border-electric-blue/50 rounded-lg p-6 transition-all duration-300 hover:border-arc-reactor hover:shadow-[0_0_30px_rgba(255,193,7,0.3)]"
            >
              <div className="text-4xl mb-2">{method.icon}</div>
              <div className="text-white font-bold mb-1">{method.label}</div>
              <div className="text-electric-blue text-sm hud-text">{method.value}</div>
            </motion.a>
          ))}
        </div>

        {/* Download Resume */}
        <motion.a
          href="/Bhargav_Mantha.pdf"
          download="Bhargav_Mantha.pdf"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          className="inline-block px-8 py-4 bg-arc-reactor text-primary font-bold rounded-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,193,7,0.6)]"
        >
          Download Resume (PDF)
        </motion.a>
      </div>
    </motion.div>
  );
};
