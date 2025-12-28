# Tech/Cyberpunk Island Portfolio - Design Document

**Date:** 2025-12-28
**Designer:** Claude + Bhargav Mantha
**Goal:** Create an immersive 3D rotating island portfolio with cyberpunk aesthetic for FAANG recruitment

---

## Executive Summary

A tech/cyberpunk floating island that serves as an interactive 3D portfolio. Users navigate 5 color-coded "pit stops" by dragging to rotate the island or clicking navigation buttons. Each pit stop represents a portfolio section with glassmorphic content overlays. Desktop-first with full 3D experience, mobile gets clean 2D fallback.

**Key Design Decisions:**

- ✅ Custom tech/cyberpunk island model (sourced from Sketchfab)
- ✅ 5 color-coded pit stops (Hero, About, Experience, Projects, Contact)
- ✅ Hybrid navigation (drag-to-rotate + button clicks)
- ✅ Glassmorphic panels with neon accents
- ✅ Interactive atmosphere (data particles, drones, holograms, light beams)
- ✅ Desktop-first, 2D mobile fallback
- ✅ Progressive loading (content first, 3D fades in)

---

## Section 1: Core Concept

### The Experience

A rotating **tech/cyberpunk floating island** serves as the portfolio's centerpiece. The island features 5 distinct "pit stops" - tech platforms that glow with signature colors as you rotate:

