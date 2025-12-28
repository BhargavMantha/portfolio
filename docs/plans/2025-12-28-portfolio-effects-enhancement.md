# Portfolio Effects Enhancement Design

**Date:** 2025-12-28
**Branch:** `feature/portfolio-enhancements-v2`
**Goal:** Transform the Iron Man portfolio into a mind-blowing technology showcase with balanced, dynamic effects

---

## Overview

Enhance the existing 3D Iron Man portfolio with three core effect systems:

1. **Selective Bloom & Glow** - Arc Reactor pulses, active suit parts emit halos, neon UI edges
2. **GPGPU Particle System** - 5,000 GPU-computed particles forming energy field around suit
3. **Energy Trails & Beams** - Repulsor glows, reactor energy lines, rotation motion trails

**Aesthetic:** Balanced & Dynamic - noticeable effects that draw attention while remaining professional. The suit should look *powered on* and radiating energy.

**Approach:** Post-Processing Pipeline using `@react-three/postprocessing` (industry-standard pmndrs ecosystem)

---

## Section 1: Selective Bloom System

### Implementation

Add `EffectComposer` from `@react-three/postprocessing` wrapping the scene. Use selective bloom so only specific elements glow while the rest renders normally.

### Bloom Targets

| Element | Behavior | Color |
|---------|----------|-------|
| Arc Reactor | Constant soft pulse (0.8 → 1.2 intensity) | Warm white/cyan |
| Active Section Part | Colored bloom halo when pit stop active | Section color |
| HUD Labels | Neon border glow | Section color |
| Data Particles | Subtle ambient bloom | Cyan #00F5FF |

### Bloom Settings (Balanced)

```typescript
<Bloom
  intensity={1.5}           // Noticeable but not overwhelming
  luminanceThreshold={0.6}  // Only bright emissives bloom
  luminanceSmoothing={0.9}  // Smooth falloff
  radius={0.8}              // Medium spread
  levels={5}                // Quality/performance balance
/>
```

### Visual Result

The Arc Reactor becomes the "heart" of the suit with a warm glow pulse. When rotating to a section, that body part lights up with a colored halo. The overall effect communicates "this suit is powered on."

---

## Section 2: GPGPU Particle System

### Overview

Replace current 500 CPU-animated box particles with GPU-accelerated FBO particle system. All physics computed on GPU via shaders - zero CPU overhead.

### Particle Count & Performance

- **Target:** 5,000 particles at 60fps
- **Fallback:** Auto-scale to 2,000 → 500 if FPS drops
- **Rendering:** Single draw call via InstancedMesh

### Particle Behaviors

#### 1. Energy Field Particles (2,000 base)

