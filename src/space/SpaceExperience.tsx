/* SpaceExperience.tsx — the game homepage. Hosts the WebGL canvas, the
   intro, the HUD, and the chapter panel that opens when the ship reaches a
   planet. The engine owns everything inside the canvas. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpaceEngine } from './engine';
import { CONTACT, HERO, SKILLS, STOPS, buildMailto, type Stop } from './content';

interface Props {
  onSkip: () => void;
}

function StopPanel({ stop, collected, next, onNext }: { stop: Stop; collected: Set<number>; next: Stop | null; onNext: () => void }) {
  return (
    <aside className="sx-panel" aria-live="polite" key={stop.id}>
      <div className="sx-panel-scroll">
        <p className="sx-eyebrow">{stop.eyebrow}</p>
        <h2>{stop.title}</h2>
        {stop.where && <p className="sx-where" dangerouslySetInnerHTML={{ __html: stop.where }} />}
        <p className="sx-lead">{stop.lead}</p>
        {stop.bullets && (
          <ul className="sx-bullets">
            {stop.bullets.map((b, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </ul>
        )}
        {stop.kind === 'skills' && (
          <ul className="sx-skills">
            {SKILLS.map((s, i) => (
              <li key={s.name} className={collected.has(i) ? 'lit' : ''}>
                <b>{s.name}</b>
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
        )}
        {stop.kind === 'contact' && (
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
        )}
      </div>
      {next && (
        <button className="sx-next" type="button" onClick={onNext}>
          <span>
            Next stop <b>{next.short}</b>
          </span>
          <kbd>Space</kbd>
        </button>
      )}
    </aside>
  );
}

export function SpaceExperience({ onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const guideRef = useRef<HTMLDivElement>(null);
  const guideDistRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<SpaceEngine | null>(null);

  const [ready, setReady] = useState(false);
  const [bootGone, setBootGone] = useState(false);
  const [intro, setIntro] = useState(true);
  const [docked, setDocked] = useState<number | null>(null);
  const [lastDocked, setLastDocked] = useState(-1);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [autopilot, setAutopilot] = useState<number | null>(null);
  const [toast, setToast] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);

  const introRef = useRef(intro);
  introRef.current = intro;

  const next = docked !== null ? docked + 1 : lastDocked + 1;
  const nextIndex = next < STOPS.length ? next : null;

  // engine lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !guideRef.current || !guideDistRef.current) return;
    const engine = new SpaceEngine(
      canvas,
      {
        onReady: () => setReady(true),
        onDock: (i) => {
          setDocked(i);
          if (i !== null) {
            setLastDocked(i);
            setVisited((v) => new Set(v).add(i));
          }
        },
        onCollect: (i) => {
          setCollected((c) => new Set(c).add(i));
          setToast(i);
        },
        onAutopilot: (i) => setAutopilot(i),
        onManualInput: () => {
          if (introRef.current) {
            setIntro(false);
            engine.setMode('fly');
          }
        },
      },
      {
        labels: labelRefs.current.filter((x): x is HTMLButtonElement => x !== null),
        guide: guideRef.current,
        guideDist: guideDistRef.current,
      }
    );
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setGuide(nextIndex);
  }, [nextIndex]);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setBootGone(true), 700);
    return () => window.clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (toast === null) return;
    const t = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const launch = useCallback((tour: boolean) => {
    setIntro(false);
    engineRef.current?.setMode('fly');
    if (tour) engineRef.current?.flyTo(0);
    else setShowControls(true);
  }, []);

  const flyTo = useCallback((i: number) => {
    setIntro(false);
    engineRef.current?.setMode('fly');
    engineRef.current?.flyTo(i);
  }, []);

  // Space / Enter: start the tour, or fly to the next stop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      // let ordinary buttons and links keep Space/Enter; the route bar and "next" button hand it to the game
      const gameButton = !!el?.closest('.sx-route, .sx-next, .sx-labels');
      if ((tag === 'BUTTON' && !gameButton) || tag === 'A' || tag === 'INPUT') return;
      if (gameButton) el?.blur();
      e.preventDefault();
      if (introRef.current) launch(true);
      else if (nextIndex !== null) flyTo(nextIndex);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [launch, flyTo, nextIndex]);

  useEffect(() => {
    if (!showControls) return;
    const t = window.setTimeout(() => setShowControls(false), 9000);
    return () => window.clearTimeout(t);
  }, [showControls]);

  const stop = docked !== null && autopilot === null ? STOPS[docked] : null;

  return (
    <div className={'sx-root' + (intro ? ' is-intro' : '')}>
      <canvas ref={canvasRef} className="sx-canvas" aria-label="A starship in space; planets ahead are chapters of Bhargav's career" />

      {/* planet labels, positioned every frame by the engine */}
      <div className="sx-labels">
        {STOPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="sx-label"
            ref={(el) => (labelRefs.current[i] = el)}
            onClick={() => flyTo(i)}
            tabIndex={-1}
            aria-hidden="true"
          >
            {s.short}
          </button>
        ))}
      </div>

      <div className="sx-guide" ref={guideRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="sx-guide-arrow">
          <path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sx-guide-ring" />
        <span className="sx-guide-dist" ref={guideDistRef} />
      </div>

      <header className="sx-top">
        <a className="sx-brand" href="/" aria-label="Bhargav Mantha, home">
          <img src="/logo-bm-white.svg" alt="" />
          <span>Bhargav Mantha</span>
        </a>
        <div className="sx-top-right">
          {!intro && (
            <span className="sx-count" title="Skills collected on the way">
              Skills <b>{collected.size}</b>/{SKILLS.length}
            </span>
          )}
          <button className="sx-btn ghost small" type="button" onClick={onSkip}>
            Skip to portfolio
          </button>
        </div>
      </header>

      {intro && (
        <section className="sx-intro" aria-label="Introduction">
          <p className="sx-hi">Hi, I’m</p>
          <h1>{HERO.name}</h1>
          <p className="sx-role">
            {HERO.role}. {HERO.tagline}
          </p>
          <p className="sx-sub">Take a two-minute flight through nine years of my work. Every planet is a chapter, and you collect my skills on the way.</p>
          <div className="sx-actions">
            <button className="sx-btn primary" type="button" onClick={() => launch(true)}>
              Start the tour
            </button>
            <button className="sx-btn" type="button" onClick={() => launch(false)}>
              Fly it yourself
            </button>
          </div>
          <p className="sx-hint">
            Press <kbd>Space</kbd> to launch, or{' '}
            <button type="button" className="sx-link" onClick={onSkip}>
              read the plain version
            </button>
            .
          </p>
        </section>
      )}

      {stop && (
        <StopPanel stop={stop} collected={collected} next={nextIndex !== null ? STOPS[nextIndex] : null} onNext={() => nextIndex !== null && flyTo(nextIndex)} />
      )}

      {!intro && (
        <nav className="sx-route" aria-label="Stops">
          {STOPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={[
                'sx-stop',
                visited.has(i) ? 'visited' : '',
                docked === i ? 'here' : '',
                autopilot === i ? 'target' : '',
              ].join(' ')}
              onClick={() => flyTo(i)}
              aria-current={docked === i ? 'location' : undefined}
            >
              <span className="dot" />
              <span className="name">{s.short}</span>
            </button>
          ))}
        </nav>
      )}

      {!intro && (
        <div className={'sx-controls' + (showControls ? ' open' : '')}>
          <button className="sx-controls-toggle" type="button" onClick={() => setShowControls((v) => !v)} aria-expanded={showControls}>
            Controls
          </button>
          <dl>
            <div>
              <dt>
                <kbd>W</kbd> <kbd>S</kbd>
              </dt>
              <dd>Speed up, slow down</dd>
            </div>
            <div>
              <dt>
                <kbd>A</kbd> <kbd>D</kbd>
              </dt>
              <dd>Turn</dd>
            </div>
            <div>
              <dt>
                <kbd>E</kbd> <kbd>Q</kbd>
              </dt>
              <dd>Climb, dive</dd>
            </div>
            <div>
              <dt>
                <kbd>Shift</kbd>
              </dt>
              <dd>Boost</dd>
            </div>
            <div>
              <dt>Drag</dt>
              <dd>Steer with the mouse or a finger</dd>
            </div>
            <div>
              <dt>
                <kbd>Space</kbd>
              </dt>
              <dd>Autopilot to the next stop</dd>
            </div>
          </dl>
        </div>
      )}

      {autopilot !== null && <div className="sx-autopilot">Autopilot to {STOPS[autopilot].short}. Steer to take over.</div>}

      {toast !== null && (
        <div className="sx-toast" role="status" key={toast}>
          <span className="sx-toast-k">Skill collected</span>
          <b>{SKILLS[toast].name}</b>
          <span>{SKILLS[toast].detail}</span>
        </div>
      )}

      {!bootGone && (
        <div className={'sx-boot' + (ready ? ' done' : '')}>
          <div className="sx-boot-inner">
            <span>Preparing for launch</span>
            <i />
          </div>
        </div>
      )}
    </div>
  );
}
