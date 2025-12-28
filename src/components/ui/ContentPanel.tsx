import { motion, AnimatePresence } from 'framer-motion';
import { useIslandStore } from '../../store/islandStore';
import { PIT_STOPS } from '../../constants/pitStops';
import { PROFILE, METRICS, SKILLS, EXPERIENCE, PROJECTS } from '../../constants/content';
import { SectionType } from '../../types/island';
import { TypewriterText } from './TypewriterText';

export const ContentPanel = () => {
  const activeSection = useIslandStore((state) => state.activeSection);

  if (!activeSection) return null;

  const pitStop = PIT_STOPS[activeSection];

  return (
    <AnimatePresence>
      <motion.div
        key={activeSection}
        initial={{ x: 450, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 450, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed top-0 right-0 h-screen w-[400px] z-40"
      >
        <div
          className="h-full glass-panel relative overflow-y-auto"
          style={{
            borderLeft: `2px solid ${pitStop.color}`,
            boxShadow: `0 0 20px ${pitStop.color}40`,
          }}
        >
          {/* Scan-line effect */}
          <div className="scan-line" />

          {/* Content */}
          <div className="p-8">
            <PanelContent section={activeSection} />
          </div>

          {/* Footer hints */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-neutral-gray border-t border-gray-700">
            ← Drag to rotate  |  Click sections to jump →
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const PanelContent = ({ section }: { section: SectionType }) => {
  switch (section) {
    case 'hero':
      return (
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            <TypewriterText text={PROFILE.name} speed={100} />
          </h1>
          <p className="text-accent-cyan text-xl mb-2">{PROFILE.title}</p>
          <h2 className="text-3xl font-bold text-white mb-6">{PROFILE.tagline}</h2>
          <p className="text-neutral-gray mb-8">{PROFILE.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {METRICS.map((metric) => (
              <div key={metric.label} className="text-center">
                <div
                  className="text-3xl font-bold"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </div>
                <div className="text-neutral-gray text-sm">{metric.label}</div>
              </div>
            ))}
          </div>

          <button className="glass-button w-full">Explore My Work</button>
        </div>
      );

    case 'about':
      return (
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">About Me</h2>
          <p className="text-neutral-gray mb-6">
            Technical Lead with expertise in enterprise microservices architecture,
            cloud infrastructure, and full-stack development.
          </p>

          {Object.entries(SKILLS).map(([category, skills]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-secondary rounded-full text-sm text-neutral-gray border border-gray-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'experience':
      return (
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Experience</h2>
          {EXPERIENCE.map((exp, idx) => (
            <div key={idx} className="mb-8 pb-8 border-b border-gray-700 last:border-0">
              <h3 className="text-xl font-bold text-white">{exp.company}</h3>
              <p className="text-accent-orange mb-1">{exp.role}</p>
              <p className="text-neutral-gray text-sm mb-1">{exp.period}</p>
              <p className="text-accent-cyan text-xs mb-4">📍 {exp.location}</p>

              <ul className="space-y-2 mb-4">
                {exp.achievements.map((achievement, i) => (
                  <li key={i} className="text-neutral-gray text-sm leading-relaxed">
                    • {achievement}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary rounded text-xs text-neutral-gray"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'projects':
      return (
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Projects</h2>
          {PROJECTS.map((project, idx) => (
            <div
              key={idx}
              className="mb-6 p-5 bg-secondary rounded-lg border-2 hover:border-accent-cyan transition-colors"
              style={{
                borderColor: project.featured ? '#00cea8' : '#374151',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{
                    background: `${project.color === 'purple' ? '#915EFF' : project.color === 'cyan' ? '#00cea8' : '#ff6b35'}20`,
                    color: project.color === 'purple' ? '#915EFF' : project.color === 'cyan' ? '#00cea8' : '#ff6b35',
                    border: `1px solid ${project.color === 'purple' ? '#915EFF' : project.color === 'cyan' ? '#00cea8' : '#ff6b35'}`,
                  }}
                >
                  {project.category}
                </span>
                {project.featured && (
                  <span className="text-xs text-accent-green">⭐ Featured</span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
              <p className="text-accent-cyan text-sm mb-2 font-medium">
                {project.description}
              </p>

              {project.details && (
                <p className="text-neutral-gray text-xs mb-4 leading-relaxed">
                  {project.details}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-tertiary rounded text-xs text-neutral-gray border border-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-accent-cyan hover:text-white transition-colors"
                >
                  <span>🔗</span> View on GitHub
                </a>
              )}
            </div>
          ))}
        </div>
      );

    case 'contact':
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Let&apos;s Build Something Amazing
          </h2>

          <div className="space-y-3 mb-8">
            <a
              href={`mailto:${PROFILE.email}`}
              className="glass-button block w-full"
            >
              Email
            </a>
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button block w-full"
            >
              LinkedIn
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button block w-full"
            >
              GitHub
            </a>
            <a
              href={PROFILE.blog}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button block w-full"
            >
              Blog
            </a>
          </div>
        </div>
      );

    default:
      return null;
  }
};
