import { SectionType } from '../types/island';

/**
 * Universe Configuration
 *
 * Each universe represents a distinct visual environment inspired by MCU Iron Man moments.
 * Configurations include background colors, fog settings, and particle systems.
 */

export interface UniverseConfig {
  name: string;
  backgroundColor: string;
  particleCount: number;
  particleCountMobile: number;
  particleColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

/**
 * Universe Definitions
 *
 * Based on design document:
 * - Hero: "The Portal" (Purple #915EFF - Avengers 2012 space portal)
 * - About: "The Workshop" (Blue #2b77e7 - Arc reactor creation)
 * - Experience: "The Battle" (Orange #ff6b35 - Battle of New York)
 * - Projects: "The Forge" (Green #00ff88 - Mark suit assembly)
 * - Contact: "The Tower" (Magenta #f272c8 - Stark Tower comms)
 */
export const UNIVERSES: Record<SectionType, UniverseConfig> = {
  hero: {
    name: 'The Portal',
    backgroundColor: '#0a1428', // Deep space blue
    particleCount: 2000,
    particleCountMobile: 1000, // 50% reduction for mobile
    particleColor: '#ffa500', // Golden/orange portal energy
    fogColor: '#0a1428',
    fogNear: 10,
    fogFar: 30,
  },
  about: {
    name: 'The Workshop',
    backgroundColor: '#1a0f2e', // Purple/blue nebula
    particleCount: 1500,
    particleCountMobile: 750,
    particleColor: '#00d4ff', // Cyan holographic
    fogColor: '#1a0f2e',
    fogNear: 10,
    fogFar: 30,
  },
  experience: {
    name: 'The Battle',
    backgroundColor: '#2e1410', // Orange/red energy space
    particleCount: 2500,
    particleCountMobile: 1250,
    particleColor: '#ff6b35', // Orange sparks/embers
    fogColor: '#2e1410',
    fogNear: 10,
    fogFar: 30,
  },
  projects: {
    name: 'The Forge',
    backgroundColor: '#0f1e14', // Dark space with green tint
    particleCount: 2000,
    particleCountMobile: 1000,
    particleColor: '#00ff88', // Green energy/code particles
    fogColor: '#0f1e14',
    fogNear: 10,
    fogFar: 30,
  },
  contact: {
    name: 'The Tower',
    backgroundColor: '#1e0f1a', // Space station environment
    particleCount: 1200,
    particleCountMobile: 600,
    particleColor: '#f272c8', // Magenta communication beams
    fogColor: '#1e0f1a',
    fogNear: 10,
    fogFar: 30,
  },
};
