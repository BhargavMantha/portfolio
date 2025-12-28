// particle.vert - Instanced particle vertex shader
uniform sampler2D uPositions;
uniform float uPixelRatio;

attribute vec2 reference;

varying float vLife;
varying float vDistance;

void main() {
  vec4 posData = texture2D(uPositions, reference);
  vec3 pos = posData.xyz;
  vLife = posData.w;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Size attenuation
  float size = 8.0 * uPixelRatio;
  size *= (1.0 / -mvPosition.z) * 50.0;
  size = clamp(size, 2.0, 20.0);

  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;
}