- Orbit Iron Man suit in toroidal (donut) field
- Flow direction follows suit rotation momentum
- When dragging: particles accelerate in drag direction
- When idle: gentle swirling vortex pattern
- Color: Cyan (#00F5FF) with slight HSL variation

#### 2. Section Attraction

- When section activates: ~200 particles stream toward that body part
- Creates "power flowing to active system" effect
- Particles return to orbit on section change
- Uses attractor point in simulation shader

#### 3. Mouse Reactivity

- Particles within 50px radius of mouse cursor get pushed away
- Creates interactive "force field" feel
- Subtle repulsion - enhances exploration without distraction

### Technical Implementation

```
src/components/canvas/particles/
├── GPUParticles.tsx           # Main FBO particle component
├── shaders/
│   ├── simulation.frag        # Position/velocity compute shader
│   └── particle.vert          # Instanced vertex shader
│   └── particle.frag          # Color/opacity fragment shader
└── useParticleAttraction.ts   # Hook for section-based attraction
```

### Shader Uniforms

```glsl
// simulation.frag
uniform float uTime;
uniform float uDeltaTime;
uniform vec3 uAttractorPosition;  // Active section body part
uniform float uAttractorStrength; // 0 when no section, 1 when active
uniform vec3 uMousePosition;      // For repulsion
uniform float uRotationVelocity;  // Drag momentum
```

---

## Section 3: Energy Trails & Beams

### Beam Types

#### 1. Repulsor Glow (Hands)

- Both palms have soft circular glow points
- Constant gentle pulse (idle repulsors)
- **Projects section** (right hand): Brighter pulse + particle burst
- **Contact section** (left hand): Same effect
- Color: White core → cyan edge gradient
- Implementation: `<Sphere>` with emissive material + bloom

#### 2. Arc Reactor Energy Lines

- 5 thin lines extend from Arc Reactor toward each pit stop direction
- Semi-transparent with animated dash pattern (flowing outward)
- Active section's line: brighter (opacity 0.8) and thicker (2px)
- Inactive lines: subtle (opacity 0.3) and thin (1px)
- Implementation: `THREE.Line2` with `LineDashedMaterial` + custom shader

```typescript
// Line configuration per pit stop
const energyLines = [
  { angle: 0,   section: 'hero',       color: '#FFC107' },
  { angle: 72,  section: 'about',      color: '#00D4FF' },
  { angle: 144, section: 'experience', color: '#0096FF' },
  { angle: 216, section: 'projects',   color: '#0077B6' },
  { angle: 288, section: 'contact',    color: '#E0F4FF' },
];
```

#### 3. Rotation Trails

- When dragging: trailing particle ribbons follow the suit
- 3-4 streams from shoulders and helmet tips
- Fade out over 0.5 seconds after drag stops
- Color: Cyan base with subtle hue shift based on velocity
- Implementation: Particle trail system with recycled pool

### Visual Hierarchy

```
                    ┌─────────────────┐
                    │   Arc Reactor   │
                    │  (center glow)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ┌────────┐    ┌──────────┐   ┌────────┐
         │  Left  │    │  Energy  │   │ Right  │
         │  Hand  │    │  Lines   │   │  Hand  │
         │(Contact)│   │ (5 dirs) │   │(Projects)
         └────────┘    └──────────┘   └────────┘

    Rotation ──► Motion trails follow movement
```

---

## Section 4: Architecture

### File Structure

```
src/components/canvas/
├── Scene.tsx                      # Add EffectComposer wrapper
├── Island.tsx                     # Add emissive materials for bloom
├── effects/
│   ├── PostProcessing.tsx         # Bloom + effect configuration
│   ├── ArcReactorGlow.tsx         # Pulsing reactor core mesh
│   └── RepulsorGlow.tsx           # Hand glow point meshes
├── particles/
│   ├── GPUParticles.tsx           # FBO particle system
│   ├── shaders/
│   │   ├── simulation.frag        # GPU physics computation
│   │   ├── particle.vert          # Instanced positioning
│   │   └── particle.frag          # Color and opacity
│   └── useParticleAttraction.ts   # Section attraction hook
└── beams/
    ├── EnergyLines.tsx            # Arc Reactor → pit stop lines
    └── RotationTrails.tsx         # Motion ribbon particles
```

### Component Hierarchy

```tsx
<Canvas>
  <EffectComposer>
    <Scene>
      <ambientLight />
      <directionalLight /> {/* existing lights */}

      <Island>
        <ArcReactorGlow />
        <RepulsorGlow hand="left" />
        <RepulsorGlow hand="right" />
      </Island>

      <GPUParticles count={5000} />
      <EnergyLines activeSection={activeSection} />
      <RotationTrails isRotating={isDragging} velocity={velocity} />

      <Sky />
    </Scene>

    <Bloom intensity={1.5} luminanceThreshold={0.6} radius={0.8} />
  </EffectComposer>
</Canvas>
```

### State Extensions (Zustand)

```typescript
interface IslandStore {
  // Existing
  rotationY: number;
  targetRotation: number;
  activeSection: SectionType | null;
  isRotating: boolean;
  isDragging: boolean;

  // New for effects
  rotationVelocity: number;        // For particle flow direction
  mousePosition: Vector3 | null;   // For particle repulsion
  qualityLevel: 'high' | 'medium' | 'low';  // For dynamic scaling
}
```

---

## Section 5: Performance

### Budget Breakdown

| Effect | GPU Cost | Notes |
|--------|----------|-------|
| Bloom Pass | ~2ms | Single pass, 0.5x resolution |
| 5K Particles | ~1ms | FBO compute, 1 draw call |
| Energy Lines | ~0.5ms | 5 instanced lines |
| Rotation Trails | ~0.5ms | Recycled 200 particle pool |
| **Total Added** | **~4ms** | Well under 16ms (60fps) budget |

### Quality Scaling System

```typescript
// In useFrame or dedicated hook
const adjustQuality = (fps: number) => {
  if (fps < 30) {
    setQualityLevel('low');      // 500 particles, no trails
  } else if (fps < 50) {
    setQualityLevel('medium');   // 2000 particles, simple trails
  } else {
    setQualityLevel('high');     // 5000 particles, full effects
  }
};
```

### Quality Presets

| Level | Particles | Bloom Res | Trails | Energy Lines |
|-------|-----------|-----------|--------|--------------|
| High | 5,000 | Full | Yes | Animated dash |
| Medium | 2,000 | 0.5x | Simplified | Static |
| Low | 500 | 0.25x | Off | Static |

### Mobile Strategy

- Existing 2D fallback at <768px width continues
- No 3D effects on mobile (performance + touch UX)
- This is intentional: recruiters view on desktop

---

## Section 6: Dependencies

### New Packages

```bash
pnpm add @react-three/postprocessing postprocessing
```

### Version Compatibility

- `@react-three/postprocessing`: Latest (works with R3F 8.x)
- `postprocessing`: Latest (peer dependency)
- Existing Three.js 0.156.1 is compatible

---

## Implementation Order

### Phase 1: Post-Processing Foundation
1. Install dependencies
2. Add `EffectComposer` wrapper to Scene
3. Configure basic Bloom effect
4. Add emissive materials to Arc Reactor mesh
5. Verify bloom renders correctly

### Phase 2: Selective Bloom
1. Identify Arc Reactor mesh in Iron Man model
2. Add `ArcReactorGlow` component with pulsing emissive
3. Add emissive highlighting to active section body parts
4. Add bloom to HUD labels

### Phase 3: GPGPU Particles
1. Create FBO particle simulation infrastructure
2. Implement orbital motion in shader
3. Add rotation velocity influence
4. Add section attraction behavior
5. Add mouse repulsion
6. Replace old DataParticles component

### Phase 4: Energy Beams
1. Create `EnergyLines` with animated dash pattern
2. Add active section highlighting
3. Create `RepulsorGlow` components for hands
4. Implement `RotationTrails` particle ribbons

### Phase 5: Polish & Performance
1. Add quality scaling system
2. Tune all effect intensities
3. Performance testing on various hardware
4. Final visual polish

---

## Success Criteria

- [ ] Arc Reactor visibly pulses with bloom glow
- [ ] Active section body part has colored halo
- [ ] 5,000 particles orbit suit smoothly at 60fps
- [ ] Particles react to mouse and flow with rotation
- [ ] Energy lines connect reactor to pit stops
- [ ] Active line is visually distinct
- [ ] Rotation creates trailing motion effect
- [ ] Quality scales down gracefully on weaker hardware
- [ ] No visual regressions on existing functionality
- [ ] Mobile fallback unaffected

---

## References

- [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) - Effect library
- [Selective Bloom Tutorial](https://waelyasmina.net/articles/unreal-bloom-selective-threejs-post-processing/)
- [Maxime Heckel's Particles](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/) - FBO techniques
- [wawa-vfx](https://wawasensei.dev/blog/wawa-vfx-open-source-particle-system-for-react-three-fiber-projects) - Particle inspiration
