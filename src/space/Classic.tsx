/* Classic.tsx — the plain, fast portfolio. Shown when someone skips the game,
   on phones, when reduced motion is requested, or when WebGL isn't available.
   Same content as the game, from content.ts. */
import { CONTACT, HERO, SKILLS, STOPS, buildMailto } from './content';

interface Props {
  canPlay: boolean;
  onPlay: () => void;
}

export function Classic({ canPlay, onPlay }: Props) {
  const story = STOPS.find((s) => s.kind === 'story')!;
  const jobs = STOPS.filter((s) => s.kind === 'job');
  const contact = STOPS.find((s) => s.kind === 'contact')!;

  return (
    <div className="cl-root">
      <header className="cl-top">
        <a className="sx-brand" href="/" aria-label="Bhargav Mantha, home">
          <img src="/logo-bm-white.svg" alt="" />
          <span>Bhargav Mantha</span>
        </a>
        <nav aria-label="Sections">
          <a href="#story">Story</a>
          <a href="#work">Work</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="cl-hero">
          <p className="sx-hi">Hi, I’m</p>
          <h1>{HERO.name}</h1>
          <p className="sx-role">
            {HERO.role}. {HERO.tagline}
          </p>
          <p className="sx-sub">{HERO.sub}</p>
          <div className="sx-actions">
            <a className="sx-btn primary" href={buildMailto()}>
              Email me
            </a>
            <a className="sx-btn" href={CONTACT.resume} download>
              Download résumé
            </a>
            {canPlay && (
              <button className="sx-btn ghost" type="button" onClick={onPlay}>
                Fly the 3D version
              </button>
            )}
          </div>
        </section>

        <section className="cl-section" id="story">
          <h2>{story.title}</h2>
          <p className="sx-lead">{story.lead}</p>
          <ul className="sx-bullets">
            {story.bullets?.map((b, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </ul>
        </section>

        <section className="cl-section" id="work">
          <h2>Work</h2>
          <ol className="cl-timeline">
            {[...jobs].reverse().map((j) => (
              <li key={j.id}>
                <h3>{j.title}</h3>
                {j.where && <p className="sx-where" dangerouslySetInnerHTML={{ __html: j.where }} />}
                <p className="sx-lead">{j.lead}</p>
                <ul className="sx-bullets">
                  {j.bullets?.map((b, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="cl-section" id="skills">
          <h2>Skills</h2>
          <ul className="sx-skills lit-all">
            {SKILLS.map((s) => (
              <li key={s.name} className="lit">
                <b>{s.name}</b>
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cl-section" id="contact">
          <h2>{contact.title}</h2>
          <p className="sx-lead">{contact.lead}</p>
          <div className="sx-actions">
            <a className="sx-btn primary" href={buildMailto()}>
              Email me
            </a>
            <a className="sx-btn" href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="sx-btn" href={CONTACT.resume} download>
              Download résumé
            </a>
          </div>
        </section>
      </main>

      <footer className="cl-foot">© Bhargav Mantha, Mumbai</footer>
    </div>
  );
}
