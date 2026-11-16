/* world.ts — builders for everything in the scene. All geometry is procedural
   (no model downloads), so the page loads fast and works offline from cache.

   Conventions: the ship faces -Z. Planet shaders take the sun direction in
   world space. Colours stay in the navy / sky-blue family plus warm pastels;
   there is deliberately no green anywhere. */
import * as THREE from 'three';

export const SKY = new THREE.Color('#87ceeb');

/* ---------------------------------------------------------------- noise */
const NOISE_GLSL = /* glsl */ `
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`;

/* -------------------------------------------------------------- texture */
export function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,.6)');
  g.addColorStop(0.5, 'rgba(255,255,255,.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------ backdrop */
export function buildNebula(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir; uniform float uTime;
      ${NOISE_GLSL}
      void main(){
        vec3 d = normalize(vDir);
        vec3 base = mix(vec3(0.012, 0.024, 0.055), vec3(0.035, 0.06, 0.13), smoothstep(-0.6, 0.8, d.y));
        float n1 = fbm(d * 2.2 + vec3(0.0, uTime * 0.004, 0.0));
        float n2 = fbm(d * 3.6 + vec3(5.2, 1.3, 2.0));
        vec3 sky = vec3(0.32, 0.62, 0.85) * pow(smoothstep(0.45, 0.85, n1), 2.2) * 0.55;
        vec3 lav = vec3(0.42, 0.36, 0.78) * pow(smoothstep(0.5, 0.9, n2), 2.4) * 0.45;
        gl_FragColor = vec4(base + sky + lav, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(6000, 48, 24), mat);
  m.renderOrder = -2;
  m.frustumCulled = false;
  return m;
}

export function buildStars(count = 7000): THREE.Points {
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const tint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 4200 + Math.random() * 1400;
    const s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    size[i] = Math.random() < 0.04 ? 3.2 + Math.random() * 2.5 : 0.8 + Math.random() * 1.6;
    phase[i] = Math.random() * 6.283;
    tint[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aPhase; attribute float aTint;
      uniform float uTime; uniform float uPx; varying float vA; varying float vT;
      void main(){
        vA = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase); vT = aTint;
        gl_PointSize = aSize * uPx * 1.6;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying float vT;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 c = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.93, 0.85), step(0.82, vT));
        gl_FragColor = vec4(c, a * vA);
      }`,
  });
  const p = new THREE.Points(g, mat);
  p.frustumCulled = false;
  p.renderOrder = -1;
  return p;
}

/** Drifting dust that wraps around the camera — gives a sense of speed. */
export function buildDust(count = 1400, box = 420): THREE.Points {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * box;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uCam: { value: new THREE.Vector3() }, uBox: { value: box }, uPx: { value: 1 }, uSpeed: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform vec3 uCam; uniform float uBox; uniform float uPx; uniform float uSpeed; varying float vA;
      void main(){
        vec3 p = mod(position - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vA = smoothstep(uBox * 0.5, uBox * 0.15, dist) * smoothstep(2.0, 12.0, dist) * (0.35 + 0.65 * clamp(uSpeed, 0.0, 1.0));
        gl_PointSize = uPx * clamp(120.0 / dist, 1.0, 4.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.75, 0.9, 1.0, smoothstep(0.5, 0.1, d) * vA); }`,
  });
  const p = new THREE.Points(g, mat);
  p.frustumCulled = false;
  return p;
}

/* -------------------------------------------------------------- planets */
export interface PlanetLook {
  radius: number;
  c1: string;
  c2: string;
  c3: string;
  rim: string;
  /** 0 = rocky/cloudy noise, 1 = gas-giant bands. */
  bands: number;
  bandFreq?: number;
  ring?: boolean;
  moon?: boolean;
  tilt?: number;
}

export interface Planet {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
  update: (t: number) => void;
}