1. **Hero Station** (Purple #915EFF) - Center platform, introduction
2. **About Station** (Blue #2b77e7) - Skills and background
3. **Experience Station** (Orange #ff6b35) - Work history
4. **Projects Station** (Green #00ff88) - Featured work
5. **Contact Station** (Magenta #f272c8) - Get in touch

### Navigation Model

**Desktop:**

- Drag island left/right to rotate (smooth momentum/inertia)
- Click navbar buttons for instant snap to section
- Auto-snap to nearest pit stop when drag released

**Mobile:**

- Clean 2D fallback (vertical scrolling sections)
- No 3D overhead - optimized for battery and performance
- Same content, different presentation

### Atmosphere

The island floats in a cyberpunk space environment with:

- Animated nebula/star field sky dome
- Floating data particle streams (binary/hex characters)
- Hovering drones circling the island
- Holographic code screens between platforms
- Pulsing light beams connecting platforms
- Interactive glow effects responding to mouse position

### Visual Feedback

As you rotate:

- Active pit stop's platform pulses brighter (emissive glow)
- Tech panels light up
- Glassmorphic content panel slides in from side
- Other platforms dim slightly for depth
- Holographic label appears above active platform

---

## Section 2: Technical Architecture

### Tech Stack

**Core:**

- React 18 + TypeScript
- Three.js + React Three Fiber (R3F)
- React Three Drei (helper components)
- Zustand (state management)
- Framer Motion (UI animations)
- Tailwind CSS + Glassmorphism design system

**Build:**

- Vite 5.x
- PNPM package manager

### Component Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── Island.tsx              // Main island model + rotation logic
│   │   ├── Sky.tsx                 // Animated nebula background
│   │   ├── Atmosphere/
│   │   │   ├── DataParticles.tsx   // Floating data streams
│   │   │   ├── Drones.tsx          // Hovering scout drones
│   │   │   ├── Holograms.tsx       // Floating code screens
│   │   │   └── LightBeams.tsx      // Energy connections
│   │   └── Scene.tsx               // R3F Canvas wrapper
│   ├── ui/
│   │   ├── Navbar.tsx              // Pit stop navigation
│   │   ├── ContentPanel.tsx        // Glassmorphic overlay
│   │   ├── LoadingScreen.tsx       // Progressive reveal
│   │   └── MobileFallback.tsx      // 2D mobile experience
│   └── sections/
│       ├── HeroContent.tsx
│       ├── AboutContent.tsx
│       ├── ExperienceContent.tsx
│       ├── ProjectsContent.tsx
│       └── ContactContent.tsx
├── store/
│   └── islandStore.ts              // Zustand state
├── constants/
│   ├── colors.ts                   // Cyberpunk theme
│   ├── content.ts                  // Portfolio data
│   └── pitStops.ts                 // Rotation angles
├── utils/
│   ├── rotationUtils.ts            // Rotation calculations
│   └── performanceMonitor.ts       // FPS tracking
└── hooks/
    ├── useIslandRotation.ts        // Drag & rotation logic
    └── useResponsive.ts            // Desktop/mobile detection
```

### State Management

```typescript
// Zustand store
interface IslandStore {
  rotationY: number;           // Current rotation (0-360°)
  targetRotation: number;      // Target for smooth transitions
  activeSection: SectionType;  // Which pit stop is active
  isRotating: boolean;         // Animating to target?
  isDragging: boolean;         // User actively dragging?

  // Actions
  setRotation: (angle: number) => void;
  startDrag: () => void;
  endDrag: () => void;
  snapToSection: (section: SectionType) => void;
}
```

---

## Section 3: Rotation & Pit Stop Detection

### Pit Stop Positioning

Each pit stop is positioned at specific rotation angles around the island's Y-axis:

```typescript
const PIT_STOP_ANGLES = {
  hero: 0°,        // Front-facing (starting position)
  about: 72°,      // 360° / 5 sections = 72° spacing
  experience: 144°,
  projects: 216°,
  contact: 288°,
};

const SNAP_THRESHOLD = 36°;  // ±36° detection range
```

### Drag Interaction Flow

1. **Mouse Down** → Start tracking mouse position
2. **Mouse Move** → Calculate delta: `deltaX * sensitivity (0.5)` → Apply to rotation
3. **Mouse Up** → Calculate momentum from last few frames → Apply decay animation
4. **Auto-Snap** → Find nearest pit stop → Smooth ease to exact angle (0.8s duration)

### Button Navigation

1. User clicks "Experience" button
2. Calculate current rotation vs target (144°)
3. Determine shortest path (clockwise or counter-clockwise)
4. Animate rotation with easeInOutCubic (1.2s duration)
5. Snap precisely to 144°

### Active Section Detection

```typescript
function detectActiveSection(rotationY: number): SectionType {
  // Normalize to 0-360°
  const normalized = ((rotationY % 360) + 360) % 360;

  // Find nearest pit stop within threshold
  for (const [section, angle] of Object.entries(PIT_STOP_ANGLES)) {
    const diff = Math.abs(normalized - angle);
    const wrappedDiff = Math.abs(360 - diff);
    const minDiff = Math.min(diff, wrappedDiff);

    if (minDiff <= SNAP_THRESHOLD) {
      return section as SectionType;
    }
  }

  return null; // Between sections
}
```

### Visual Feedback System

When section becomes active:

- Platform emissive intensity: 0.5 → 1.0 (200ms)
- Holographic label fades in above platform (300ms)
- Glassmorphic panel slides in (400ms ease-out)
- Other platforms dim: 1.0 → 0.6 opacity

---

## Section 4: Interactive Atmosphere

### 1. Animated Sky Dome

**Appearance:**

- Cyberpunk nebula gradient (purple → cyan → magenta)
- Twinkling stars (opacity pulse 0.6-1.0, 2-4s intervals)
- Slowly rotating cloud layers (0.1 RPM)

**Implementation:**

- Sphere geometry (radius: 500, inverted normals)
- Custom shader with noise-based clouds
- Parallax effect: rotates 30% speed of island (depth illusion)

### 2. Data Particle Streams

**Appearance:**

- ~500 small cubes/spheres (0.05 units)
- Emissive glow matching nearest pit stop color
- Binary/hex characters as textures (0/1, A-F)

**Behavior:**

- Flow in curved Bézier paths around island
- Varying speeds (0.5-2.0 units/sec) creates depth
- Color transitions as they pass different pit stops
- Respawn when reaching path end (infinite loop)

**Performance:**

- InstancedMesh for single draw call
- BufferGeometry with custom attributes
- Update positions in compute shader if available

### 3. Hovering Drones (3-4 units)

**Appearance:**

- Small geometric drones (octahedron + details)
- Rotating scanner element (10 RPM)
- Searchlight beam pointing at island (spotlight + cone mesh)

**Behavior:**

- Figure-8 orbital paths at different heights
- Idle bobbing animation (sin wave, 0.1 amplitude)
- React to mouse: turn spotlight toward cursor

**Technical:**

- Predefined spline paths (CatmullRomCurve3)
- Position calculated from time: `path.getPointAt(t)`

### 4. Holographic Code Screens (2-3 panels)

**Appearance:**

- Semi-transparent floating panels (1.5 x 2 units)
- Scrolling code from real projects
- Syntax highlighting (JavaScript/TypeScript)
- Scan-line overlay (animated UV offset)
- Glitch effect on edges (distortion shader)

**Content:**

- Actual code snippets from GitHub repos
- Randomized scroll speed per panel
- Occasional "glitch" animation (200ms every 5-10s)

**Positioning:**

- Placed between pit stops (36°, 108°, 180°, 252°, 324°)
- Float at varying heights (y: 2-4 units)

### 5. Energy Light Beams

**Appearance:**

- Thin laser-like beams (0.02 radius)
- Connect each pit stop to adjacent ones (pentagon shape)
- Pulsing energy animation travels along length

**Implementation:**

- TubeGeometry following paths between platforms
- Custom shader: animated gradient along UV.x
- Pulse speed: 2 units/sec
- Emissive intensity: 0.8 base, 1.5 on hover

**Interaction:**

- Brighten when hovering over connected pit stop
- Pulse accelerates when section is active

### 6. Interactive Mouse Effects

**Hover Effects:**

- Tech panels glow brighter (emissive +0.3)
- Particles within 2-unit radius attracted to cursor (subtle pull)
- Platform materials shimmer (normal map intensity flicker)

**Click Effects:**

- Ripple emanates from click point on platforms
- Ring expands outward (0 → 2 units radius over 0.5s)
- Particles burst away from impact point

**Performance Budget:**

- Target: 60fps on RTX 3060 / M1 MacBook Pro
- Dynamic quality scaling if FPS drops below 55
- Reduce particle count first, then effects, then shadows

---

## Section 5: Content Panels & UI

### Glassmorphic Panel System

**Visual Design:**

- 400px width, full viewport height
- Position: Fixed right, slides in from off-screen
- Background: `rgba(21, 16, 48, 0.7)` (70% opacity)
- Backdrop filter: `blur(20px)` + `-webkit-backdrop-filter`
- Border: 2px solid, color matches active section
- Border glow: `box-shadow: 0 0 20px [sectionColor]`
- Scan-line overlay: Animated pseudo-element (subtle)

**Animation:**

- Slide in: translateX(450px) → 0, easeOutCubic, 400ms
- Slide out: translateX(0) → 450px, easeInCubic, 300ms
- Content fade-in: opacity 0 → 1, 200ms delay

**Panel Structure:**

```tsx
<ContentPanel color={sectionColor}>
  <PanelHeader>
    <SectionIcon /> {/* Unique icon per section */}
    <Title>{section.title}</Title>
    <GlitchLine /> {/* Animated decorative element */}
  </PanelHeader>

  <PanelBody className="scrollable">
    {/* Section-specific content */}
  </PanelBody>

  <PanelFooter>
    <NavigationHints>
      ← Drag to rotate  |  Click sections to jump →
    </NavigationHints>
  </PanelFooter>
</ContentPanel>
```

### Section Content Details

#### Hero Panel (Purple)

```tsx
<HeroContent>
  <TypewriterText text="Bhargav Mantha" speed={100ms} />
  <Subtitle>Technical Lead</Subtitle>
  <Tagline>I Build Systems That Scale</Tagline>
  <MetricsGrid>
    <Metric value="800+" label="TPS" color="cyan" />
    <Metric value="40+" label="Microservices" color="magenta" />
    <Metric value="73%" label="Performance ↑" color="green" />
    <Metric value="14" label="Zero-Downtime" color="purple" />
  </MetricsGrid>
  <CTAButton variant="neon">Explore My Work</CTAButton>
</HeroContent>
```

#### About Panel (Blue)

```tsx
<AboutContent>
  <Bio>2-3 sentences about background and expertise</Bio>
  <SkillsSection>
    <SkillCategory title="Frontend">
      <SkillPill>Angular</SkillPill>
      <SkillPill>React</SkillPill>
      {/* ... */}
    </SkillCategory>
    {/* Backend, Data, Infrastructure */}
  </SkillsSection>
  <Achievements>
    <Badge>Certifications</Badge>
    {/* ... */}
  </Achievements>
</AboutContent>
```

#### Experience Panel (Orange)

```tsx
<ExperienceContent>
  <Timeline vertical>
    <ExperienceCard>
      <Company>Delivery Solutions</Company>
      <Role>Associate Technical Lead</Role>
      <Period>Mar 2022 - Present</Period>
      <Achievements>
        <li>Architected 800+ TPS microservices</li>
        <li>73% performance boost, 34% cost reduction</li>
        {/* ... */}
      </Achievements>
      <TechTags>
        <Tag>NestJS</Tag>
        <Tag>AWS</Tag>
        {/* ... */}
      </TechTags>
    </ExperienceCard>
    {/* More companies */}
  </Timeline>
</ExperienceContent>
```

#### Projects Panel (Green)

```tsx
<ProjectsContent>
  <FeaturedProjects>
    <ProjectCard featured>
      <CategoryBadge>AI/ML</CategoryBadge>
      <ProjectTitle>Life-Optimization System</ProjectTitle>
      <Description>AI-Powered Life Graph Database with RAG</Description>
      <TechStack>
        <Tag>NestJS</Tag>
        <Tag>Neo4j</Tag>
        <Tag>LangChain</Tag>
      </TechStack>
      <Links>
        <GithubLink />
        <LiveDemo />
      </Links>
    </ProjectCard>
    {/* More projects */}
  </FeaturedProjects>
</ProjectsContent>
```

#### Contact Panel (Magenta)

```tsx
<ContactContent>
  <Headline>Let's Build Something Amazing</Headline>
  <ContactLinks>
    <NeonButton href="mailto:...">Email</NeonButton>
    <NeonButton href="https://linkedin...">LinkedIn</NeonButton>
    <NeonButton href="https://github...">GitHub</NeonButton>
    <NeonButton href="https://dev.to...">Blog</NeonButton>
  </ContactLinks>
  <SocialProof>
    <Stat>14K+ Blog Views</Stat>
    <Stat>GitHub Stars</Stat>
  </SocialProof>
</ContactContent>
```

### Navbar (Fixed Top)

**Design:**

- Glassmorphic bar, horizontally centered
- Width: max-content, padding: 32px 48px
- Position: Fixed top, margin-top: 32px
- Background: Same glassmorphism as panels

**Structure:**

```tsx
<Navbar>
  <Logo>BM</Logo>
  <NavButtons>
    <NavButton
      active={activeSection === 'hero'}
      onClick={() => snapToSection('hero')}
    >
      Home
    </NavButton>
    {/* About, Experience, Projects, Contact */}
  </NavButtons>
</Navbar>
```

**Active State:**

- Text color: Section color (cyan for active)
- Underline: 2px, same color, animated width
- Glow effect: `text-shadow: 0 0 10px [color]`

**Responsive:**

- Tablet (<1024px): Reduce padding, smaller font
- Mobile: Handled by MobileFallback component instead

---

## Section 6: Mobile Fallback (2D Experience)

### Detection Logic

```typescript
const isMobile = () => {
  return (
    window.innerWidth < 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};
```

### Mobile Layout Structure

```tsx
<MobilePortfolio>
  <MobileHeader sticky>
    <Logo>BM</Logo>
    <HamburgerMenu>
      {/* Scrollspy navigation */}
      <MenuItem href="#hero">Home</MenuItem>
      <MenuItem href="#about">About</MenuItem>
      {/* ... */}
    </HamburgerMenu>
  </MobileHeader>

  <MobileHero id="hero" fullscreen>
    <AnimatedGradient colors={['purple', 'cyan', 'magenta']} />
    <HeroContent isMobile />
  </MobileHero>

  <Section id="about" accentColor="blue">
    <SectionHeader>About</SectionHeader>
    <AboutContent isMobile />
  </Section>

  <Section id="experience" accentColor="orange">
    <SectionHeader>Experience</SectionHeader>
    <ExperienceContent isMobile />
  </Section>

  <Section id="projects" accentColor="green">
    <SectionHeader>Projects</SectionHeader>
    <ProjectsContent isMobile />
  </Section>

  <Section id="contact" accentColor="magenta">
    <SectionHeader>Contact</SectionHeader>
    <ContactContent isMobile />
  </Section>

  <MobileFooter>
    <Copyright>© 2025 Bhargav Mantha</Copyright>
  </MobileFooter>
</MobilePortfolio>
```

### Visual Treatment

**Section Styling:**

- Full-width sections, vertical scroll
- Top border: 4px solid [sectionColor]
- Background gradient: `linear-gradient(180deg, rgba([color], 0.1) 0%, transparent 100%)`
- Padding: 60px 24px

**Scroll Behavior:**

- Smooth scroll enabled
- Scroll snap: `scroll-snap-type: y mandatory`
- Each section: `scroll-snap-align: start`

**Intersection Observer:**

- Tracks visible section
- Updates hamburger menu active state
- Triggers fade-in animations on scroll

**Component Reuse:**

- Same HeroContent, AboutContent, etc. components
- Props: `isMobile={true}` adjusts layout:
  - Metrics grid: 2 columns instead of 4
  - Experience timeline: Simplified cards
  - Project cards: Stack vertically
  - Skill pills: Wrap naturally

### Benefits

- **Performance:** No 3D rendering overhead
- **Battery:** Minimal animations, static layout
- **Accessibility:** Traditional scroll navigation
- **Universal:** Works on any device
- **Professional:** Clean, readable design

---

## Section 7: Performance & Optimization

### Progressive Loading Strategy

**Phase 1: Instant (0-100ms)**

- Render navbar (static HTML/CSS)
- Show minimal loading indicator
- Start preloading 3D assets (island.glb in background)

**Phase 2: Content First (100-500ms)**

- Render Hero glassmorphic panel immediately
- User can read content while 3D loads
- No perceived wait time

**Phase 3: 3D Fade-In (500ms-2s)**

- Island model loaded → fade in with opacity animation
- Start with low-poly LOD (Level of Detail)
- Swap to high-poly when fully loaded
- Sky dome renders (simple gradient first)

**Phase 4: Atmospheric Enhancement (2s-4s)**

- Add particle systems progressively (data streams first)
- Spawn drones one at a time
- Enable holographic screens
- Activate light beams
- Full interactive experience ready

### 3D Asset Optimization

**Island Model:**

- Target: <2MB GLB file size
- Use Draco compression (geometry compression)
- Texture atlas: Combine textures into single 2048x2048 map
- Normal maps for detail instead of high-poly geometry
- Remove unused materials/vertices in Blender

**Sky Dome:**

- Simple gradient shader (no texture needed)
- Noise function for cloud effect (GLSL)
- Minimal geometry (sphere with 32 segments)

**Textures:**

- Use compressed formats (WebP where supported)
- Mipmaps for distant objects
- Max resolution: 2048x2048 for main textures
- 512x512 for detail/effects

### Rendering Optimizations

**Frustum Culling:**

- Automatically handled by Three.js
- Don't render objects outside camera view

**InstancedMesh Usage:**

- Data particles: Single draw call for 500 particles
- Light beam segments: Instanced tube geometry
- Tech panel details: Instanced decorative elements

**LOD (Level of Detail) System:**

```typescript
const LOD_DISTANCES = {
  high: 0-15 units,   // High-poly island, all effects
  medium: 15-30 units, // Mid-poly island, 50% particles
  low: 30+ units,     // Low-poly island, minimal effects
};
```

**Shadow Optimization:**

- Only island casts shadows (platforms on ground plane)
- Atmosphere elements don't cast shadows
- Shadow map resolution: 1024x1024 (balanced quality)

### Dynamic Quality Scaling

**FPS Monitoring:**

```typescript
let frameCount = 0;
let lastTime = performance.now();

function monitorFPS() {
  frameCount++;
  const currentTime = performance.now();

  if (currentTime >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

    if (fps < 55) {
      reduceQuality();
    } else if (fps > 58 && qualityReduced) {
      restoreQuality();
    }

    frameCount = 0;
    lastTime = currentTime;
  }
}
```

**Quality Reduction Steps:**

1. Reduce particle count: 500 → 250 (50%)
2. Disable shadows
3. Lower texture resolution: 2048 → 1024
4. Reduce hologram count: 3 → 1
5. Simplify drone paths (fewer curve points)
6. Disable interactive mouse effects

### Memory Management

**Geometry Disposal:**

```typescript
function disposeGeometry(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => m.dispose());
  } else {
    mesh.material.dispose();
  }
}
```

**Texture Cleanup:**

- Dispose textures when switching models
- Reuse particle textures across systems
- Lazy-load holographic screen content (don't load until visible)

**Animation Limits:**

- Max 3 concurrent Framer Motion animations
- Throttle mouse move events (16ms / 60fps)
- Debounce resize events (200ms)

### Performance Targets

**Desktop (RTX 3060 / M1 MacBook Pro):**

- 60fps sustained
- Initial load: <2s on 4G connection
- Time to Interactive (content readable): <1s
- Total memory: <100MB

**Lower-end Desktop (GTX 1660):**

- 45-60fps with quality scaling
- Acceptable experience with reduced effects

**Mobile:**

- 2D fallback (no 3D performance needed)
- <500KB HTML/CSS/JS bundle
- <1s initial load on 4G

---

## Section 8: Development Workflow

### Phase 1: Foundation (Days 1-2)

**Setup:**

- Initialize Vite + React + TypeScript project
- Install Three.js, R3F, Drei, Zustand, Framer Motion
- Set up Tailwind + glassmorphism design system
- Create project structure (components, store, utils)

**Basic Scene:**

- R3F Canvas with basic lighting
- Simple test cube to verify 3D rendering
- Navbar skeleton (static HTML)
- Mobile detection logic

**Deliverable:** Basic 3D scene rendering, project scaffolding complete

### Phase 2: Island Integration (Days 3-4)

**Model Sourcing:**

- Search Sketchfab for "sci-fi platform", "cyberpunk base", "tech island"
- Download 2-3 candidates (free Creative Commons licensed)
- Test in Blender: check poly count, materials, size
- Optimize: Reduce poly count if needed, apply Draco compression
- Export optimized GLB

**Island Component:**

- useGLTF loader for island model
- Basic rotation controls (keyboard arrows for testing)
- Material adjustments (emissive colors per platform)
- Position/scale island correctly in scene

**Camera Setup:**

- Fixed camera position (slight angle looking down at island)
- Appropriate FOV (45-60°)
- Prevent user camera movement (disable OrbitControls)

**Deliverable:** Island model loaded and rotating smoothly

### Phase 3: Rotation Mechanics (Days 5-6)

**Drag-to-Rotate:**

- useIslandRotation custom hook
- Track mouse down/move/up events
- Convert mouse delta to rotation angle
- Apply momentum on release (decay animation)
- Prevent rotation during button navigation

**Auto-Snap:**

- Detect nearest pit stop angle
- Smooth ease to exact angle (easeInOutCubic)
- Debounce snap (wait for rotation to slow)

**Button Navigation:**

- Calculate shortest rotation path
- Animate to target angle (1.2s duration)
- Disable drag during animation

**Zustand Store:**

- Implement islandStore with rotation state
- Actions: setRotation, startDrag, endDrag, snapToSection

**Deliverable:** Smooth drag-to-rotate + button navigation working

### Phase 4: Pit Stop Detection & Content Panels (Days 7-9)

**Section Detection:**

- detectActiveSection() utility function
- Update activeSection in store when rotation changes
- Visual feedback: brighten active platform material

**Glassmorphic Panels:**

- ContentPanel component with slide-in animation
- Reusable structure (header, body, footer)
- Section-specific color theming

**Content Components:**

- HeroContent with metrics grid
- AboutContent with skills
- ExperienceContent with timeline
- ProjectsContent with cards
- ContactContent with links

**Panel Behavior:**

- Slide in when section becomes active
- Slide out when rotating away
- Scrollable if content exceeds viewport

**Deliverable:** All 5 sections with working content panels

### Phase 5: Atmospheric Elements (Days 10-12)

**Sky Dome:**

- Inverted sphere with custom shader
- Animated nebula gradient
- Twinkling stars

**Data Particles:**

- InstancedMesh particle system
- Curved path following (Bézier curves)
- Color transitions based on proximity

**Drones:**

- Simple geometric models
- Figure-8 orbital paths (spline animation)
- Searchlight beams (SpotLight + cone mesh)

**Holograms:**

- Plane geometry with scrolling code texture
- Scan-line shader effect
- Positioned between pit stops

**Light Beams:**

- TubeGeometry connecting platforms
- Animated pulse shader

**Deliverable:** Full atmospheric environment operational

### Phase 6: Interactivity & Polish (Days 13-14)

**Mouse Interactions:**

- Hover glow on platforms
- Particle attraction to cursor
- Click ripple effects

**Animations:**

- Typewriter effect for hero text
- Staggered fade-in for metrics
- Card hover animations (lift + glow)

**Sound Effects (Optional):**

- Ambient cyberpunk background music
- UI click sounds
- Rotation whoosh sound

**Deliverable:** Polished, interactive experience

### Phase 7: Mobile Fallback (Day 15)

**Mobile Layout:**

- MobileFallback component
- Vertical scroll sections
- Hamburger menu with scrollspy
- Responsive content components

**Testing:**

- Test on real mobile devices
- Verify smooth scroll
- Check section detection
- Validate touch interactions

**Deliverable:** Fully functional mobile experience

### Phase 8: Performance Optimization (Days 16-17)

**Asset Optimization:**

- Compress GLB files with Draco
- Optimize textures (WebP, smaller sizes)
- Implement LOD system

**Code Optimization:**

- Lazy-load hologram content
- Implement dynamic quality scaling
- Add FPS monitoring
- Memory profiling and cleanup

**Bundle Optimization:**

- Code splitting (React.lazy)
- Tree shaking verification
- Analyze bundle with Vite plugin

**Deliverable:** 60fps on target hardware, optimized bundle

### Phase 9: Testing & Debugging (Days 18-19)

**Browser Testing:**

- Chrome, Firefox, Safari, Edge
- Desktop + mobile versions

**Performance Testing:**

- Lighthouse audit (aim for 90+ performance)
- WebPageTest analysis
- Real device testing (various hardware)

**Bug Fixes:**

- Rotation edge cases (360° wrap)
- Panel z-index issues
- Memory leaks
- Loading race conditions

**Deliverable:** Production-ready build

### Phase 10: Deployment (Day 20)

**Build:**

- Production build with Vite
- Verify bundle size (<2MB total)
- Test production build locally

**Deploy:**

- Vercel deployment (recommended)
- Configure custom domain
- Set up environment variables (if any)

**Documentation:**

- README with project overview
- Architecture documentation
- Deployment instructions

**Deliverable:** Live portfolio at custom domain

### Estimated Timeline

**Total: ~20 days (3-4 weeks)**

- Assumes full-time focus (6-8 hours/day)
- Buffer for unexpected challenges
- Can be compressed with partial-day work over longer period

### Risk Mitigation

**Risk: Can't find suitable island model**

- Backup: Use procedural geometry (platform shapes)
- Backup 2: Commission simple custom model ($50-100)

**Risk: Performance issues**

- Fallback: Reduce atmospheric elements
- Fallback 2: Simplify particle effects
- Always have 2D mobile version working

**Risk: Rotation mechanics feel janky**

- Iterate on sensitivity/momentum values
- Add option to disable auto-snap
- Provide keyboard navigation as alternative

---

## Success Criteria

### MVP (Minimum Viable Product)

✅ Island rotates smoothly via drag
✅ 5 pit stops correctly detected
✅ Content panels display for each section
✅ Navigation buttons work
✅ Mobile 2D fallback functional
✅ Loads in <3s on 4G

### Full Experience

✅ All atmospheric elements present and performant
✅ Interactive hover/click effects working
✅ 60fps on GTX 1660+ hardware
✅ Professional content in all sections
✅ Glassmorphic UI polished
✅ Deployed to custom domain

### Stretch Goals

🎯 Auto-rotate demo mode (slow rotation when idle)
🎯 Sound effects and ambient music
🎯 Particle morphing (abstract → technical on section change)
🎯 More detailed holographic content
🎯 Easter eggs (hidden interactions)

---

## Appendix: Color Reference

```typescript
export const colors = {
  pitStops: {
    hero: '#915EFF',      // Purple
    about: '#2b77e7',     // Blue
    experience: '#ff6b35', // Orange
    projects: '#00ff88',  // Green
    contact: '#f272c8',   // Magenta
  },

  atmosphere: {
    cyan: '#00cea8',
    purple: '#915EFF',
    magenta: '#f272c8',
  },

  background: {
    primary: '#050816',
    secondary: '#151030',
  },

  ui: {
    glassBackground: 'rgba(21, 16, 48, 0.7)',
    glassBlur: '20px',
  },
};
```

---

**End of Design Document**
