// simulation.frag - Computes particle positions on GPU
uniform float uTime;
uniform float uDeltaTime;
uniform vec3 uAttractorPosition;
uniform float uAttractorStrength;
uniform float uRotationVelocity;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 posData = texture2D(texturePosition, uv);
  vec4 velData = texture2D(textureVelocity, uv);

  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;
  float life = posData.w;

  // Orbital motion around Y axis
  float angle = atan(pos.z, pos.x);
  float radius = length(vec2(pos.x, pos.z));
  float orbitSpeed = 0.3 + uRotationVelocity * 0.5;

  angle += orbitSpeed * uDeltaTime;

  // Apply orbital position
  pos.x = cos(angle) * radius;
  pos.z = sin(angle) * radius;

  // Vertical bob motion
  pos.y += sin(uTime * 2.0 + life * 6.28) * 0.02;

  // Attractor influence (when section is active)
  if (uAttractorStrength > 0.0) {
    vec3 toAttractor = uAttractorPosition - pos;
    float dist = length(toAttractor);
    if (dist > 0.5) {
      vec3 attractDir = normalize(toAttractor);
      pos += attractDir * uAttractorStrength * uDeltaTime * 2.0;
    }
  }

  // Keep within bounds
  float maxRadius = 15.0;
  float minRadius = 8.0;
  radius = length(vec2(pos.x, pos.z));
  if (radius > maxRadius) {
    pos.xz *= maxRadius / radius;
  } else if (radius < minRadius) {
    pos.xz *= minRadius / radius;
  }

  // Clamp vertical
  pos.y = clamp(pos.y, -5.0, 5.0);

  gl_FragColor = vec4(pos, life);
}