export function buildPlanet(look: PlanetLook, sunDir: THREE.Vector3): Planet {
  const group = new THREE.Group();
  const materials: THREE.ShaderMaterial[] = [];
  const surface = new THREE.ShaderMaterial({
    uniforms: {
      uC1: { value: new THREE.Color(look.c1) },
      uC2: { value: new THREE.Color(look.c2) },
      uC3: { value: new THREE.Color(look.c3) },
      uRim: { value: new THREE.Color(look.rim) },
      uSun: { value: sunDir },
      uBands: { value: look.bands },
      uFreq: { value: look.bandFreq ?? 9 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      void main(){
        vObj = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uRim; uniform vec3 uSun;
      uniform float uBands; uniform float uFreq; uniform float uTime;
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      ${NOISE_GLSL}
      void main(){
        vec3 p = normalize(vObj);
        float n = fbm(p * 3.2 + vec3(uTime * 0.012, 0.0, 0.0));
        float b = sin(p.y * uFreq + n * 5.0) * 0.5 + 0.5;
        float t = mix(n, b, uBands);
        vec3 col = mix(uC1, uC2, smoothstep(0.28, 0.62, t));
        col = mix(col, uC3, smoothstep(0.62, 0.9, t));
        vec3 N = normalize(vN);
        float light = 0.06 + 0.94 * smoothstep(-0.2, 1.0, dot(N, uSun));
        float fres = pow(1.0 - max(dot(N, normalize(vV)), 0.0), 3.0);
        col = col * light + uRim * fres * (0.25 + 0.75 * light);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  materials.push(surface);
  const body = new THREE.Mesh(new THREE.SphereGeometry(look.radius, 96, 64), surface);
  group.add(body);

  // atmosphere halo: back faces of a slightly larger sphere, additive
  const atmo = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(look.rim) } },
    vertexShader: /* glsl */ `
      varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec3 vN;
      void main(){ float i = pow(clamp(0.66 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0); gl_FragColor = vec4(uColor, 1.0) * i * 0.95; }`,
  });
  materials.push(atmo);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(look.radius * 1.2, 64, 32), atmo);
  group.add(halo);

  let ring: THREE.Mesh | null = null;
  if (look.ring) {
    const inner = look.radius * 1.45;
    const outer = look.radius * 2.35;
    const ringMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: { uIn: { value: inner }, uOut: { value: outer }, uC: { value: new THREE.Color(look.c3) }, uC2: { value: new THREE.Color(look.rim) } },
      vertexShader: /* glsl */ `varying float vR; void main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uIn; uniform float uOut; uniform vec3 uC; uniform vec3 uC2; varying float vR;
        float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
        void main(){
          float t = (vR - uIn) / (uOut - uIn);
          float k = floor(t * 60.0);
          float band = mix(h(k), h(k + 1.0), fract(t * 60.0));
          float a = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.9, t) * (0.25 + 0.6 * band);
          a *= 1.0 - smoothstep(0.42, 0.47, t) * smoothstep(0.53, 0.48, t) * 0.85; // the gap
          gl_FragColor = vec4(mix(uC, uC2, t), a * 0.8);
        }`,
    });
    materials.push(ringMat);
    ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160, 1), ringMat);
    ring.rotation.x = Math.PI / 2 - (look.tilt ?? 0.35);
    ring.rotation.y = 0.18;
    group.add(ring);
  }

  let moon: THREE.Mesh | null = null;
  if (look.moon) {
    const mm = new THREE.MeshStandardMaterial({ color: '#c9d6e6', roughness: 0.95, metalness: 0 });
    moon = new THREE.Mesh(new THREE.IcosahedronGeometry(look.radius * 0.22, 3), mm);
    group.add(moon);
  }

  group.rotation.z = look.tilt ?? 0;

  return {
    group,
    materials,
    update(t: number) {
      surface.uniforms.uTime.value = t;
      body.rotation.y = t * 0.03;
      if (moon) {
        const a = t * 0.18;
        moon.position.set(Math.cos(a) * look.radius * 2.1, Math.sin(a * 0.7) * look.radius * 0.3, Math.sin(a) * look.radius * 2.1);
      }
    },
  };
}

