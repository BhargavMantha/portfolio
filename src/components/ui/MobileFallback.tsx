import { PROFILE, METRICS, SKILLS, EXPERIENCE, PROJECTS } from '../../constants/content';
import { PIT_STOPS } from '../../constants/pitStops';

export const MobileFallback = () => {
  return (
    <div className="w-full h-screen overflow-y-auto bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="text-white font-bold text-2xl">BM</div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen px-6 py-20 border-t-4"
        style={{ borderColor: PIT_STOPS.hero.color }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">{PROFILE.name}</h1>
        <p className="text-accent-cyan text-xl mb-2">{PROFILE.title}</p>
        <h2 className="text-2xl font-bold text-white mb-6">{PROFILE.tagline}</h2>
        <p className="text-neutral-gray mb-8">{PROFILE.description}</p>

        <div className="grid grid-cols-2 gap-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="text-center p-4 bg-secondary rounded">
              <div className="text-2xl font-bold" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-neutral-gray text-sm">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="min-h-screen px-6 py-20 border-t-4"
        style={{ borderColor: PIT_STOPS.about.color }}
      >
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
                  className="px-3 py-1 bg-secondary rounded-full text-sm text-neutral-gray"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Experience Section */}
      <section
        id="experience"
        className="min-h-screen px-6 py-20 border-t-4"
        style={{ borderColor: PIT_STOPS.experience.color }}
      >
        <h2 className="text-3xl font-bold text-white mb-6">Experience</h2>
        {EXPERIENCE.map((exp, idx) => (
          <div key={idx} className="mb-8 pb-8 border-b border-gray-700 last:border-0">
            <h3 className="text-xl font-bold text-white">{exp.company}</h3>
            <p className="text-accent-orange mb-2">{exp.role}</p>
            <p className="text-neutral-gray text-sm mb-4">{exp.period}</p>

            <ul className="space-y-2 mb-4">
              {exp.achievements.map((achievement, i) => (
                <li key={i} className="text-neutral-gray text-sm">
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
      </section>

      {/* Projects Section */}
      <section
        id="projects"
        className="min-h-screen px-6 py-20 border-t-4"
        style={{ borderColor: PIT_STOPS.projects.color }}
      >
        <h2 className="text-3xl font-bold text-white mb-6">Projects</h2>
        {PROJECTS.map((project, idx) => (
          <div key={idx} className="mb-6 p-4 bg-secondary rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-primary rounded text-xs text-accent-green">
                {project.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
            <p className="text-neutral-gray text-sm mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-tertiary rounded text-xs text-neutral-gray"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="min-h-screen px-6 py-20 border-t-4"
        style={{ borderColor: PIT_STOPS.contact.color }}
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Let&apos;s Build Something Amazing
        </h2>

        <div className="space-y-3 mb-8">
          <a
            href={`mailto:${PROFILE.email}`}
            className="glass-button block w-full text-center"
          >
            Email
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button block w-full text-center"
          >
            LinkedIn
          </a>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button block w-full text-center"
          >
            GitHub
          </a>
          <a
            href={PROFILE.blog}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button block w-full text-center"
          >
            Blog
          </a>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-neutral-gray text-sm border-t border-gray-700">
        © 2025 Bhargav Mantha
      </footer>
    </div>
  );
};
