/* useFlightEngine.ts — the scroll choreography, ported from the original
   flight.js into a React hook. The hologram suit flies through the career
   chapters, hovers beside each text stop, and disassembles into a capability
   map at the Suit Schematic chapter.

   What changed from the vanilla version:
   • It lives inside React's lifecycle — full setup in one effect, full
     teardown (renderer dispose, listeners, rAF) on unmount.
   • SMOOTHED SCROLL: native scroll sets a *target* progress; the rendered
     progress `p` eases toward it every frame, so the suit and the overlays
     glide between chapters instead of snapping to raw scrollTop.
   • Boot readiness is reported up via onReady so the glassy splash can reveal
     only once fonts are loaded and the first WebGL frame has painted. */
import { useEffect } from 'react';
import * as THREE from 'three';
import { buildSuit } from './buildSuit';
import { RANGES, CALLOUTS } from './flightData';

// Preserve the original r128 color look (no implicit sRGB conversion).
THREE.ColorManagement.enabled = false;

export interface FlightRefs {
  canvas: HTMLCanvasElement;
  scroller: HTMLElement;
  calloutHost: HTMLElement;
  svg: SVGSVGElement;
  altTicks: HTMLElement;
  altFill: HTMLElement;
  scrollHint: HTMLElement;
  root: HTMLElement; // contains the #chN chapter sections
}

interface EngineOptions {
  onReady?: () => void;
  onTick?: (i: number) => void; // active chapter index, for the altimeter highlight in React if desired
}

const SVGNS = 'http://www.w3.org/2000/svg';
const SCROLL_EASE = 0.09; // how fast rendered progress chases the scroll target

/** Drive the whole Flight Experience. Pass a getter for the refs (resolved
 *  once the DOM is mounted) plus lifecycle callbacks. */