/* ------------------------------------------------------- skills station */
export function buildStation(scale: number): { group: THREE.Group; update: (t: number) => void } {
  const group = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: '#dbe6f2', metalness: 0.65, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1a2a44', metalness: 0.8, roughness: 0.4 });
  const glow = new THREE.MeshStandardMaterial({ color: '#0b1a2c', emissive: SKY, emissiveIntensity: 2.2 });
  const panel = new THREE.MeshStandardMaterial({ color: '#2c4f86', metalness: 0.4, roughness: 0.25, emissive: '#1b3c6e', emissiveIntensity: 0.35 });

  const spin = new THREE.Group();
  group.add(spin);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(scale, scale * 0.09, 24, 128), hull);
  spin.add(ring);
  const lights = new THREE.Mesh(new THREE.TorusGeometry(scale, scale * 0.025, 8, 128), glow);
  lights.position.z = scale * 0.085;
  spin.add(lights);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.025, scale * 0.025, scale * 2, 10), dark);
    spoke.rotation.z = (i * Math.PI) / 4;
    spin.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.22, 32, 16), hull);
  group.add(hub);
  const core = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.1, 24, 12), glow);
  core.position.z = scale * 0.2;
  group.add(core);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.05, scale * 0.05, scale * 1.4, 12), dark);
  mast.rotation.x = Math.PI / 2;
  group.add(mast);
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.z = side * scale * 0.55;
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.9, scale * 0.02, scale * 0.28), panel);
      p.position.x = s * scale * 0.55;
      arm.add(p);
    }
    group.add(arm);
  }
  group.rotation.x = 0.45;
  group.rotation.y = 0.6;
  return {
    group,
    update(t: number) {
      spin.rotation.z = t * 0.12;
    },
  };
}

/* ------------------------------------------------------- contact beacon */
export function buildBeacon(radius: number, tex: THREE.Texture): { group: THREE.Group; update: (t: number) => void } {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#d8f1ff').multiplyScalar(1.6) })
  );
  group.add(core);
  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, color: SKY, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  corona.scale.setScalar(radius * 7);
  group.add(corona);
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.6, radius * 0.03, 8, 128),
      new THREE.MeshBasicMaterial({ color: SKY, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    w.rotation.x = Math.PI / 2;
    group.add(w);
    waves.push(w);
  }
  return {
    group,
    update(t: number) {
      waves.forEach((w, i) => {
        const k = (t * 0.35 + i / 3) % 1;
        w.scale.setScalar(1 + k * 2.8);
        (w.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
      });
      corona.scale.setScalar(radius * (6.6 + Math.sin(t * 2) * 0.4));
    },
  };
}

/* ------------------------------------------------------------ skill orb */
export function buildOrb(tex: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, 0),
    new THREE.MeshStandardMaterial({ color: '#0c1d33', emissive: SKY, emissiveIntensity: 1.4, flatShading: true, transparent: true, opacity: 0.9 })
  );
  g.add(shell);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  g.add(core);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, color: SKY, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.setScalar(12);
  g.add(halo);
  return g;
}

/* ----------------------------------------------------------------- ship */
export interface Ship {
  /** Moves and rotates with flight. */
  root: THREE.Group;
  /** Child used for banking and hover bob, so flight maths stays clean. */
  body: THREE.Group;
  /** Nozzle positions in body space, for the exhaust particles. */
  nozzles: THREE.Vector3[];
  setThrottle: (k: number) => void;
}

