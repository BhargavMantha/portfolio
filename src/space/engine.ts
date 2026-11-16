/* engine.ts — the flight game. Owns the renderer, the scene, the ship's flight
   model, autopilot, docking and skill pickups. React never touches Three.js
   directly: it calls the small public API below and listens to the hooks.
   Per-frame DOM work (planet labels, the guide arrow) is written straight to
   elements React hands over, so the 60 fps loop never causes React renders. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  buildBeacon,
  buildDust,
  buildExhaust,
  buildNebula,
  buildOrb,
  buildPlanet,
  buildShip,
  buildStars,
  buildStation,
  glowTexture,
  type PlanetLook,
} from './world';

type PlaceKind = 'planet' | 'station' | 'beacon';
interface Place {
  pos: THREE.Vector3;
  radius: number;
  kind: PlaceKind;
  look?: PlanetLook;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** One place per stop in content.ts, in the same order. */
const PLACES: Place[] = [
  { pos: v(70, 14, -240), radius: 30, kind: 'planet', look: { radius: 30, c1: '#1d4f7a', c2: '#5fa8d6', c3: '#dff3ff', rim: '#87ceeb', bands: 0.15, ring: true, tilt: 0.3 } },
  { pos: v(-95, -24, -480), radius: 16, kind: 'planet', look: { radius: 16, c1: '#4d2c22', c2: '#c27d55', c3: '#f6c9a4', rim: '#f6b98e', bands: 0 } },
  { pos: v(90, 32, -730), radius: 22, kind: 'planet', look: { radius: 22, c1: '#55263f', c2: '#c46e8d', c3: '#f7c6d4', rim: '#eea8b9', bands: 0.35, moon: true } },
  { pos: v(-130, 0, -1010), radius: 42, kind: 'planet', look: { radius: 42, c1: '#262c66', c2: '#6c7cd4', c3: '#d7dcff', rim: '#9fb4ff', bands: 1, bandFreq: 11 } },
  { pos: v(100, -28, -1320), radius: 48, kind: 'planet', look: { radius: 48, c1: '#123a63', c2: '#4f9fd0', c3: '#f2f8ff', rim: '#87ceeb', bands: 0.75, bandFreq: 7, ring: true, tilt: -0.25, moon: true } },
  { pos: v(-40, 36, -1600), radius: 30, kind: 'station' },
  { pos: v(0, 0, -1880), radius: 20, kind: 'beacon' },
];

export const STOP_COUNT = PLACES.length;

export type Mode = 'intro' | 'fly';

export interface EngineHooks {
  onReady: () => void;
  onDock: (index: number | null) => void;
  onCollect: (skill: number) => void;
  onAutopilot: (target: number | null) => void;
  /** The player touched the controls (used to close the intro). */
  onManualInput: () => void;
}

export interface EngineDom {
  labels: HTMLElement[];
  guide: HTMLElement;
  guideDist: HTMLElement;
}

const FLIGHT_KEYS = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

