import { TRAIL_LENGTH } from './trail'

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`

/* ───────────────────────── Forest floor ─────────────────────────
 * Cel-shaded night grass. A dirt trail joins the glades, each glade is ringed
 * with flowers, hoofprints of light fade behind the unicorn, taps send out a
 * ring of light, and every visited glade pours its colour into the ground
 * around it. Everything is computed from known positions, with no extra
 * render passes, which keeps phones happy.
 */
export const groundVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const groundFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec4 uIsle[7];              // x, z, lit (0–1), radius
  uniform vec3 uIsleCol[7];
  uniform vec3 uBoat;                 // x, z, horn-light strength
  uniform vec3 uTrail[${TRAIL_LENGTH}];  // x, z, age in seconds (<0 unused)
  uniform vec3 uRipple[4];            // x, z, start time (<0 unused)
  uniform vec3 uHorizon;
  varying vec3 vWorld;
  ${NOISE}

  float toSegment(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    return distance(p, a + ab * t);
  }

  void main() {
    vec2 p = vWorld.xz;
    float broad = fbm(p * 0.16);
    float fine = fbm(p * 1.3 + 7.0);

    // Three flat bands of moss.
    float band = clamp(floor(broad * 4.2) / 2.0, 0.0, 1.0);
    vec3 col = mix(vec3(0.016, 0.050, 0.058), vec3(0.040, 0.105, 0.085), band);

    // The trail from A to B: packed earth with a ragged edge.
    float trail = 1e9;
    for (int i = 0; i < 6; i++) trail = min(trail, toSegment(p, uIsle[i].xy, uIsle[i + 1].xy));
    float onTrail = 1.0 - step(1.55, trail + (fine - 0.5) * 1.7);
    vec3 earth = mix(vec3(0.085, 0.070, 0.095), vec3(0.135, 0.105, 0.125), step(0.5, fine));
    col = mix(col, earth, onTrail);

    vec3 light = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      vec2 c = uIsle[i].xy;
      float d = distance(p, c);
      float r = uIsle[i].w;
      float lit = uIsle[i].z;
      float fi = float(i);

      // Each glade is a clearing of brighter grass.
      float clearing = 1.0 - step(r + 2.4, d + (fine - 0.5) * 1.6);
      col = mix(col, mix(vec3(0.045, 0.120, 0.095), vec3(0.075, 0.175, 0.115), band), clearing);

      // A ring of flowers round it: pale by moonlight, the glade's own colour once visited.
      float ang = atan(p.y - c.y, p.x - c.x);
      float n = 22.0;
      float cell = floor((ang + 3.14159) / 6.28318 * n);
      float a = (cell + 0.5) / n * 6.28318 - 3.14159;
      float rr = r + 2.9 + 0.7 * hash(vec2(cell, fi));
      float flower = step(distance(p, c + vec2(cos(a), sin(a)) * rr), 0.17 + 0.08 * hash(vec2(fi, cell)));
      vec3 petal = mix(vec3(0.42, 0.47, 0.62), uIsleCol[i] * 1.5 + 0.15, lit);
      col = mix(col, petal, flower);

      // The colour a visited glade pours into the forest, in soft steps.
      float pool = exp(-d * d / 210.0);
      pool = floor(pool * 5.0 + 0.5) / 5.0;
      light += uIsleCol[i] * lit * (pool * 0.36 + exp(-d * d / 30.0) * 0.3);
    }
    col += light * (0.85 + 0.15 * sin(length(p) * 1.3 - uTime * 0.9));

    // Small flowers everywhere; they only show where there is light to catch.
    float bloom = step(0.90, noise(p * 3.1 + 11.0)) * step(0.5, noise(p * 9.0));
    col += (light * 2.2 + vec3(0.05, 0.07, 0.11)) * bloom * (1.0 - onTrail);

    // Hoofprints of light where the unicorn has just stepped.
    float glow = 0.0;
    float spark = 0.0;
    for (int k = 0; k < ${TRAIL_LENGTH}; k++) {
      float age = uTrail[k].z;
      if (age < 0.0) continue;
      float d = distance(p, uTrail[k].xy);
      float fade = exp(-age * 0.9);
      glow = max(glow, smoothstep(1.5 + age * 0.35, 0.0, d) * fade);
      spark = max(spark, step(d, 0.26) * fade);
    }
    float glitter = step(0.62, noise(p * 11.0 + uTime * 1.5));
    col += vec3(1.0, 0.78, 0.50) * glow * 0.20 + vec3(1.0, 0.62, 0.85) * glow * glitter * 0.55;
    col = mix(col, vec3(1.0, 0.93, 0.74), spark * 0.85);

    // A ring of light from a tap.
    for (int k = 0; k < 4; k++) {
      float t0 = uRipple[k].z;
      if (t0 < 0.0) continue;
      float age = uTime - t0;
      float d = distance(p, uRipple[k].xy);
      float fade = exp(-age * 1.2) * step(age, 4.0);
      float ring = step(abs(d - age * 3.0), 0.09) + step(abs(d - age * 3.0 + 0.8), 0.05) * step(0.3, age);
      col += vec3(1.0, 0.90, 0.62) * ring * fade * 0.8 + vec3(1.0, 0.75, 0.45) * exp(-d * d / (1.0 + age * 5.0)) * fade * 0.2;
    }

    // The horn's pool of gold.
    float bd = distance(p, uBoat.xy);
    float horn = exp(-bd * bd / 11.0);
    horn = floor(horn * 3.0 + 0.5) / 3.0;
    col += vec3(1.0, 0.78, 0.40) * uBoat.z * (horn * 0.16 + exp(-bd * bd / 80.0) * 0.10);

    float dist = distance(cameraPosition.xz, p);
    col = mix(col, uHorizon, smoothstep(42.0, 135.0, dist));
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ───────────────────────── Sky ─────────────────────────
 * One dome: a night gradient that warms as islands are lit, stars that
 * twinkle, an aurora to the north (towards B), a moon, and shooting stars.
 */
export const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 pos = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = pos.xyww;   // always at the far plane
  }
`

