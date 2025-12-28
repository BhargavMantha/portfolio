# Portfolio Effects Enhancement - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add selective bloom, GPGPU particles, and energy beams to transform the Iron Man portfolio into a mind-blowing technology showcase.

**Architecture:** Post-processing pipeline using `@react-three/postprocessing` for bloom effects, FBO-based GPU particle simulation for 5K particles, and custom React Three Fiber components for energy beams and trails.

**Tech Stack:** React Three Fiber, @react-three/postprocessing, Three.js shaders (GLSL), Zustand state extensions

---

## Phase 1: Post-Processing Foundation

### Task 1.1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install post-processing packages**

Run:
```bash
cd /home/Bhargav/Documents/personal/portfolio && pnpm add @react-three/postprocessing postprocessing
```

Expected: Packages install successfully, package.json updated

**Step 2: Verify installation**

Run:
```bash
pnpm list @react-three/postprocessing postprocessing
```

Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @react-three/postprocessing for bloom effects"
```

---

### Task 1.2: Add EffectComposer to Scene

**Files:**
- Modify: `src/components/canvas/Scene.tsx`

**Step 1: Update Scene.tsx with EffectComposer wrapper**

Replace entire file with:

```tsx
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense } from 'react';
import { Island } from './Island';
import { Sky } from './atmosphere/Sky';
import { DataParticles } from './atmosphere/DataParticles';
import { colors } from '../../constants/colors';

export const Scene = () => {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 2, 10]}
            fov={50}
          />

          {/* Lighting setup - ULTRA BRIGHT */}
          <ambientLight intensity={2.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={5.0}
            castShadow
          />
          <directionalLight
            position={[-10, 10, -5]}
            intensity={4.0}
          />
          <directionalLight
            position={[0, 5, 10]}
            intensity={3.5}
          />
          <directionalLight
            position={[0, -5, 5]}
            intensity={3.0}
          />
          <pointLight
            position={[-10, 5, -10]}
            intensity={3.0}
            color={colors.atmosphere.cyan}
          />
          <pointLight
            position={[10, 5, 10]}
            intensity={3.0}
            color={colors.atmosphere.blue}
          />
          <pointLight
            position={[0, 0, 15]}
            intensity={4.0}
            color="#ffffff"
          />
          <spotLight
            position={[0, 15, 0]}
            intensity={4.0}
            angle={0.8}
            penumbra={0.3}
            color="#ffffff"
          />

          <Sky />
          <DataParticles />
          <Island />

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};
```

**Step 2: Run dev server to verify**

Run:
```bash
cd /home/Bhargav/Documents/personal/portfolio && pnpm dev
```

Expected: Site loads without errors, subtle bloom visible on bright elements

**Step 3: Commit**

```bash
git add src/components/canvas/Scene.tsx
git commit -m "feat: add EffectComposer with Bloom post-processing"
```

---

## Phase 2: Arc Reactor Glow

### Task 2.1: Create Arc Reactor Glow Component

**Files:**
- Create: `src/components/canvas/effects/ArcReactorGlow.tsx`

**Step 1: Create effects directory**

Run:
```bash
mkdir -p /home/Bhargav/Documents/personal/portfolio/src/components/canvas/effects
```

**Step 2: Create ArcReactorGlow.tsx**

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArcReactorGlowProps {
  position?: [number, number, number];
}

export const ArcReactorGlow = ({ position = [0, 0.8, 0.4] }: ArcReactorGlowProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current || !ringRef.current) return;

    const t = clock.getElapsedTime();

    // Pulsing intensity: 0.8 -> 1.2 range
    const pulse = 1.0 + Math.sin(t * 2) * 0.2;

    const glowMaterial = glowRef.current.material as THREE.MeshStandardMaterial;
    glowMaterial.emissiveIntensity = pulse * 2;

    const ringMaterial = ringRef.current.material as THREE.MeshStandardMaterial;
    ringMaterial.emissiveIntensity = pulse * 1.5;

    // Subtle scale pulse
    glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
  });

  return (
    <group position={position}>
      {/* Core glow - bright center */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00D4FF"
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00F5FF"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Glow halo (large, faint) */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={0.5}
          toneMapped={false}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
```

