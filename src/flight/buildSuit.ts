/* buildSuit.ts — "Mark-BM" holographic suit, TypeScript ESM port of the
   original suit.js. Smooth solid armor shaded with a fresnel hologram shader
   (bright cyan rims, deep-blue body, animated scanlines) — a JARVIS-projection
   look, not a wireframe toy.

   Part-group names (helmet, torso, reactor, armL/armR, legL/legR) are kept
   stable so the explode + callout choreography in useFlightEngine works
   unchanged, and so a real GLB suit can be swapped in later. */
import * as THREE from 'three';

export interface SuitParts {
  helmet: THREE.Group;
  torso: THREE.Group;
  reactor: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
}

export interface Suit {
  group: THREE.Group;
  parts: SuitParts;
  setExplode: (f: number) => void;
  update: (t: number, intensity: number) => void;
  glowTexture: THREE.CanvasTexture;
  dispose: () => void;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

interface HoloOpts {
  opacity?: number;
  scan?: number;
}

export function buildSuit(): Suit {
  const tex = glowTexture();
  const shaderMats: THREE.ShaderMaterial[] = [];
  const disposables: { dispose: () => void }[] = [tex];

  /* ---- fresnel hologram material ---- */
  function holoMat(baseHex: number, rimHex: number, opts: HoloOpts = {}): THREE.ShaderMaterial {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(baseHex) },
        uRim: { value: new THREE.Color(rimHex) },
        uOp: { value: opts.opacity != null ? opts.opacity : 0.32 },
        uTime: { value: 0 },
        uScan: { value: opts.scan != null ? opts.scan : 1.0 },
      },
      vertexShader: [
        'varying vec3 vN; varying vec3 vV; varying vec3 vW;',
        'void main(){',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vN = normalize(normalMatrix * normal);',
        '  vV = normalize(-mv.xyz);',
        '  vW = (modelMatrix * vec4(position, 1.0)).xyz;',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor; uniform vec3 uRim; uniform float uOp; uniform float uTime; uniform float uScan;',
        'varying vec3 vN; varying vec3 vV; varying vec3 vW;',
        'void main(){',
        '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);',
        '  float scan = mix(1.0, 0.82 + 0.18 * sin(vW.y * 46.0 - uTime * 2.4), uScan);',
        '  float flick = 0.97 + 0.03 * sin(uTime * 23.0);',
        '  vec3 c = (uColor * 0.42 + uRim * f * 1.35) * scan * flick;',
        '  float a = clamp(uOp + f * 0.95, 0.0, 1.0);',
        '  gl_FragColor = vec4(c, a);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    shaderMats.push(m);
    disposables.push(m);
    return m;
  }

  const BLUE = () => holoMat(0x0a4a66, 0x00d4ff);
  const GOLD = () => holoMat(0x6b4a00, 0xffc107);

