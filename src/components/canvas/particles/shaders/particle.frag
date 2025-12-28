// particle.frag - Particle fragment shader
uniform vec3 uColor;
uniform float uOpacity;

varying float vLife;
varying float vDistance;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;

  // Soft edge falloff
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // Distance fade
  float distanceFade = clamp(1.0 - vDistance / 30.0, 0.3, 1.0);

  // Color with glow
  vec3 color = uColor;
  color += vec3(0.2, 0.5, 0.8) * (1.0 - dist * 2.0); // Core glow

  gl_FragColor = vec4(color, alpha * uOpacity * distanceFade);
}