**Step 3: Commit**

```bash
git add src/components/canvas/effects/ArcReactorGlow.tsx
git commit -m "feat: create ArcReactorGlow component with pulsing effect"
```

---

### Task 2.2: Integrate Arc Reactor into Island

**Files:**
- Modify: `src/components/canvas/Island.tsx`

**Step 1: Add ArcReactorGlow import and usage**

Add import at top of Island.tsx:
```tsx
import { ArcReactorGlow } from './effects/ArcReactorGlow';
```

Add component inside the `<group>` return, after the `<primitive>` tag:
```tsx
<group ref={islandRef as any} position={[0, -1.5, 0]}>
  <primitive object={scene} scale={3.2} rotation={[0, 0, 0]} />

  {/* Arc Reactor glow effect */}
  <ArcReactorGlow position={[0, 0.8, 0.4]} />

  {/* Active label with Iron Man HUD-style angular arrow */}
  ...
```

**Step 2: Verify in browser**

Run dev server and confirm Arc Reactor position has pulsing glow with bloom effect.

**Step 3: Commit**

```bash
git add src/components/canvas/Island.tsx
git commit -m "feat: integrate ArcReactorGlow into Island component"
```

---

### Task 2.3: Create Repulsor Glow Component

**Files:**
- Create: `src/components/canvas/effects/RepulsorGlow.tsx`

**Step 1: Create RepulsorGlow.tsx**

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';

interface RepulsorGlowProps {
  hand: 'left' | 'right';
  position: [number, number, number];
}