export function buildShip(tex: THREE.Texture): Ship {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const hull = new THREE.MeshStandardMaterial({ color: '#cfdcea', metalness: 0.6, roughness: 0.32 });
  const wingMat = new THREE.MeshStandardMaterial({ color: '#9fbcd8', metalness: 0.65, roughness: 0.34 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#16243a', metalness: 0.85, roughness: 0.35 });
  const accent = new THREE.MeshStandardMaterial({ color: '#0b1a2c', emissive: SKY, emissiveIntensity: 2.4 });
  const glass = new THREE.MeshStandardMaterial({ color: '#0b1d33', metalness: 0.9, roughness: 0.08, emissive: '#1f4b70', emissiveIntensity: 0.5 });

  // fuselage: a lathe profile revolved around Y, then turned so the nose points -Z
  const prof = [
    new THREE.Vector2(0.0, 4.6),
    new THREE.Vector2(0.28, 3.9),
    new THREE.Vector2(0.62, 2.6),
    new THREE.Vector2(0.86, 1.0),
    new THREE.Vector2(0.9, -0.6),
    new THREE.Vector2(0.78, -2.2),
    new THREE.Vector2(0.55, -2.9),
    new THREE.Vector2(0.0, -3.0),
  ];
  const fuse = new THREE.LatheGeometry(prof, 40);
  fuse.rotateX(-Math.PI / 2);
  fuse.scale(1, 0.72, 1);
  body.add(new THREE.Mesh(fuse, hull));

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16), glass);
  canopy.scale.set(0.95, 0.62, 2.1);
  canopy.position.set(0, 0.42, -1.2);
  body.add(canopy);

  // swept wings, built flat then laid into the XZ plane
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.5, 1.3);
  wingShape.lineTo(3.9, -1.6);
  wingShape.lineTo(4.1, -2.2);
  wingShape.lineTo(0.5, -2.3);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 2 });
  wingGeo.rotateX(-Math.PI / 2);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.scale.x = s;
    w.position.y = -0.12;
    body.add(w);
    // glowing leading edge
    const edgeLen = Math.hypot(3.4, 2.9);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, edgeLen), accent);
    edge.position.set(s * 2.2, -0.02, 0.15);
    edge.rotation.y = s * Math.atan2(3.4, 2.9);
    body.add(edge);
    // wingtip light
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), accent);
    tip.position.set(s * 4.05, -0.02, 1.95);
    body.add(tip);
  }

  // tail fins
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(1.4, 0);
  finShape.lineTo(1.9, 1.15);
  finShape.lineTo(1.35, 1.15);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: false });
  finGeo.rotateY(-Math.PI / 2); // length runs +Z, so the fin's top edge rakes backward
  for (const s of [1, -1]) {
    const f = new THREE.Mesh(finGeo, wingMat);
    f.position.set(s * 0.45, 0.25, 1.0);
    f.rotation.z = s * -0.35;
    body.add(f);
  }

  // engines
  const nozzles: THREE.Vector3[] = [];
  const glowSprites: THREE.Sprite[] = [];
  for (const s of [1, -1]) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 2.4, 24), darkMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(s * 1.05, -0.05, 1.7);
    body.add(pod);
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 24), accent);
    ringM.position.set(s * 1.05, -0.05, 2.92);
    body.add(ringM);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#cfefff').multiplyScalar(1.3) }));
    disc.position.set(s * 1.05, -0.05, 2.93);
    body.add(disc);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, color: SKY, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    sprite.position.set(s * 1.05, -0.05, 3.3);
    body.add(sprite);
    glowSprites.push(sprite);
    nozzles.push(new THREE.Vector3(s * 1.05, -0.05, 3.1));
  }

  return {
    root,
    body,
    nozzles,
    setThrottle(k: number) {
      for (const sp of glowSprites) {
        sp.scale.setScalar(1.2 + k * 2.2);
        sp.material.opacity = 0.4 + 0.5 * Math.min(1, k);
      }
    },
  };
}

/* ------------------------------------------------------------- exhaust */
export interface Exhaust {
  points: THREE.Points;
  emit: (pos: THREE.Vector3, vel: THREE.Vector3) => void;
  update: (dt: number) => void;
}

export function buildExhaust(max = 420): Exhaust {
  const pos = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const vel = new Float32Array(max * 3);
  const g = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  const lifeAttr = new THREE.BufferAttribute(life, 1);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  lifeAttr.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', posAttr);
  g.setAttribute('aLife', lifeAttr);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aLife; uniform float uPx; varying float vL;
      void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uPx * aLife * 90.0 / max(-mv.z, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      varying float vL;
      void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(mix(vec3(0.53, 0.81, 0.92), vec3(1.0), vL), smoothstep(0.5, 0.0, d) * vL * 0.8); }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  let head = 0;
  return {
    points,
    emit(p, v) {
      const i = head;
      head = (head + 1) % max;
      pos.set([p.x, p.y, p.z], i * 3);
      vel.set([v.x, v.y, v.z], i * 3);
      life[i] = 1;
    },
    update(dt) {
      for (let i = 0; i < max; i++) {
        if (life[i] <= 0) continue;
        life[i] = Math.max(0, life[i] - dt * 2.2);
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      posAttr.needsUpdate = true;
      lifeAttr.needsUpdate = true;
    },
  };
}
