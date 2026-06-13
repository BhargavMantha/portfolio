/* FlightExperience.tsx — the whole homepage. Renders the static HUD chrome and
   the career chapters (data-driven from flightData), hosts the WebGL canvas,
   and hands the DOM refs to the engine hook which runs the scroll choreography.
   The glassy BootSplash sits on top until fonts + the first frame are ready. */
import { useEffect, useRef, useState } from 'react';
import { BootSplash } from './BootSplash';
import { useFlightEngine, type FlightRefs } from './useFlightEngine';
import { CHAPTERS, CONTACT, buildMailto, type Chapter } from './flightData';
import './flight.css';
import './flight-layout.css';

function ChapterSection({ ch }: { ch: Chapter }) {
  if (ch.hero) {
    const [l1, l2] = ch.heroName!;
    return (
      <section className={'chapter ' + ch.align} id={ch.id} data-screen-label={ch.screenLabel}>
        <div className="inner" style={{ maxWidth: 840 }}>
          <h1>
            {l1}
            <br />
            {l2}
          </h1>
          <div className="role">{ch.role}</div>
          <div className="tagline text-gradient-gold">{ch.tagline}</div>
          <p className="sub">{ch.sub}</p>
        </div>
      </section>
    );
  }

  if (ch.schematic) {
    return (
      <section className={'chapter ' + ch.align} id={ch.id} data-screen-label={ch.screenLabel}>
        <div className="inner" style={{ maxWidth: 680 }}>
          <div className="eyebrow">{ch.eyebrow}</div>
          <h2>{ch.title}</h2>
          <div className="note">{ch.note}</div>
        </div>
      </section>
    );
  }

  if (ch.uplink) {
    return (
      <section className={'chapter ' + ch.align} id={ch.id} data-screen-label={ch.screenLabel}>
        <div className="inner" style={{ maxWidth: 660, marginTop: 110 }}>
          <div className="eyebrow">{ch.eyebrow}</div>
          <h2>{ch.title}</h2>
          <p className="lead">{ch.lead}</p>
          <div className="btnrow">
            <a className="btn solid" href={buildMailto()}>
              Send Transmission
            </a>
            <a className="btn ghosty" href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              Connect on LinkedIn
            </a>
            <a className="btn ghosty" href={CONTACT.resume} download>
              Download Résumé
            </a>
          </div>
          <div className="foot">© BHARGAV MANTHA · MUMBAI · I LIVE TO CODE</div>
        </div>
      </section>
    );
  }

  // standard narrative chapter
  return (
    <section className={'chapter ' + ch.align} id={ch.id} data-screen-label={ch.screenLabel}>
      <div className="inner panel">
        <div className="eyebrow">{ch.eyebrow}</div>
        <h2>{ch.title}</h2>
        {ch.where && <div className="where" dangerouslySetInnerHTML={{ __html: ch.where }} />}
        <p className="lead">{ch.lead}</p>
        {ch.bullets && (
          <ul className="hits">
            {ch.bullets.map((b, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: b.html }} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function FlightExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const calloutHostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const altTicksRef = useRef<HTMLDivElement>(null);
  const altFillRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const [frameReady, setFrameReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  // Wait for webfonts so the HUD doesn't reflow after the reveal.
  useEffect(() => {
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => !cancelled && setFontsReady(true));
    } else {
      setFontsReady(true);
    }
    // safety net: never let the splash hang on a slow font CDN
    const t = window.setTimeout(() => !cancelled && setFontsReady(true), 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useFlightEngine(
    () => {
      if (
        !canvasRef.current ||
        !scrollerRef.current ||
        !calloutHostRef.current ||
        !svgRef.current ||
        !altTicksRef.current ||
        !altFillRef.current ||
        !scrollHintRef.current ||
        !rootRef.current
      )
        return null;
      const refs: FlightRefs = {
        canvas: canvasRef.current,
        scroller: scrollerRef.current,
        calloutHost: calloutHostRef.current,
        svg: svgRef.current,
        altTicks: altTicksRef.current,
        altFill: altFillRef.current,
        scrollHint: scrollHintRef.current,
        root: rootRef.current,
      };
      return refs;
    },
    { onReady: () => setFrameReady(true) }
  );

  return (
    <div className="flight-root" ref={rootRef}>
      <div className="bg-wash" />

      <div id="scroller" ref={scrollerRef}>
        <div className="scroll-space" />
        <canvas id="scene" ref={canvasRef} />

        <svg id="lines" ref={svgRef} />
        <div id="callouts" ref={calloutHostRef} />

        {/* fixed HUD chrome */}
        <div className="hud-top">
          <img src="/logo-bm-white.svg" alt="BM" />
          <span className="who">Bhargav Mantha</span>
        </div>

        <div id="altimeter">
          <div className="alt-label">ALTITUDE</div>
          <div className="track">
            <div className="fill" ref={altFillRef} />
            <div className="ticks" ref={altTicksRef} />
          </div>
        </div>

        <div id="scroll-hint" ref={scrollHintRef}>
          <span className="t">INITIALIZE FLIGHT</span>
          <span className="mouse">
            <span className="dot" />
          </span>
        </div>

        {CHAPTERS.map((ch) => (
          <ChapterSection key={ch.id} ch={ch} />
        ))}
      </div>

      {!splashGone && <BootSplash ready={frameReady && fontsReady} onDone={() => setSplashGone(true)} />}
    </div>
  );
}
