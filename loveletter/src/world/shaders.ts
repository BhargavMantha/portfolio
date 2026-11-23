import { WAVE_GLSL } from './sea'
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

/* ───────────────────────── Sea ─────────────────────────
 * Cel-shaded night water. Foam rings hug each island, the boat leaves a
 * glowing wake, taps make ripples, and every visited island pours its colour
 * into the water around it. Islands are known positions, so the foam is
 * computed from distance alone: no depth pass, which keeps phones happy.
 */
export const seaVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  ${WAVE_GLSL}
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    w.y += waveHeight(w.xz, uTime);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const seaFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec4 uIsle[7];              // x, z, lit (0–1), radius
  uniform vec3 uIsleCol[7];
  uniform vec3 uBoat;                 // x, z, lantern strength
  uniform vec3 uTrail[${TRAIL_LENGTH}];  // x, z, age in seconds (<0 unused)
  uniform vec3 uRipple[4];            // x, z, start time (<0 unused)
  uniform vec3 uHorizon;
  varying vec3 vWorld;
  ${WAVE_GLSL}
  ${NOISE}

  void main() {
    vec2 p = vWorld.xz;
    float e = 0.35;
    float hx = waveHeight(p + vec2(e, 0.0), uTime) - waveHeight(p - vec2(e, 0.0), uTime);
    float hz = waveHeight(p + vec2(0.0, e), uTime) - waveHeight(p - vec2(0.0, e), uTime);
    vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));
    vec3 v = normalize(cameraPosition - vWorld);

    // Three flat bands of ink blue that drift with the swell.
    float swell = waveHeight(p, uTime) * 2.4 + (fbm(p * 0.22 + uTime * 0.04) - 0.5) * 1.6;
    float band = clamp(floor((swell * 0.5 + 0.5) * 3.0) / 2.0, 0.0, 1.0);
    vec3 col = mix(vec3(0.018, 0.030, 0.095), vec3(0.050, 0.085, 0.235), band);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += vec3(0.03, 0.05, 0.13) * step(0.55, fres);

    // Moon glitter, as hard little flecks.
    vec3 moon = normalize(vec3(-0.35, 0.5, -0.78));
    float spec = pow(max(dot(reflect(-moon, n), v), 0.0), 70.0);
    float fleck = step(0.86, noise(p * 7.0 + vec2(uTime * 0.6, -uTime * 0.4)));
    col += vec3(0.80, 0.86, 1.0) * fleck * smoothstep(0.05, 0.5, spec) * 0.7;

    float wobble = fbm(p * 0.9 + uTime * 0.12) - 0.5;
    float foam = 0.0;
    vec3 light = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      float d = distance(p, uIsle[i].xy);
      float r = uIsle[i].w;
      float fi = float(i);
      // A tight ring at the shore and a slower one further out.
      float shore = abs(d - (r + 0.5 + 0.22 * sin(uTime * 1.3 + fi)) + wobble * 0.9);
      float outer = abs(d - (r + 1.8 + 0.6 * sin(uTime * 0.7 + fi * 2.1)) + wobble * 1.6);
      foam = max(foam, step(shore, 0.2));
      foam = max(foam, step(outer, 0.09) * 0.55);
      // The colour a visited island pours into the sea, in soft steps.
      float pool = exp(-d * d / 190.0);
      pool = floor(pool * 5.0 + 0.5) / 5.0;
      light += uIsleCol[i] * uIsle[i].z * (pool * 0.42 + exp(-d * d / 26.0) * 0.4);
    }
    col += light * (0.8 + 0.2 * sin(length(p) * 1.5 - uTime * 1.2 + hx * 8.0));

    // The wake: foam where the boat just was, a cool glow where it was a while ago.
    float wake = 0.0;
    float glow = 0.0;
    for (int k = 0; k < ${TRAIL_LENGTH}; k++) {
      float age = uTrail[k].z;
      if (age < 0.0) continue;
      float d = distance(p, uTrail[k].xy) + wobble * 0.5;
      float spread = 0.45 + age * 0.5;
      wake = max(wake, step(d, spread) * step(spread * 0.55, d) * step(age, 1.6));
      glow = max(glow, smoothstep(spread * 1.6, 0.0, d) * exp(-age * 0.55));
    }
    col += vec3(0.20, 0.85, 0.95) * glow * 0.36 + vec3(0.55, 0.35, 0.95) * glow * glow * 0.2;

    // Ripples from a tap.
    for (int k = 0; k < 4; k++) {
      float t0 = uRipple[k].z;
      if (t0 < 0.0) continue;
      float age = uTime - t0;
      float d = distance(p, uRipple[k].xy);
      float ring = step(abs(d - age * 3.2), 0.1) + step(abs(d - age * 3.2 + 0.9), 0.06) * step(0.3, age);
      float fade = exp(-age * 1.1) * step(age, 4.0);
      foam = max(foam, ring * fade * 0.8);
      col += vec3(0.20, 0.85, 0.95) * exp(-d * d / (1.0 + age * 6.0)) * fade * 0.25;
    }

    // The lantern's pool of gold.
    float bd = distance(p, uBoat.xy);
    float lantern = exp(-bd * bd / 9.0);
    lantern = floor(lantern * 3.0 + 0.5) / 3.0;
    col += vec3(1.0, 0.76, 0.34) * uBoat.z * (lantern * 0.26 + exp(-bd * bd / 70.0) * 0.12);

    col = mix(col, vec3(0.82, 0.90, 1.0) + light * 0.5, clamp(max(foam, wake * 0.85), 0.0, 1.0) * 0.9);

    float dist = distance(cameraPosition.xz, p);
    col = mix(col, uHorizon, smoothstep(50.0, 150.0, dist));
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
