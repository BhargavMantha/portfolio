import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Color, Vector4, type Texture } from 'three'
import type { Photo } from '../content/manifest'
import { frame } from './frame'
import { blankTexture, textureFor } from './textures'

/**
 * What the film is showing right now. The scroll loop writes here every frame
 * and the shader reads it, so React never re-renders during a scroll.
 */
export const stage = {
  a: null as Photo | null,
  b: null as Photo | null,
  mix: 0,
  tintA: '#1d1b4b',
  tintB: '#1d1b4b',
  /** 0–1 within the current beat, for the slow drift on photos. */
  drift: 0,
  /** Overall brightness of the open water, 0 (night) to 1 (lit). */
  glow: 0,
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uA, uB;
  uniform float uHasA, uHasB, uMix, uTime, uAspect, uZoomA, uZoomB, uGlow;
  uniform vec4 uFrameA, uFrameB;   // scale.xy, centre.xy in image space, y from the top
  uniform vec3 uTintA, uTintB;

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

  // Open water at night: slow caustics carrying the chapter's colour.
  vec3 water(vec2 uv, vec3 tint) {
    vec2 p = uv * vec2(uAspect, 1.0) * 2.6;
    float c1 = fbm(p + vec2(uTime * 0.045, uTime * 0.03));
    float c2 = fbm(p * 1.9 - vec2(uTime * 0.035, -uTime * 0.02));
    float caustic = pow(smoothstep(0.32, 0.92, c1 * c2 * 2.4), 2.0);
    vec3 deep = mix(vec3(0.020, 0.028, 0.085), vec3(0.043, 0.063, 0.149), uv.y);
    float lift = 0.5 + 0.5 * uGlow;
    return deep + tint * (0.16 * caustic + 0.07 * (1.0 - uv.y)) * lift;
  }

  vec3 photo(sampler2D tex, vec4 f, vec2 uv, float zoom) {
    vec2 p = vec2(uv.x, 1.0 - uv.y) - 0.5;
    vec2 img = f.zw + p * f.xy * zoom;
    // Blurred, darkened copy that fills the view behind a floating photo.
    vec2 cov = 0.5 + p * f.xy / max(f.x, f.y) * 0.92;
    vec3 surround = texture2D(tex, vec2(cov.x, 1.0 - cov.y), 6.0).rgb * 0.32;
    vec2 feather = vec2(0.006) * f.xy;
    vec2 e = smoothstep(vec2(0.0), feather, img) * smoothstep(vec2(0.0), feather, 1.0 - img);
    vec3 sharp = texture2D(tex, vec2(img.x, 1.0 - img.y)).rgb;
    vec3 col = mix(surround, sharp, e.x * e.y);
    // Keep the lower third calm enough to read words on.
    col *= mix(0.62, 1.0, smoothstep(0.0, 0.42, uv.y));
    float d = distance(uv, vec2(0.5));
    return col * (1.0 - 0.28 * smoothstep(0.45, 0.85, d));
  }

  void main() {
    vec2 uv = vUv;
    // The tide: a waterline that rises with uMix, bringing the next beat in from below.
    float wave = 0.045 * sin(uv.x * 8.0 + uTime * 1.2) + 0.09 * (fbm(vec2(uv.x * 3.2, uTime * 0.18)) - 0.5);
    float level = uMix * 1.28 - 0.14 + wave;
    float moving = step(0.001, uMix) * step(uMix, 0.999);
    float line = exp(-abs(uv.y - level) * 46.0) * moving;
    vec2 bend = vec2(0.010 * sin(uv.y * 60.0 - uTime * 4.0), 0.014 * sin(uv.x * 34.0 + uTime * 3.0)) * line;

    vec3 a = uHasA > 0.5 ? photo(uA, uFrameA, uv + bend, uZoomA) : water(uv + bend, uTintA);
    vec3 b = uHasB > 0.5 ? photo(uB, uFrameB, uv - bend, uZoomB) : water(uv - bend, uTintB);
    float under = 1.0 - smoothstep(level - 0.012, level + 0.012, uv.y);
    vec3 col = mix(a, b, under);
    col += uTintB * line * 0.75 + vec3(1.0, 0.96, 0.86) * pow(line, 3.0) * 0.5;

    // Fine grain so gradients do not band.
    col += (hash(uv * vec2(1920.0, 1080.0) + uTime) - 0.5) * 0.018;
    gl_FragColor = vec4(col, 1.0);
  }
`

const frameVec = (photo: Photo | null, view: { w: number; h: number }, out: Vector4) => {
  if (!photo) return out
  const f = frame(photo, view)
  return out.set(f.scale[0], f.scale[1], f.center[0], f.center[1])
}

/** One full-screen quad that shows the current beat and the tide between beats. */
export function Stage({ maxWidth }: { maxWidth: number }) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  const uniforms = useMemo(
    () => ({
      uA: { value: blankTexture as Texture },
      uB: { value: blankTexture as Texture },
      uHasA: { value: 0 },
      uHasB: { value: 0 },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uZoomA: { value: 1 },
      uZoomB: { value: 1 },
      uGlow: { value: 0 },
      uFrameA: { value: new Vector4(1, 1, 0.5, 0.5) },
      uFrameB: { value: new Vector4(1, 1, 0.5, 0.5) },
      uTintA: { value: new Color('#1d1b4b') },
      uTintB: { value: new Color('#1d1b4b') },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const view = { w: size.width, h: size.height }
    const css = Math.min(size.width, maxWidth / dpr)
    const u = uniforms
    u.uTime.value = clock.elapsedTime
    u.uAspect.value = size.width / Math.max(1, size.height)
    u.uMix.value = stage.mix
    u.uGlow.value = stage.glow
    u.uHasA.value = stage.a ? 1 : 0
    u.uHasB.value = stage.b ? 1 : 0
    if (stage.a) u.uA.value = textureFor(stage.a, css, dpr)
    if (stage.b) u.uB.value = textureFor(stage.b, css, dpr)
    frameVec(stage.a, view, u.uFrameA.value)
    frameVec(stage.b, view, u.uFrameB.value)
    // Photos drift inward very slowly while they hold.
    u.uZoomA.value = 1 - 0.035 * stage.drift
    u.uZoomB.value = 1
    u.uTintA.value.set(stage.tintA)
    u.uTintB.value.set(stage.tintB)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