export class SpaceEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(58, 1, 0.5, 9000);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private ready = false;

  private mode: Mode = 'intro';
  private viewShift = -0.18;
  private tex = glowTexture();

  // world
  private nebula = buildNebula();
  private stars = buildStars();
  private dust = buildDust();
  private exhaust = buildExhaust();
  private updaters: ((t: number) => void)[] = [];
  private dockPoints: THREE.Vector3[] = [];
  private dockZones: number[] = [];
  private orbs: { group: THREE.Group; pos: THREE.Vector3; taken: boolean; fade: number }[] = [];

  // ship state
  private ship = buildShip(this.tex);
  private pos = new THREE.Vector3(0, 0, 0);
  private yaw = 0;
  private pitch = 0;
  private speed = 0;
  private yawRate = 0;
  private forward = new THREE.Vector3(0, 0, -1);

  // control state
  private keys = new Set<string>();
  private dragging = false;
  private pointer = new THREE.Vector2();
  private autopilot: number | null = null;
  private docked: number | null = null;
  private guide: number | null = null;

  // camera state
  private camPos = new THREE.Vector3(10, 4, -12);
  private camLook = new THREE.Vector3();

  // scratch
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement, private hooks: EngineHooks, private dom: EngineDom) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.84);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildScene();
    this.bind();
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  /* --------------------------------------------------------- public API */

  setMode(mode: Mode) {
    this.mode = mode;
  }

  /** Autopilot to a stop. */
  flyTo(index: number) {
    if (index < 0 || index >= PLACES.length) return;
    this.autopilot = index;
    this.hooks.onAutopilot(index);
  }

  /** Which stop the on-screen arrow should point at. */
  setGuide(index: number | null) {
    this.guide = index;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.tex.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  /* ------------------------------------------------------------- scene */

  private buildScene() {
    const s = this.scene;
    s.add(this.nebula, this.stars, this.dust, this.exhaust.points);

    const sunDir = new THREE.Vector3(0.55, 0.45, 0.7).normalize();
    s.add(new THREE.HemisphereLight('#bfe3ff', '#0a1426', 0.55));
    const sun = new THREE.DirectionalLight('#ffffff', 2.4);
    sun.position.copy(sunDir).multiplyScalar(100);
    s.add(sun);
    const rim = new THREE.DirectionalLight('#87ceeb', 1.2);
    rim.position.set(-60, 20, -80);
    s.add(rim);

    let prev = new THREE.Vector3(0, 0, 0);
    PLACES.forEach((p) => {
      if (p.kind === 'planet' && p.look) {
        const planet = buildPlanet(p.look, sunDir);
        planet.group.position.copy(p.pos);
        s.add(planet.group);
        this.updaters.push(planet.update);
      } else if (p.kind === 'station') {
        const st = buildStation(p.radius);
        st.group.position.copy(p.pos);
        s.add(st.group);
        this.updaters.push(st.update);
      } else {
        const b = buildBeacon(p.radius * 0.45, this.tex);
        b.group.position.copy(p.pos);
        s.add(b.group);
        this.updaters.push(b.update);
      }
      // dock on the approach side, a little above the equator to clear rings
      const dir = this.tmp.copy(prev).sub(p.pos).add(new THREE.Vector3(0, p.radius * 0.6, 0)).normalize();
      const dist = p.kind === 'beacon' ? p.radius * 2.2 : p.radius * 2.0 + 18;
      const dock = p.pos.clone().addScaledVector(dir, dist);
      this.dockPoints.push(dock);
      this.dockZones.push(dist + 34);

      // a skill orb halfway along each leg, right on the autopilot line
      const orbPos = prev.clone().lerp(dock, 0.5);
      const orb = buildOrb(this.tex);
      orb.position.copy(orbPos);
      s.add(orb);
      this.orbs.push({ group: orb, pos: orbPos, taken: false, fade: 0 });

      prev = dock;
    });

    this.ship.root.position.copy(this.pos);
    s.add(this.ship.root);
  }

  /* ------------------------------------------------------------- input */

  private bind() {
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private manual() {
    if (this.autopilot !== null) {
      this.autopilot = null;
      this.hooks.onAutopilot(null);
    }
    this.hooks.onManualInput();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!FLIGHT_KEYS.has(e.code)) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    this.keys.add(e.code);
    this.manual();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.dragging = false;
  };

  private setPointer(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== 'fly') return;
    this.dragging = true;
    this.setPointer(e);
    this.manual();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.dragging) this.setPointer(e);
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const px = this.renderer.getPixelRatio();
    (this.stars.material as THREE.ShaderMaterial).uniforms.uPx.value = px;
    (this.dust.material as THREE.ShaderMaterial).uniforms.uPx.value = px;
    (this.exhaust.points.material as THREE.ShaderMaterial).uniforms.uPx.value = px * (h / 900);
  };

  /* -------------------------------------------------------------- loop */

  private frame = () => {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.fly(dt, t);
    this.updateWorld(dt, t);
    this.updateCamera(dt, t);
    this.updateDom();

    this.composer.render();
    if (!this.ready) {
      this.ready = true;
      this.hooks.onReady();
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private fly(dt: number, t: number) {
    const k = this.keys;
    const boost = k.has('ShiftLeft') || k.has('ShiftRight');
    let yawIn = 0;
    let pitchIn = 0;
    let thrust = false;
    let brake = false;

    if (this.mode === 'fly' && this.autopilot === null) {
      if (k.has('KeyA') || k.has('ArrowLeft')) yawIn += 1;
      if (k.has('KeyD') || k.has('ArrowRight')) yawIn -= 1;
      if (k.has('KeyE')) pitchIn += 1;
      if (k.has('KeyQ')) pitchIn -= 1;
      if (k.has('KeyW') || k.has('ArrowUp')) thrust = true;
      if (k.has('KeyS') || k.has('ArrowDown')) brake = true;
      if (this.dragging) {
        yawIn += -this.pointer.x * 1.3;
        pitchIn += this.pointer.y * 1.1;
        thrust = true;
      }
    }

    let targetYawRate = 0;
    if (this.autopilot !== null) {
      const target = this.dockPoints[this.autopilot];
      const d = this.tmp.copy(target).sub(this.pos);
      const dist = d.length();
      d.divideScalar(Math.max(dist, 1e-3));
      const wantYaw = Math.atan2(-d.x, -d.z);
      const wantPitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
      targetYawRate = THREE.MathUtils.clamp(wrapAngle(wantYaw - this.yaw) * 2.4, -1.7, 1.7);
      this.pitch += THREE.MathUtils.clamp((wantPitch - this.pitch) * 2.4, -1.2, 1.2) * dt;
      const align = this.forward.dot(d);
      const want = Math.min(150, dist * 0.9 + 3) * THREE.MathUtils.smoothstep(align, 0.15, 0.9) + (align < 0.15 ? 6 : 0);
      this.speed += (want - this.speed) * damp(2.4, dt);
      if (dist < 3 || (dist < 10 && this.speed < 5)) {
        this.autopilot = null;
        this.hooks.onAutopilot(null);
      }
    } else {
      targetYawRate = yawIn * 1.5;
      this.pitch += pitchIn * 1.0 * dt;
      if (pitchIn === 0) this.pitch *= Math.exp(-0.25 * dt);
      const max = boost ? 200 : 95;
      if (thrust) this.speed += 70 * (boost ? 2.2 : 1) * dt;
      if (brake) this.speed -= 120 * dt;
      if (!thrust && !brake) this.speed *= Math.exp(-0.7 * dt);
      if (this.speed > max) this.speed -= 90 * dt;
      this.speed = Math.max(0, this.speed);

      // parked at a stop: turn gently to face it
      if (this.docked !== null && this.speed < 6 && yawIn === 0 && pitchIn === 0) {
        const d = this.tmp.copy(PLACES[this.docked].pos).sub(this.pos).normalize();
        targetYawRate = THREE.MathUtils.clamp(wrapAngle(Math.atan2(-d.x, -d.z) - this.yaw) * 1.2, -0.6, 0.6);
        this.pitch += (Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) * 0.6 - this.pitch) * damp(1.0, dt);
      }
    }

    this.yawRate += (targetYawRate - this.yawRate) * damp(6, dt);
    this.yaw = wrapAngle(this.yaw + this.yawRate * dt);
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.1, 1.1);

    const cp = Math.cos(this.pitch);
    this.forward.set(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    this.pos.addScaledVector(this.forward, this.speed * dt);
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -900, 900);
    this.pos.y = THREE.MathUtils.clamp(this.pos.y, -600, 600);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -2600, 500);

    const root = this.ship.root;
    root.position.copy(this.pos);
    root.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    const body = this.ship.body;
    body.rotation.z += (THREE.MathUtils.clamp(this.yawRate * 0.55, -0.75, 0.75) - body.rotation.z) * damp(4, dt);
    const idle = 1 - THREE.MathUtils.clamp(this.speed / 20, 0, 1);
    body.position.y = Math.sin(t * 1.6) * 0.3 * idle;

    const throttle = THREE.MathUtils.clamp(this.speed / 120, 0, 1.6);
    this.ship.setThrottle(this.mode === 'intro' ? 0.35 : throttle + (thrust ? 0.3 : 0));

    // exhaust particles
    root.updateMatrixWorld();
    const n = this.speed > 2 ? (throttle > 0.6 ? 3 : 1) : 0;
    for (const nz of this.ship.nozzles) {
      for (let i = 0; i < n; i++) {
        const wp = this.tmp2.copy(nz).applyMatrix4(body.matrixWorld);
        // particles stay put in world space while the ship moves on, so the trail length follows speed
        const vel = this.tmp.copy(this.forward).multiplyScalar(-(10 + this.speed * 0.15));
        vel.x += (Math.random() - 0.5) * 3;
        vel.y += (Math.random() - 0.5) * 3;
        this.exhaust.emit(wp, vel);
      }
    }
  }

  private updateWorld(dt: number, t: number) {
    for (const u of this.updaters) u(t);
    this.exhaust.update(dt);
    (this.nebula.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.stars.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    const dm = (this.dust.material as THREE.ShaderMaterial).uniforms;
    dm.uCam.value.copy(this.camera.position);
    dm.uSpeed.value = this.speed / 120;

    // backdrop follows the camera so space never ends
    this.nebula.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);

    // skill orbs
    this.orbs.forEach((o, i) => {
      if (o.taken) {
        if (o.fade < 1) {
          // shrink into the ship rather than growing, so nothing balloons in front of the camera
          o.fade = Math.min(1, o.fade + dt * 4);
          o.group.position.lerp(this.pos, damp(10, dt));
          o.group.scale.setScalar(Math.max(0.001, 1 - o.fade));
          o.group.traverse((c) => {
            const m = (c as THREE.Mesh).material as THREE.Material & { opacity?: number };
            if (m && 'opacity' in m) {
              m.transparent = true;
              m.opacity = 1 - o.fade;
            }
          });
          if (o.fade >= 1) o.group.visible = false;
        }
        return;
      }
      const d = o.group.position.distanceTo(this.pos);
      if (d < 55 && this.mode === 'fly') {
        // within range the orb is pulled to the ship, so near misses still count
        o.group.position.lerp(this.pos, damp(3.5, dt));
      } else {
        o.group.position.set(o.pos.x, o.pos.y + Math.sin(t * 1.4 + i) * 1.2, o.pos.z);
      }
      o.group.rotation.y = t * 0.9 + i;
      o.group.rotation.x = t * 0.5;
      if (d < 7) {
        o.taken = true;
        this.hooks.onCollect(i);
      }
    });

    // docking
    let near: number | null = null;
    let best = Infinity;
    PLACES.forEach((p, i) => {
      const d = this.pos.distanceTo(p.pos);
      if (d < this.dockZones[i] && d < best) {
        best = d;
        near = i;
      }
    });
    if (near !== this.docked) {
      this.docked = near;
      this.hooks.onDock(near);
    }
  }

  private updateCamera(dt: number, t: number) {
    const cam = this.camera;
    let wantShift = 0;
    if (this.mode === 'intro') {
      const a = Math.PI * 0.8 + Math.sin(t * 0.15) * 0.2;
      this.tmp.set(Math.sin(a) * 15, 3.6 + Math.sin(t * 0.3) * 0.6, Math.cos(a) * 15).add(this.pos);
      this.camPos.lerp(this.tmp, damp(1.2, dt));
      this.tmp2.copy(this.pos).add(new THREE.Vector3(0, 0.6, 0));
      this.camLook.lerp(this.tmp2, damp(2, dt));
      wantShift = -0.17;
    } else {
      const docked = this.docked !== null && this.autopilot === null && this.speed < 20;
      const back = 16 + THREE.MathUtils.clamp(this.speed / 200, 0, 1) * 8;
      this.tmp.set(docked ? 5 : 0, 4.2, back).applyEuler(new THREE.Euler(this.pitch * 0.6, this.yaw, 0, 'YXZ')).add(this.pos);
      // when the camera has far to travel (leaving the intro), arc up and over the ship instead of through it
      const gap = this.camPos.distanceTo(this.tmp);
      this.tmp.y += Math.min(gap * 0.5, 14);
      this.camPos.lerp(this.tmp, damp(3.2, dt));
      this.tmp2.copy(this.pos).addScaledVector(this.forward, 16).add(new THREE.Vector3(0, 1.4, 0));
      this.camLook.lerp(this.tmp2, damp(5, dt));
      wantShift = docked ? 0.16 : 0;
    }
    cam.position.copy(this.camPos);
    cam.lookAt(this.camLook);

    this.viewShift += (wantShift - this.viewShift) * damp(2.2, dt);
    const fov = 58 + THREE.MathUtils.clamp(this.speed / 200, 0, 1) * 12;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    cam.fov = fov;
    cam.setViewOffset(w, h, this.viewShift * w, 0, w, h);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  /* --------------------------------------------------------------- DOM */

  private project(world: THREE.Vector3) {
    const view = this.tmp.copy(world).applyMatrix4(this.camera.matrixWorldInverse);
    const behind = view.z > 0;
    const ndc = this.tmp2.copy(world).project(this.camera);
    return { x: ndc.x, y: ndc.y, behind };
  }

  private updateDom() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const flying = this.mode === 'fly';

    PLACES.forEach((p, i) => {
      const el = this.dom.labels[i];
      if (!el) return;
      const top = this.tmp.copy(p.pos);
      top.y += p.radius * (p.kind === 'beacon' ? 1.6 : 1.3) + 6;
      const pr = this.project(top);
      const dist = this.pos.distanceTo(p.pos);
      const relevant = dist < 650 || i === this.guide;
      const visible = flying && relevant && !pr.behind && Math.abs(pr.x) < 1.1 && Math.abs(pr.y) < 1.1 && this.docked !== i;
      const fade = THREE.MathUtils.clamp(1 - (dist - 500) / 700, 0.55, 1);
      const sy = ((1 - pr.y) / 2) * h;
      el.style.opacity = visible && sy > 90 && sy < h - 90 ? String(fade) : '0';
      el.style.transform = `translate(${((pr.x + 1) / 2) * w}px, ${((1 - pr.y) / 2) * h}px) translate(-50%, -100%)`;
    });

    const g = this.dom.guide;
    if (!flying || this.guide === null || this.docked === this.guide) {
      g.style.opacity = '0';
      return;
    }
    const target = this.dockPoints[this.guide];
    const pr = this.project(target);
    const dist = this.pos.distanceTo(target);
    this.dom.guideDist.textContent = dist > 1000 ? `${(dist / 100).toFixed(1)}k km` : `${Math.round(dist * 10)} km`;
    let x = pr.x;
    let y = pr.y;
    const onScreen = !pr.behind && Math.abs(x) < 0.9 && Math.abs(y) < 0.82;
    if (onScreen) {
      g.classList.add('on');
      g.style.transform = `translate(${((x + 1) / 2) * w}px, ${((1 - y) / 2) * h}px)`;
      g.style.setProperty('--rot', '0deg');
    } else {
      if (pr.behind) {
        x = -x;
        y = -y;
        if (Math.abs(x) < 1e-3 && Math.abs(y) < 1e-3) y = -1;
      }
      const ang = Math.atan2(y * h, x * w);
      const rx = w * 0.44;
      const ry = h * 0.4;
      g.classList.remove('on');
      g.style.transform = `translate(${w / 2 + Math.cos(ang) * rx}px, ${h / 2 - Math.sin(ang) * ry}px)`;
      g.style.setProperty('--rot', `${-ang}rad`);
    }
    g.style.opacity = '1';
  }
}