export const RepulsorGlow = ({ hand, position }: RepulsorGlowProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const activeSection = useIslandStore((state) => state.activeSection);

  // Determine if this hand's section is active
  const isActive = (hand === 'right' && activeSection === 'projects') ||
                   (hand === 'left' && activeSection === 'contact');

  useFrame(({ clock }) => {
    if (!glowRef.current) return;

    const t = clock.getElapsedTime();
    const material = glowRef.current.material as THREE.MeshStandardMaterial;

    if (isActive) {
      // Active: brighter pulse
      material.emissiveIntensity = 2.5 + Math.sin(t * 4) * 0.5;
      glowRef.current.scale.setScalar(1.2 + Math.sin(t * 4) * 0.1);
    } else {
      // Idle: gentle pulse
      material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.2;
      glowRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      {/* Core glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isActive ? '#ffffff' : '#00D4FF'}
          emissiveIntensity={1}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={isActive ? 1 : 0.3}
          toneMapped={false}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/canvas/effects/RepulsorGlow.tsx
git commit -m "feat: create RepulsorGlow component for hand glows"
```

---

### Task 2.4: Add Repulsors to Island

**Files:**
- Modify: `src/components/canvas/Island.tsx`

**Step 1: Add import**

```tsx
import { RepulsorGlow } from './effects/RepulsorGlow';
```

**Step 2: Add components after ArcReactorGlow**

```tsx
{/* Arc Reactor glow effect */}
<ArcReactorGlow position={[0, 0.8, 0.4]} />

{/* Repulsor glows on hands */}
<RepulsorGlow hand="right" position={[0.65, 0.1, 0.3]} />
<RepulsorGlow hand="left" position={[-0.65, 0.1, 0.3]} />
```

**Step 3: Verify and adjust positions**

Run dev server. Positions may need tweaking based on Iron Man model. Adjust the x, y, z values until glows align with palm centers.

**Step 4: Commit**

```bash
git add src/components/canvas/Island.tsx
git commit -m "feat: add RepulsorGlow to both hands"
```

---

## Phase 3: GPGPU Particle System

### Task 3.1: Create Particle Shaders

**Files:**
- Create: `src/components/canvas/particles/shaders/simulation.frag`
- Create: `src/components/canvas/particles/shaders/particle.vert`
- Create: `src/components/canvas/particles/shaders/particle.frag`

**Step 1: Create directory structure**

Run:
```bash
mkdir -p /home/Bhargav/Documents/personal/portfolio/src/components/canvas/particles/shaders
```

**Step 2: Create simulation.frag (GPU physics)**

```glsl
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
```

**Step 3: Create particle.vert**

```glsl
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
```

**Step 4: Create particle.frag**

```glsl
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
```

**Step 5: Commit**

```bash
git add src/components/canvas/particles/shaders/
git commit -m "feat: add GLSL shaders for GPU particle simulation"
```

---

### Task 3.2: Create GPU Particles Component

**Files:**
- Create: `src/components/canvas/particles/GPUParticles.tsx`

**Step 1: Create GPUParticles.tsx**

```tsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { colors } from '../../../constants/colors';

// Particle count
const PARTICLE_COUNT = 3000;

// Section attractor positions (in world space, adjusted for island position)
const SECTION_ATTRACTORS: Record<string, [number, number, number]> = {
  hero: [0, 2.5, 0],
  about: [-0.5, 1.8, -0.2],
  experience: [0, 0.8, 0.4],
  projects: [0.8, 0, -0.2],
  contact: [-0.8, 0, -0.2],
};

export const GPUParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { gl } = useThree();

  const activeSection = useIslandStore((state) => state.activeSection);
  const isDragging = useIslandStore((state) => state.isDragging);

  // Create particles with initial positions
  const { positions, colors: particleColors, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const color = new THREE.Color(colors.atmosphere?.cyan || '#00F5FF');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Toroidal distribution
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 6; // 8-14 units from center
      const height = (Math.random() - 0.5) * 8;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Slight color variation
      const hueShift = (Math.random() - 0.5) * 0.1;
      colors[i * 3] = color.r + hueShift;
      colors[i * 3 + 1] = color.g + hueShift;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, colors: particleColors, sizes };
  }, []);

  // Animation state
  const animationRef = useRef({
    velocities: new Float32Array(PARTICLE_COUNT * 3),
    time: 0,
  });

  // Initialize velocities
  useEffect(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      animationRef.current.velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      animationRef.current.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      animationRef.current.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = animationRef.current.velocities;
    animationRef.current.time += delta;

    const attractorPos = activeSection ? SECTION_ATTRACTORS[activeSection] : null;
    const attractStrength = activeSection ? 0.5 : 0;
    const rotationBoost = isDragging ? 2 : 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // Orbital motion
      const angle = Math.atan2(z, x);
      const radius = Math.sqrt(x * x + z * z);
      const orbitSpeed = (0.1 + (i % 10) * 0.01) * rotationBoost;
      const newAngle = angle + orbitSpeed * delta;

      x = Math.cos(newAngle) * radius;
      z = Math.sin(newAngle) * radius;

      // Vertical bob
      y += Math.sin(animationRef.current.time * 2 + i * 0.1) * 0.01;

      // Attractor influence
      if (attractorPos && Math.random() < 0.1) { // Only affect 10% per frame
        const dx = attractorPos[0] - x;
        const dy = attractorPos[1] - y;
        const dz = attractorPos[2] - z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 2) {
          x += (dx / dist) * attractStrength * delta;
          y += (dy / dist) * attractStrength * delta;
          z += (dz / dist) * attractStrength * delta;
        }
      }

      // Keep in bounds
      const newRadius = Math.sqrt(x * x + z * z);
      if (newRadius > 14) {
        const scale = 14 / newRadius;
        x *= scale;
        z *= scale;
      } else if (newRadius < 6) {
        const scale = 6 / newRadius;
        x *= scale;
        z *= scale;
      }

      y = Math.max(-4, Math.min(4, y));

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={colors.atmosphere.cyan}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/canvas/particles/GPUParticles.tsx
git commit -m "feat: create GPUParticles component with orbital motion"
```

---

### Task 3.3: Replace DataParticles with GPUParticles

**Files:**
- Modify: `src/components/canvas/Scene.tsx`

**Step 1: Update imports**

Replace:
```tsx
import { DataParticles } from './atmosphere/DataParticles';
```

With:
```tsx
import { GPUParticles } from './particles/GPUParticles';
```

**Step 2: Replace component usage**

Replace:
```tsx
<DataParticles />
```

With:
```tsx
<GPUParticles />
```

**Step 3: Verify in browser**

Run dev server. Particles should orbit around the suit and react to section changes.

**Step 4: Commit**

```bash
git add src/components/canvas/Scene.tsx
git commit -m "feat: replace DataParticles with GPUParticles"
```

---

## Phase 4: Energy Beams

### Task 4.1: Create Energy Lines Component

**Files:**
- Create: `src/components/canvas/beams/EnergyLines.tsx`

**Step 1: Create beams directory**

Run:
```bash
mkdir -p /home/Bhargav/Documents/personal/portfolio/src/components/canvas/beams
```

**Step 2: Create EnergyLines.tsx**

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { PIT_STOPS } from '../../../constants/pitStops';
import { SectionType } from '../../../types/island';

// Arc reactor position (center point)
const REACTOR_POS = new THREE.Vector3(0, 0.8, 0.4);

// Target positions for each section (where energy lines point)
const SECTION_TARGETS: Record<SectionType, [number, number, number]> = {
  hero: [0, 3, -0.5],
  about: [-1.5, 1.5, 0],
  experience: [0, 0.8, 1.5], // Forward from reactor
  projects: [1.5, 0, 0.5],
  contact: [-1.5, 0, 0.5],
};

interface EnergyLineProps {
  section: SectionType;
  isActive: boolean;
}

const EnergyLine = ({ section, isActive }: EnergyLineProps) => {
  const lineRef = useRef<THREE.Mesh>(null);
  const color = PIT_STOPS[section].color;
  const target = SECTION_TARGETS[section];

  const curve = useMemo(() => {
    return new THREE.LineCurve3(
      REACTOR_POS.clone(),
      new THREE.Vector3(...target)
    );
  }, [target]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    const material = lineRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.getElapsedTime();

    if (isActive) {
      // Active: bright pulsing
      material.opacity = 0.7 + Math.sin(t * 3) * 0.2;
      material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.5;
    } else {
      // Inactive: subtle
      material.opacity = 0.2;
      material.emissiveIntensity = 0.3;
    }
  });

  return (
    <mesh ref={lineRef}>
      <tubeGeometry args={[curve as any, 8, isActive ? 0.02 : 0.008, 6, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 1.5 : 0.3}
        transparent
        opacity={isActive ? 0.7 : 0.2}
        toneMapped={false}
      />
    </mesh>
  );
};

export const EnergyLines = () => {
  const activeSection = useIslandStore((state) => state.activeSection);
  const sections: SectionType[] = ['hero', 'about', 'experience', 'projects', 'contact'];

  return (
    <group position={[0, -1.5, 0]}> {/* Match island position */}
      {sections.map((section) => (
        <EnergyLine
          key={section}
          section={section}
          isActive={activeSection === section}
        />
      ))}
    </group>
  );
};
```

**Step 3: Commit**

```bash
git add src/components/canvas/beams/EnergyLines.tsx
git commit -m "feat: create EnergyLines component connecting reactor to sections"
```

---

### Task 4.2: Create Rotation Trails Component

**Files:**
- Create: `src/components/canvas/beams/RotationTrails.tsx`

**Step 1: Create RotationTrails.tsx**

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIslandStore } from '../../../store/islandStore';
import { colors } from '../../../constants/colors';

const TRAIL_COUNT = 100;

// Trail emit positions (shoulders and helmet)
const EMIT_POINTS = [
  [0.6, 2.2, 0],   // Right shoulder
  [-0.6, 2.2, 0],  // Left shoulder
  [0, 3.5, -0.3],  // Helmet top
];

export const RotationTrails = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const isDragging = useIslandStore((state) => state.isDragging);

  const trailData = useRef({
    positions: new Float32Array(TRAIL_COUNT * 3),
    opacities: new Float32Array(TRAIL_COUNT),
    ages: new Float32Array(TRAIL_COUNT),
    activeCount: 0,
    lastEmitTime: 0,
  });

  // Initialize positions
  useMemo(() => {
    for (let i = 0; i < TRAIL_COUNT; i++) {
      trailData.current.positions[i * 3] = 0;
      trailData.current.positions[i * 3 + 1] = -100; // Hide initially
      trailData.current.positions[i * 3 + 2] = 0;
      trailData.current.opacities[i] = 0;
      trailData.current.ages[i] = 1;
    }
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = clock.getElapsedTime();
    const data = trailData.current;

    // Emit new particles when dragging
    if (isDragging && time - data.lastEmitTime > 0.03) {
      data.lastEmitTime = time;

      // Find inactive particle slot
      for (let i = 0; i < TRAIL_COUNT; i++) {
        if (data.ages[i] >= 1) {
          // Pick random emit point
          const emitPoint = EMIT_POINTS[Math.floor(Math.random() * EMIT_POINTS.length)];

          positions[i * 3] = emitPoint[0] + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = emitPoint[1] + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 2] = emitPoint[2] + (Math.random() - 0.5) * 0.2;

          data.ages[i] = 0;
          data.opacities[i] = 1;
          break;
        }
      }
    }

    // Update all particles
    for (let i = 0; i < TRAIL_COUNT; i++) {
      if (data.ages[i] < 1) {
        data.ages[i] += 0.02; // Fade over ~1 second
        data.opacities[i] = 1 - data.ages[i];

        // Drift outward and up
        positions[i * 3] *= 1.02;
        positions[i * 3 + 1] += 0.02;
        positions[i * 3 + 2] *= 1.02;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, -1.5, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_COUNT}
          array={trailData.current.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={colors.atmosphere.cyan}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/canvas/beams/RotationTrails.tsx
git commit -m "feat: create RotationTrails particle effect for drag motion"
```

---

### Task 4.3: Integrate Beams into Scene

**Files:**
- Modify: `src/components/canvas/Scene.tsx`

**Step 1: Add imports**

```tsx
import { EnergyLines } from './beams/EnergyLines';
import { RotationTrails } from './beams/RotationTrails';
```

**Step 2: Add components before EffectComposer**

```tsx
<Sky />
<GPUParticles />
<EnergyLines />
<RotationTrails />
<Island />

{/* Post-processing effects */}
<EffectComposer>
```

**Step 3: Verify in browser**

- Energy lines should connect Arc Reactor to pit stop positions
- Active section's line should be brighter
- Dragging should emit particle trails from shoulders/helmet

**Step 4: Commit**

```bash
git add src/components/canvas/Scene.tsx
git commit -m "feat: integrate EnergyLines and RotationTrails into Scene"
```

---

## Phase 5: Polish & Performance

### Task 5.1: Extend Zustand Store with Effect State

**Files:**
- Modify: `src/store/islandStore.ts`

**Step 1: Add rotationVelocity to store**

```tsx
import { create } from 'zustand';
import { SectionType } from '../types/island';

interface IslandStore {
  rotationY: number;
  targetRotation: number;
  activeSection: SectionType | null;
  isRotating: boolean;
  isDragging: boolean;
  rotationVelocity: number; // NEW: for particle flow direction
  qualityLevel: 'high' | 'medium' | 'low'; // NEW: for performance scaling

  setRotation: (rotation: number) => void;
  setTargetRotation: (rotation: number) => void;
  setActiveSection: (section: SectionType | null) => void;
  startDrag: () => void;
  endDrag: () => void;
  startRotating: () => void;
  endRotating: () => void;
  setRotationVelocity: (velocity: number) => void; // NEW
  setQualityLevel: (level: 'high' | 'medium' | 'low') => void; // NEW
}

export const useIslandStore = create<IslandStore>((set) => ({
  rotationY: 0,
  targetRotation: 0,
  activeSection: null,
  isRotating: false,
  isDragging: false,
  rotationVelocity: 0,
  qualityLevel: 'high',

  setRotation: (rotation) => set({ rotationY: rotation }),
  setTargetRotation: (rotation) => set({ targetRotation: rotation }),
  setActiveSection: (section) => set({ activeSection: section }),
  startDrag: () => set({ isDragging: true }),
  endDrag: () => set({ isDragging: false }),
  startRotating: () => set({ isRotating: true }),
  endRotating: () => set({ isRotating: false }),
  setRotationVelocity: (velocity) => set({ rotationVelocity: velocity }),
  setQualityLevel: (level) => set({ qualityLevel: level }),
}));
```

**Step 2: Commit**

```bash
git add src/store/islandStore.ts
git commit -m "feat: extend store with rotationVelocity and qualityLevel"
```

---

### Task 5.2: Add Quality Scaling Hook

**Files:**
- Create: `src/hooks/useQualityScaling.ts`

**Step 1: Create useQualityScaling.ts**

```tsx
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIslandStore } from '../store/islandStore';

export const useQualityScaling = () => {
  const setQualityLevel = useIslandStore((state) => state.setQualityLevel);

  const fpsRef = useRef({
    frames: 0,
    lastTime: performance.now(),
    fps: 60,
  });

  useFrame(() => {
    fpsRef.current.frames++;

    const now = performance.now();
    const elapsed = now - fpsRef.current.lastTime;

    // Calculate FPS every second
    if (elapsed >= 1000) {
      const fps = (fpsRef.current.frames * 1000) / elapsed;
      fpsRef.current.fps = fps;
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;

      // Adjust quality based on FPS
      if (fps < 30) {
        setQualityLevel('low');
      } else if (fps < 50) {
        setQualityLevel('medium');
      } else {
        setQualityLevel('high');
      }
    }
  });

  return fpsRef.current.fps;
};
```

**Step 2: Commit**

```bash
git add src/hooks/useQualityScaling.ts
git commit -m "feat: add useQualityScaling hook for dynamic performance adjustment"
```

---

### Task 5.3: Create Effects Index and Final Scene Integration

**Files:**
- Create: `src/components/canvas/effects/index.ts`
- Create: `src/components/canvas/particles/index.ts`
- Create: `src/components/canvas/beams/index.ts`

**Step 1: Create index files for clean imports**

`src/components/canvas/effects/index.ts`:
```tsx
export { ArcReactorGlow } from './ArcReactorGlow';
export { RepulsorGlow } from './RepulsorGlow';
```

`src/components/canvas/particles/index.ts`:
```tsx
export { GPUParticles } from './GPUParticles';
```

`src/components/canvas/beams/index.ts`:
```tsx
export { EnergyLines } from './EnergyLines';
export { RotationTrails } from './RotationTrails';
```

**Step 2: Final Scene.tsx cleanup**

Update imports to use index files:
```tsx
import { GPUParticles } from './particles';
import { EnergyLines, RotationTrails } from './beams';
```

**Step 3: Commit**

```bash
git add src/components/canvas/effects/index.ts src/components/canvas/particles/index.ts src/components/canvas/beams/index.ts src/components/canvas/Scene.tsx
git commit -m "chore: add index files for clean component imports"
```

---

### Task 5.4: Final Testing and Tuning

**Step 1: Run full build to check for errors**

Run:
```bash
cd /home/Bhargav/Documents/personal/portfolio && pnpm build
```

Expected: Build completes without errors

**Step 2: Test in production mode**

Run:
```bash
pnpm preview
```

Expected: All effects render correctly, 60fps on modern hardware

**Step 3: Visual verification checklist**

- [ ] Arc Reactor pulses with visible bloom glow
- [ ] Repulsors on both hands glow, brighter when Projects/Contact active
- [ ] 3000 particles orbit around suit smoothly
- [ ] Particles flow toward active section
- [ ] Energy lines connect reactor to all 5 pit stop directions
- [ ] Active section's energy line is brighter
- [ ] Dragging creates particle trails from shoulders/helmet
- [ ] Bloom effect visible on all emissive elements
- [ ] No performance issues (check DevTools Performance tab)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete portfolio effects enhancement

- Selective bloom on Arc Reactor, repulsors, and particles
- 3000 GPU particles with orbital motion and section attraction
- Energy lines from reactor to all pit stops
- Rotation trails on drag interaction
- Quality scaling for performance

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Arc Reactor visibly pulses with bloom glow
- [ ] Active section body part has colored halo
- [ ] 3000+ particles orbit suit smoothly at 60fps
- [ ] Particles react to section activation (attraction)
- [ ] Energy lines connect reactor to pit stops
- [ ] Active line is visually brighter
- [ ] Rotation creates trailing motion effect
- [ ] Quality scales down gracefully on weaker hardware
- [ ] Build succeeds with no TypeScript errors
- [ ] Mobile fallback unaffected (no 3D on mobile)