  function sprite(color: number, size: number, opacity?: number): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      opacity: opacity != null ? opacity : 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(mat);
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    return s;
  }

  function part(name: string, x: number, y: number, z: number): THREE.Group {
    const p = new THREE.Group();
    p.name = name;
    p.position.set(x, y, z);
    p.userData.home = new THREE.Vector3(x, y, z);
    return p;
  }

  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x?: number, y?: number, z?: number): THREE.Mesh {
    disposables.push(geo);
    const m = new THREE.Mesh(geo, mat);
    if (x != null) m.position.set(x, y!, z!);
    return m;
  }

  const suit = new THREE.Group();
  const parts = {} as SuitParts;

  /* ================= HELMET ================= */
  const helmet = part('helmet', 0, 1.32, 0);
  const skull = mesh(new THREE.SphereGeometry(0.4, 48, 36), BLUE());
  skull.scale.set(0.92, 1.1, 0.98);
  helmet.add(skull);
  // gold faceplate — front segment of the skull
  const face = mesh(
    new THREE.SphereGeometry(0.408, 48, 36, Math.PI / 2 - Math.PI / 2.9, (2 * Math.PI) / 2.9, Math.PI / 3.4, Math.PI / 2.5),
    GOLD()
  );
  face.scale.set(0.92, 1.1, 0.98);
  helmet.add(face);
  // eyes
  [-0.135, 0.135].forEach((ex) => {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xeaffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    disposables.push(eyeMat);
    const eye = mesh(new THREE.PlaneGeometry(0.115, 0.036), eyeMat, ex, 0.07, 0.4);
    helmet.add(eye);
    const eg = sprite(0x00f5ff, 0.22, 0.85);
    eg.position.set(ex, 0.07, 0.42);
    helmet.add(eg);
  });
  // neck
  helmet.add(mesh(new THREE.CylinderGeometry(0.155, 0.175, 0.2, 24), BLUE(), 0, -0.44, 0));
  suit.add(helmet);
  parts.helmet = helmet;

  /* ================= TORSO ================= */
  const torso = part('torso', 0, 0.3, 0);
  const profile = [
    new THREE.Vector2(0.205, 0.76),
    new THREE.Vector2(0.42, 0.68),
    new THREE.Vector2(0.52, 0.52),
    new THREE.Vector2(0.5, 0.3),
    new THREE.Vector2(0.42, 0.04),
    new THREE.Vector2(0.31, -0.26),
    new THREE.Vector2(0.33, -0.5),
    new THREE.Vector2(0.4, -0.68),
    new THREE.Vector2(0.34, -0.84),
    new THREE.Vector2(0.2, -0.9),
  ];
  const body = mesh(new THREE.LatheGeometry(profile, 48), BLUE());
  body.scale.set(1, 1, 0.74);
  torso.add(body);
  // abdomen accent band
  const band = mesh(new THREE.TorusGeometry(0.315, 0.022, 12, 40), GOLD(), 0, -0.26, 0);
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 0.74, 1);
  torso.add(band);
  // shoulder pauldrons
  [-0.58, 0.58].forEach((sx) => {
    const sh = mesh(new THREE.SphereGeometry(0.235, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.8), GOLD(), sx, 0.6, 0);
    sh.rotation.z = sx < 0 ? 0.35 : -0.35;
    torso.add(sh);
  });
  suit.add(torso);
  parts.torso = torso;

  /* ================= ARC REACTOR ================= */
  const reactor = part('reactor', 0, 0.62, 0.38);
  const ring = mesh(new THREE.TorusGeometry(0.15, 0.028, 16, 40), holoMat(0x6b4a00, 0xffc107, { opacity: 0.55, scan: 0 }));
  reactor.add(ring);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xeaffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  disposables.push(coreMat);
  const core = mesh(new THREE.CircleGeometry(0.1, 32), coreMat, 0, 0, 0.012);
  reactor.add(core);
  const rGlow = sprite(0x00f5ff, 0.8);
  reactor.add(rGlow);
  const rGlow2 = sprite(0xffc107, 1.35, 0.32);
  reactor.add(rGlow2);
  suit.add(reactor);
  parts.reactor = reactor;

  /* ================= ARMS ================= */
  function arm(side: number): THREE.Group {
    const a = part(side < 0 ? 'armL' : 'armR', side * 0.7, 0.78, 0);
    a.rotation.z = side * -0.16;
    a.add(mesh(new THREE.CylinderGeometry(0.112, 0.092, 0.54, 24), BLUE(), 0, -0.3, 0)); // upper
    a.add(mesh(new THREE.SphereGeometry(0.103, 24, 18), BLUE(), 0, -0.61, 0)); // elbow
    a.add(mesh(new THREE.CylinderGeometry(0.092, 0.148, 0.54, 24), GOLD(), 0, -0.93, 0)); // gauntlet
    const fist = mesh(new THREE.SphereGeometry(0.115, 24, 18), BLUE(), 0, -1.26, 0);
    fist.scale.set(1, 1.12, 1);
    a.add(fist);
    // palm repulsor
    const palmMat = new THREE.MeshBasicMaterial({ color: 0xeaffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    disposables.push(palmMat);
    const palm = mesh(new THREE.CircleGeometry(0.065, 24), palmMat, 0, -1.385, 0);
    palm.rotation.x = -Math.PI / 2;
    a.add(palm);
    const pg = sprite(0x00f5ff, 0.34, 0.8);
    pg.position.set(0, -1.4, 0);
    a.add(pg);
    const anchor = new THREE.Object3D();
    anchor.name = 'palmAnchor';
    anchor.position.set(0, -1.4, 0);
    a.add(anchor);
    a.userData.palm = anchor;
    return a;
  }
  const armL = arm(-1);
  const armR = arm(1);
  suit.add(armL);
  suit.add(armR);
  parts.armL = armL;
  parts.armR = armR;

  /* ================= LEGS ================= */
  function leg(side: number): THREE.Group {
    const l = part(side < 0 ? 'legL' : 'legR', side * 0.26, -0.62, 0);
    l.add(mesh(new THREE.CylinderGeometry(0.158, 0.122, 0.62, 24), BLUE(), 0, -0.34, 0)); // thigh
    l.add(mesh(new THREE.SphereGeometry(0.118, 24, 18), BLUE(), 0, -0.7, 0)); // knee
    l.add(mesh(new THREE.CylinderGeometry(0.118, 0.158, 0.6, 24), BLUE(), 0, -1.05, 0)); // shin
    // boot — beveled wedge
    const boot = mesh(new THREE.CylinderGeometry(0.155, 0.185, 0.2, 4, 1), GOLD(), 0, -1.45, 0.07);
    boot.rotation.y = Math.PI / 4;
    boot.scale.set(0.9, 1, 1.55);
    l.add(boot);
    const tg = sprite(0x00f5ff, 0.5);
    tg.position.set(0, -1.6, 0);
    l.add(tg);
    l.userData.thrusterGlow = tg;
    const anchor = new THREE.Object3D();
    anchor.name = 'bootAnchor';
    anchor.position.set(0, -1.64, 0);
    l.add(anchor);
    l.userData.boot = anchor;
    return l;
  }
  const legL = leg(-1);
  const legR = leg(1);
  suit.add(legL);
  suit.add(legR);
  parts.legL = legL;
  parts.legR = legR;

  /* ================= exploded offsets ================= */
  const EXPLODE: Record<keyof SuitParts, THREE.Vector3> = {
    helmet: new THREE.Vector3(0, 0.65, 0),
    torso: new THREE.Vector3(0, 0.05, -1.0),
    reactor: new THREE.Vector3(0, 0.2, 1.9),
    armL: new THREE.Vector3(-1.5, 0.3, 0.3),
    armR: new THREE.Vector3(1.5, 0.3, 0.3),
    legL: new THREE.Vector3(-0.8, -0.55, 0.2),
    legR: new THREE.Vector3(0.8, -0.55, 0.2),
  };

  function setExplode(f: number): void {
    (Object.keys(parts) as (keyof SuitParts)[]).forEach((k) => {
      const p = parts[k];
      p.position.copy(p.userData.home).addScaledVector(EXPLODE[k], f);
      p.rotation.y = f * (k === 'torso' ? -0.35 : 0.45);
      if (k === 'armL') p.rotation.z = -0.16 - f * 0.5;
      if (k === 'armR') p.rotation.z = 0.16 + f * 0.5;
    });
  }

  function update(t: number, intensity: number): void {
    for (let i = 0; i < shaderMats.length; i++) shaderMats[i].uniforms.uTime.value = t;
    const s = 0.8 + Math.sin(t * 3) * 0.07;
    rGlow.scale.set(s, s, 1);
    const s2 = 1.35 + Math.sin(t * 1.8) * 0.1;
    rGlow2.scale.set(s2, s2, 1);
    [legL, legR].forEach((l) => {
      const g = l.userData.thrusterGlow as THREE.Sprite;
      const k = 0.3 + intensity * 0.85 + Math.sin(t * 17 + l.position.x) * 0.06;
      g.scale.set(k, k * (1 + intensity * 1.6), 1);
      (g.material as THREE.SpriteMaterial).opacity = 0.5 + intensity * 0.45;
    });
  }

  function dispose(): void {
    disposables.forEach((d) => d.dispose());
  }

  return { group: suit, parts, setExplode, update, glowTexture: tex, dispose };
}
