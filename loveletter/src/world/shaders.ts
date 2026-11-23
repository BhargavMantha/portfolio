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
 * Sunlit grass in flat, painted patches. A dirt trail joins the glades, each
 * glade is ringed with flowers, tree shadows lie across the ground, flowers
 * spring up where the unicorn has stepped, and every visited glade fills the
 * meadow around it with flowers of its own colour. Everything is computed
 * from known positions plus one small baked shadow map: no extra render
 * passes, which keeps phones happy.
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
  uniform vec3 uBoat;                 // x, z, unused
  uniform vec3 uTrail[${TRAIL_LENGTH}];  // x, z, age in seconds (<0 unused)
  uniform vec3 uRipple[4];            // x, z, start time (<0 unused)
  uniform vec3 uHorizon;
  uniform sampler2D uShade;           // baked tree shadows
  uniform vec4 uShadeBox;             // min x, min z, width, depth of the shadow map
  uniform vec2 uSun;                  // direction shadows fall in, on the ground
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

    // Painted grass: three flat greens, with sun-bleached patches and darker tufts.
    float band = clamp(floor(broad * 4.2) / 2.0, 0.0, 1.0);
    vec3 col = mix(vec3(0.165, 0.455, 0.130), vec3(0.330, 0.640, 0.170), band);
    col = mix(col, vec3(0.560, 0.780, 0.230), step(0.60, fbm(p * 0.42 + 21.0)) * 0.55);
    col *= 1.0 - 0.16 * step(0.74, noise(p * 3.7));

    // The trail from A to B: warm earth with a ragged edge and a few pale stones.
    float trail = 1e9;
    for (int i = 0; i < 6; i++) trail = min(trail, toSegment(p, uIsle[i].xy, uIsle[i + 1].xy));
    float onTrail = 1.0 - step(1.55, trail + (fine - 0.5) * 1.7);
    vec3 earth = mix(vec3(0.470, 0.345, 0.225), vec3(0.610, 0.470, 0.315), step(0.5, fine));
    earth = mix(earth, vec3(0.760, 0.720, 0.640), step(0.90, noise(p * 2.6 + 3.0)));
    col = mix(col, earth, onTrail);

    float meadow = 0.0;
    vec3 tint = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      vec2 c = uIsle[i].xy;
      float d = distance(p, c);
      float r = uIsle[i].w;
      float lit = uIsle[i].z;
      float fi = float(i);

      // Each glade is a clearing of fresh, brighter grass.
      float clearing = 1.0 - step(r + 2.4, d + (fine - 0.5) * 1.6);
      col = mix(col, mix(vec3(0.400, 0.710, 0.210), vec3(0.540, 0.820, 0.270), band), clearing);

      // A ring of flowers round it: white at first, the glade's own colour once visited.
      float ang = atan(p.y - c.y, p.x - c.x);
      float n = 22.0;
      float cell = floor((ang + 3.14159) / 6.28318 * n);
      float a = (cell + 0.5) / n * 6.28318 - 3.14159;
      float rr = r + 2.9 + 0.7 * hash(vec2(cell, fi));
      float flower = step(distance(p, c + vec2(cos(a), sin(a)) * rr), 0.17 + 0.08 * hash(vec2(fi, cell)));
      vec3 petal = mix(vec3(0.980, 0.960, 0.900), uIsleCol[i] * 1.15 + 0.12, lit);
      col = mix(col, petal, flower);

      // How strongly this glade's flowers have spread to here.
      float reach = exp(-d * d / 260.0) * lit;
      meadow = max(meadow, reach);
      tint += uIsleCol[i] * reach;
    }

    // Wild flowers: sparse and white everywhere, thick and coloured round visited glades.
    float seed = noise(p * 3.1 + 11.0);
    float dot2 = step(0.5, noise(p * 9.0));
    float wild = step(0.93 - 0.20 * meadow, seed) * dot2 * (1.0 - onTrail);
    vec3 wildCol = mix(vec3(0.980, 0.960, 0.880), normalize(tint + 1e-4) * 1.25 + 0.10, smoothstep(0.05, 0.3, meadow));
    col = mix(col, wildCol, wild);

    // Tree shadows, cool and soft, the way they are painted.
    vec2 suv = (p - uShadeBox.xy) / uShadeBox.zw;
    float shade = texture2D(uShade, suv).r * step(0.0, suv.x) * step(suv.x, 1.0) * step(0.0, suv.y) * step(suv.y, 1.0);
    // Her own shadow.
    vec2 rel = p - (uBoat.xy + uSun * 1.6);
    float along = dot(rel, uSun);
    float across = dot(rel, vec2(-uSun.y, uSun.x));
    shade = max(shade, (1.0 - smoothstep(0.75, 1.15, length(vec2(along / 2.1, across / 0.75)))) * 0.85);
    col = mix(col, col * vec3(0.42, 0.56, 0.66), shade * 0.78);

    // Flowers spring up where the unicorn has just stepped.
    float glow = 0.0;
    float spark = 0.0;
    for (int k = 0; k < ${TRAIL_LENGTH}; k++) {
      float age = uTrail[k].z;
      if (age < 0.0) continue;
      float d = distance(p, uTrail[k].xy);
      float fade = exp(-age * 0.8);
      glow = max(glow, smoothstep(1.6 + age * 0.4, 0.0, d) * fade);
      spark = max(spark, step(d, 0.24) * fade);
    }
    float glitter = step(0.66, noise(p * 11.0 + uTime * 1.5));
    col = mix(col, vec3(1.0, 0.72, 0.86), glow * glitter * 0.85);
    col = mix(col, vec3(1.0, 0.97, 0.86), spark * 0.9);

    // A ring of light from a tap.
    for (int k = 0; k < 4; k++) {
      float t0 = uRipple[k].z;
      if (t0 < 0.0) continue;
      float age = uTime - t0;
      float d = distance(p, uRipple[k].xy);
      float fade = exp(-age * 1.2) * step(age, 4.0);
      float ring = step(abs(d - age * 3.0), 0.10) + step(abs(d - age * 3.0 + 0.8), 0.05) * step(0.3, age);
      col = mix(col, vec3(1.0, 0.98, 0.88), clamp(ring * fade, 0.0, 1.0));
    }

    float dist = distance(cameraPosition.xz, p);
    col = mix(col, uHorizon, smoothstep(40.0, 130.0, dist));
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ───────────────────────── Sky ─────────────────────────
 * A morning sky: blue overhead, pale and misty at the horizon, a low sun
 * with a wide glow, and thin drifting cloud. It turns warmer and clearer as
 * glades are visited.
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
  uniform float uDawn;        // 0 at the start, 1 when every glade is visited
  uniform vec3 uSunDir;
  varying vec3 vDir;
  ${NOISE}

  void main() {
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);

    vec3 zenith = mix(vec3(0.330, 0.600, 0.860), vec3(0.230, 0.540, 0.920), uDawn);
    vec3 horizon = mix(vec3(0.780, 0.900, 0.880), vec3(1.000, 0.930, 0.760), uDawn);
    vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.55, h));

    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += vec3(1.0, 0.86, 0.60) * pow(s, 9.0) * 0.38;
    col += vec3(1.0, 0.95, 0.80) * pow(s, 120.0) * 0.8;
    col = mix(col, vec3(1.0, 0.99, 0.93), smoothstep(0.9990, 0.9994, s));

    // Thin cloud, stretched towards the horizon.
    vec2 cp = d.xz / (d.y + 0.22) * 1.3 + vec2(uTime * 0.006, uTime * 0.002);
    float cloud = fbm(cp) * fbm(cp * 2.3 + 5.0);
    cloud = smoothstep(0.20, 0.42, cloud) * smoothstep(0.02, 0.25, h);
    col = mix(col, vec3(1.0, 0.985, 0.960), cloud * 0.75);

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
    gl_FragColor = vec4(uColor, a * max(vAlpha, 0.0));
  }
`