export const skyFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uDawn;        // 0 at the start, 1 when every island is lit
  uniform vec3 uShootFrom;
  uniform vec3 uShootDir;
  uniform float uShootT;      // 0–1 while a shooting star is crossing, else <0
  varying vec3 vDir;
  ${NOISE}

  float starLayer(vec2 sp, float n, float density) {
    vec2 g = sp * n;
    vec2 id = floor(g);
    float r = hash(id);
    vec2 f = fract(g) - 0.5 - (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + r * 3.0) + r * 60.0);
    return step(density, r) * smoothstep(0.09 + 0.07 * hash(id + 1.3), 0.0, length(f)) * twinkle;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);
    vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));

    vec3 zenith = vec3(0.010, 0.016, 0.060);
    vec3 middle = mix(vec3(0.040, 0.050, 0.170), vec3(0.090, 0.060, 0.230), uDawn);
    vec3 horizon = mix(vec3(0.075, 0.075, 0.200), vec3(0.340, 0.170, 0.420), uDawn);
    vec3 col = mix(horizon, middle, smoothstep(0.0, 0.22, h));
    col = mix(col, zenith, smoothstep(0.18, 0.85, h));

    // Warmth on the northern horizon, where the voyage is heading.
    float north = pow(max(dot(normalize(d.xz + 1e-5), vec2(0.0, -1.0)), 0.0), 2.5);
    float low = 1.0 - smoothstep(0.0, 0.30, h);
    col += mix(vec3(0.20, 0.10, 0.36), vec3(0.95, 0.56, 0.22), uDawn) * north * low * (0.22 + 0.55 * uDawn);

    float stars = starLayer(sp, 46.0, 0.86) + starLayer(sp + 4.0, 90.0, 0.90) * 0.7;
    col += vec3(0.95, 0.96, 1.0) * stars * smoothstep(0.02, 0.25, h);

    // Aurora: slow curtains in the northern sky, teal below, violet above.
    float curtain = fbm(vec2(sp.x * 2.6 + uTime * 0.025, h * 1.5 - uTime * 0.01));
    float rays = 0.6 + 0.4 * sin(sp.x * 34.0 + curtain * 9.0 + uTime * 0.2);
    float ribbon = smoothstep(0.07, 0.22, h) * smoothstep(0.62, 0.26, h) * pow(curtain, 2.2) * rays;
    col += mix(vec3(0.10, 0.85, 0.72), vec3(0.62, 0.30, 0.95), smoothstep(0.1, 0.5, h)) * ribbon * (0.25 + 0.75 * north) * (0.35 + 0.5 * uDawn);

    vec3 moon = normalize(vec3(-0.35, 0.5, -0.78));
    float m = dot(d, moon);
    col += vec3(1.0, 0.96, 0.84) * smoothstep(0.9982, 0.9987, m);
    col += vec3(0.55, 0.60, 0.95) * pow(max(m, 0.0), 220.0) * 0.5;

    if (uShootT >= 0.0) {
      float streak = 0.0;
      for (int j = 0; j < 9; j++) {
        float s = uShootT - float(j) * 0.022;
        if (s < 0.0) continue;
        vec3 q = normalize(uShootFrom + uShootDir * s);
        streak += exp(-(1.0 - dot(d, q)) * 90000.0) * (1.0 - float(j) / 9.0);
      }
      col += vec3(1.0, 0.95, 0.85) * streak * sin(uShootT * 3.14159);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ───────────────────────── Fireflies ───────────────────────── */
export const fireflyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uLit[7];
  uniform float uScale;
  attribute float aIsle;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    p.x += sin(uTime * 0.5 + s) * 0.7;
    p.y += sin(uTime * 0.8 + s * 2.0) * 0.5;
    p.z += cos(uTime * 0.45 + s * 1.3) * 0.7;
    float lit = 0.0;
    for (int i = 0; i < 7; i++) lit += uLit[i] * (1.0 - step(0.5, abs(aIsle - float(i))));
    vAlpha = lit * (0.45 + 0.55 * sin(uTime * (1.2 + aSeed * 2.0) + s * 4.0));
    vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
    gl_PointSize = uScale * (0.6 + aSeed) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

export const fireflyFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * max(vAlpha, 0.0));
  }
`