export function useFlightEngine(getRefs: () => FlightRefs | null, opts: EngineOptions = {}): void {
  const { onReady, onTick } = opts;

  useEffect(() => {
    const refs = getRefs();
    if (!refs) return;
    const { canvas, scroller, calloutHost, svg, altTicks, altFill, scrollHint, root } = refs;

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ================= renderer / scene ================= */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);
    camera.lookAt(0, 0.2, 0);

    /* starfield */
    const starGeo = new THREE.BufferGeometry();
    {
      const NSTAR = 380;
      const pos = new Float32Array(NSTAR * 3);
      for (let i = 0; i < NSTAR; i++) {
        const r = 18 + Math.random() * 26;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(Math.random() * 2 - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
        pos[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 4;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
    const starMat = new THREE.PointsMaterial({ color: 0x9fdcff, size: 0.06, transparent: true, opacity: 0.7, depthWrite: false });
    const stars = new THREE.Points(starGeo, starMat);
    stars.name = 'stars';
    scene.add(stars);

    /* suit */
    const suit = buildSuit();
    const BASE_SCALE = 0.66;
    suit.group.scale.setScalar(BASE_SCALE);
    scene.add(suit.group);

    /* thruster particles */
    const PMAX = 260;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PMAX * 3);
    const pCol = new Float32Array(PMAX * 3);
    const pVel: THREE.Vector3[] = [];
    const pLife = new Float32Array(PMAX);
    for (let i = 0; i < PMAX; i++) {
      pVel.push(new THREE.Vector3());
      pLife[i] = 0;
      pPos[i * 3 + 1] = -999;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: suit.glowTexture,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);
    let pCursor = 0;
    const _w = new THREE.Vector3();
    function spawn(anchor: THREE.Object3D, n: number, speed: number) {
      anchor.getWorldPosition(_w);
      for (let k = 0; k < n; k++) {
        const i = pCursor;
        pCursor = (pCursor + 1) % PMAX;
        pPos[i * 3] = _w.x + (Math.random() - 0.5) * 0.08;
        pPos[i * 3 + 1] = _w.y;
        pPos[i * 3 + 2] = _w.z + (Math.random() - 0.5) * 0.08;
        pVel[i].set((Math.random() - 0.5) * 0.25, -1.6 - Math.random() * speed * 2.4, (Math.random() - 0.5) * 0.25);
        pLife[i] = 1;
      }
    }
    function stepParticles(dt: number) {
      for (let i = 0; i < PMAX; i++) {
        if (pLife[i] <= 0) continue;
        pLife[i] -= dt * 1.8;
        pPos[i * 3] += pVel[i].x * dt;
        pPos[i * 3 + 1] += pVel[i].y * dt;
        pPos[i * 3 + 2] += pVel[i].z * dt;
        const l = Math.max(pLife[i], 0);
        // cyan → deep blue fade (additive: dark = invisible)
        pCol[i * 3] = 0.0 * l;
        pCol[i * 3 + 1] = 0.83 * l * l;
        pCol[i * 3 + 2] = 1.0 * l;
        if (pLife[i] <= 0) pPos[i * 3 + 1] = -999;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
    }

    /* ================= chapters / choreography ================= */
    const N = RANGES.length;
    let sideX = 2.2;
    let mobile = false;

    function anchorFor(i: number) {
      // text side alternates; suit hovers on the opposite side
      if (mobile) {
        const y = i === 6 ? 0.78 : 1.18;
        const z = i === 0 ? -3.2 : i === 6 ? 0.4 : -0.6;
        return { x: 0, y: i === 0 ? 0.9 : y, z, s: i === 6 ? 0.6 : 0.52 };
      }
      switch (i) {
        case 0: return { x: 0, y: 3.5, z: -5.5, s: 0.9 }; // small, high above the name
        case 1: return { x: +sideX, y: 0.15, z: 0, s: 1 }; // text left → suit right
        case 2: return { x: -sideX, y: 0.15, z: 0, s: 1 }; // text right → suit left
        case 3: return { x: +sideX, y: 0.15, z: 0, s: 1 };
        case 4: return { x: -sideX, y: 0.15, z: 0, s: 1 };
        case 5: return { x: +sideX, y: 0.15, z: 0, s: 1 };
        case 6: return { x: 0, y: 0.3, z: 1.1, s: 0.95 }; // center stage, close
        default: return { x: 0, y: 2.45, z: -2.2, s: 0.8 }; // hovering high above the uplink
      }
    }

    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };

    interface Target { x: number; y: number; z: number; s: number; i: number; flying?: number }
    function targetAt(pp: number): Target {
      if (pp <= RANGES[0][1]) return { ...anchorFor(0), i: 0 };
      if (pp >= RANGES[N - 1][0]) {
        const a: Target = { ...anchorFor(N - 1), i: N - 1 };
        // final ascent at the very end
        const k = smooth(0.985, 1.0, pp);
        a.y += k * 9;
        a.z -= k * 4;
        return a;
      }
      for (let i = 0; i < N - 1; i++) {
        const [s0, e0] = RANGES[i];
        const [s1] = RANGES[i + 1];
        if (pp >= s0 && pp <= e0) return { ...anchorFor(i), i };
        if (pp > e0 && pp < s1) {
          const k = smooth(e0, s1, pp);
          const A = anchorFor(i);
          const B = anchorFor(i + 1);
          return {
            x: A.x + (B.x - A.x) * k,
            y: A.y + (B.y - A.y) * k + Math.sin(k * Math.PI) * 0.55, // arc up while flying
            z: A.z + (B.z - A.z) * k + Math.sin(k * Math.PI) * 0.6, // swing toward camera
            s: A.s + (B.s - A.s) * k,
            i: k < 0.5 ? i : i + 1,
            flying: Math.sin(k * Math.PI),
          };
        }
      }
      return { ...anchorFor(N - 1), i: N - 1 };
    }

    function explodeAt(pp: number) {
      return smooth(0.735, 0.785, pp) * (1 - smooth(0.88, 0.91, pp));
    }

    /* ================= chapter overlays ================= */
    // Each chapter section is full-bleed (inset:0) but must stay transparent to
    // pointer/wheel events, or it would swallow the scroll. Only its small
    // .inner panel becomes interactive while the chapter is on screen.
    const chapters: HTMLElement[] = [];
    const chapterInners: HTMLElement[] = [];
    for (let i = 0; i < N; i++) {
      const sec = root.querySelector('#ch' + i) as HTMLElement;
      chapters.push(sec);
      chapterInners.push(sec.querySelector('.inner') as HTMLElement);
    }
    function chapterOpacity(i: number, pp: number) {
      const [s, e] = RANGES[i];
      const m = 0.028; // fade margin
      if (i === 0) return 1 - smooth(e - m, e + m, pp);
      if (i === N - 1) return smooth(s - m, s + m, pp);
      return smooth(s - m, s + m, pp) * (1 - smooth(e - m, e + m, pp));
    }

    /* ================= callouts ================= */
    interface CalloutRT {
      el: HTMLElement;
      line: SVGLineElement;
      dot: SVGCircleElement;
      dx: number;
      dy: number;
      part: string;
      w: number;
    }
    const callouts: CalloutRT[] = CALLOUTS.map((c) => {
      const el = document.createElement('div');
      el.className = 'callout';
      el.innerHTML =
        '<div class="part">' + c.label + '</div><div class="skill">' + c.skill + '</div><div class="techs">' + c.techs + '</div>';
      calloutHost.appendChild(el);
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('stroke', 'rgba(0,212,255,.55)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('opacity', '0');
      svg.appendChild(line);
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#ffc107');
      dot.setAttribute('opacity', '0');
      svg.appendChild(dot);
      return { el, line, dot, dx: c.dx, dy: c.dy, part: c.part, w: 0 };
    });

    const _proj = new THREE.Vector3();
    function updateCallouts(f: number) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const k = mobile ? 0.52 : 1;
      callouts.forEach((c, idx) => {
        const vis = f > 0.55 + idx * 0.045 ? 1 : 0;
        const part = suit.parts[c.part as keyof typeof suit.parts];
        part.getWorldPosition(_proj);
        if (c.part === 'armL' || c.part === 'armR') _proj.y -= 0.55 * BASE_SCALE;
        if (c.part === 'legL' || c.part === 'legR') _proj.y -= 0.8 * BASE_SCALE;
        _proj.project(camera);
        const sx = (_proj.x * 0.5 + 0.5) * W;
        const sy = (-_proj.y * 0.5 + 0.5) * H;
        const dx = c.dx * k;
        const dy = c.dy * k;
        if (!c.w) c.w = c.el.offsetWidth;
        let lx = dx >= 0 ? sx + dx : sx + dx - c.w;
        let ly = sy + dy;
        // clamp to viewport
        lx = Math.min(Math.max(lx, 8), W - c.w - 22);
        ly = Math.min(Math.max(ly, 56), H - 86);
        c.el.style.transform = 'translate3d(' + lx + 'px,' + ly + 'px,0)';
        c.el.style.opacity = String(vis);
        c.line.setAttribute('x1', String(sx));
        c.line.setAttribute('y1', String(sy));
        c.line.setAttribute('x2', String(dx >= 0 ? lx : lx + c.w));
        c.line.setAttribute('y2', String(ly + 16));
        c.line.setAttribute('opacity', String(vis * 0.8));
        c.dot.setAttribute('cx', String(sx));
        c.dot.setAttribute('cy', String(sy));
        c.dot.setAttribute('opacity', String(vis));
      });
    }

    /* ================= altimeter ================= */
    const tickEls: HTMLButtonElement[] = [];
    for (let i = 0; i < N; i++) {
      const b = document.createElement('button');
      b.style.top = (i / (N - 1)) * 100 + '%';
      b.title = ['Hero', 'My Story', 'Ch.1 Freelance', 'Ch.2 Pirates Alert', 'Ch.3 Irislogic', 'Ch.4 Delivery Solutions', 'Suit Schematic', 'Uplink'][i];
      b.addEventListener('click', () => {
        const mid = (RANGES[i][0] + RANGES[i][1]) / 2;
        scroller.scrollTo({ top: mid * maxScroll(), behavior: 'smooth' });
      });
      altTicks.appendChild(b);
      tickEls.push(b);
    }

    /* ================= scroll state (SMOOTHED) ================= */
    const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
    let targetP = 0; // raw scroll position (the goal)
    let p = 0; // rendered progress (eases toward targetP)
    function readScroll() {
      targetP = Math.min(Math.max(scroller.scrollTop / Math.max(maxScroll(), 1), 0), 1);
    }
    // restore last position
    try {
      const saved = parseFloat(localStorage.getItem('flight-scroll') || '');
      if (!isNaN(saved) && saved > 0.01) {
        requestAnimationFrame(() => scroller.scrollTo(0, saved * maxScroll()));
        p = saved; // start rendered progress at the restored point (no long catch-up sweep)
      }
    } catch {
      /* ignore */
    }
    let saveT = 0;
    const onScroll = () => {
      readScroll();
      const now = performance.now();
      if (now - saveT > 400) {
        saveT = now;
        try {
          localStorage.setItem('flight-scroll', targetP.toFixed(4));
        } catch {
          /* ignore */
        }
      }
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });

    /* ================= manual scroll drivers =================
       The whole stage (canvas + chapters + panels) is position:fixed, and a
       fixed element's scroll container is the viewport — NOT #scroller. So a
       wheel/touch over any of them would scroll the (unscrollable) root and
       nothing would move. We intercept the input and drive #scroller directly,
       so scrolling works no matter what's under the pointer/finger. */
    const applyDelta = (dy: number) => {
      const max = maxScroll();
      scroller.scrollTop = Math.min(Math.max(scroller.scrollTop + dy, 0), max);
      readScroll(); // feed the engine immediately (don't wait for the scroll event)
    };
    const onWheel = (e: WheelEvent) => {
      // deltaMode: 0=pixel, 1=line, 2=page — normalise to pixels
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? scroller.clientHeight : 1;
      applyDelta(e.deltaY * unit);
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: false });

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      applyDelta(touchY - y);
      touchY = y;
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      const page = scroller.clientHeight * 0.9;
      const map: Record<string, number> = {
        ArrowDown: 80, ArrowUp: -80, PageDown: page, PageUp: -page, ' ': page, Spacebar: page,
        Home: -maxScroll(), End: maxScroll(),
      };
      if (e.key in map && !(e.target instanceof HTMLAnchorElement)) {
        applyDelta(map[e.key]);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);

    /* ================= resize ================= */
    function resize() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * 7.5;
      const halfW = halfH * camera.aspect;
      mobile = camera.aspect < 0.95;
      sideX = Math.min(halfW * 0.46, 2.7);
      callouts.forEach((c) => {
        c.w = 0;
      });
    }
    window.addEventListener('resize', resize);
    resize();
    readScroll();

    /* ================= main loop ================= */
    const cur = new THREE.Vector3(0, 0.95, -4.6);
    let curS = 0.9;
    let lastT = performance.now();
    let rafId = 0;
    let firstFramePainted = false;

    function frame(now: number) {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const t = now / 1000;

      // SMOOTHED SCROLL — rendered progress eases toward the scroll target.
      p += (targetP - p) * (REDUCED ? 1 : SCROLL_EASE);
      if (Math.abs(targetP - p) < 0.0002) p = targetP;

      const tgt = targetAt(p);
      const f = explodeAt(p);

      // ease the suit toward its anchor
      const ease = REDUCED ? 1 : 0.085;
      cur.x += (tgt.x - cur.x) * ease;
      cur.y += (tgt.y - cur.y) * ease;
      cur.z += (tgt.z - cur.z) * ease;
      curS += (tgt.s - curS) * ease;

      const speed = Math.min(new THREE.Vector3(tgt.x, tgt.y, tgt.z).sub(cur).length() * 0.6, 1);

      suit.group.position.copy(cur);
      if (!REDUCED) suit.group.position.y += Math.sin(t * 1.9) * 0.05 * (1 - speed) * (1 - f);
      suit.group.scale.setScalar(BASE_SCALE * curS);

      // banking + lean while flying; calm face-camera while exploded
      const bank = Math.max(-0.5, Math.min(0.5, (tgt.x - cur.x) * -0.35));
      suit.group.rotation.z += ((1 - f) * bank - suit.group.rotation.z) * 0.1;
      suit.group.rotation.x += ((1 - f) * speed * -0.28 - suit.group.rotation.x) * 0.1;
      suit.group.rotation.y +=
        ((f > 0.05 ? Math.sin(t * 0.45) * 0.16 : Math.sin(t * 0.3) * 0.07) - suit.group.rotation.y) * 0.05;

      suit.setExplode(f);
      suit.update(t, speed);

      // thruster particles
      if (!REDUCED) {
        const rate = f > 0.3 ? 0 : 0.5 + speed * 3.5;
        let acc = (frame as unknown as { _acc?: number })._acc || 0;
        acc += rate;
        while (acc >= 1) {
          spawn(suit.parts.legL.userData.boot, 1, speed);
          spawn(suit.parts.legR.userData.boot, 1, speed);
          acc -= 1;
        }
        (frame as unknown as { _acc?: number })._acc = acc;
        stepParticles(dt);
      }

      // slow star drift
      if (!REDUCED) stars.rotation.y = t * 0.005;

      // overlays — the section stays pointer-transparent (so it never eats the
      // wheel); only the visible chapter's .inner panel takes pointer events.
      for (let i = 0; i < N; i++) {
        const o = chapterOpacity(i, p);
        chapters[i].style.opacity = String(o);
        chapterInners[i].style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      }
      scrollHint.style.opacity = p < 0.02 ? '1' : '0';
      scrollHint.style.visibility = p < 0.02 ? 'visible' : 'hidden';

      // altimeter
      altFill.style.height = p * 100 + '%';
      tickEls.forEach((b, i) => b.classList.toggle('on', tgt.i === i));
      onTick?.(tgt.i);

      updateCallouts(f);

      renderer.render(scene, camera);

      if (!firstFramePainted) {
        firstFramePainted = true;
        onReady?.();
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    /* ================= cleanup ================= */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      scroller.removeEventListener('scroll', onScroll);
      callouts.forEach((c) => {
        c.el.remove();
        c.line.remove();
        c.dot.remove();
      });
      tickEls.forEach((b) => b.remove());
      suit.dispose();
      starGeo.dispose();
      starMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
