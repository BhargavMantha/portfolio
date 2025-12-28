import { PitStop } from '../types/island';
import { colors } from './colors';

export const PIT_STOPS: Record<PitStop['id'], PitStop> = {
  hero: {
    id: 'hero',
    angle: 0,
    color: colors.pitStops.hero,
    label: 'Home',
  },
  about: {
    id: 'about',
    angle: 72,
    color: colors.pitStops.about,
    label: 'About',
  },
  experience: {
    id: 'experience',
    angle: 144,
    color: colors.pitStops.experience,
    label: 'Experience',
  },
  projects: {
    id: 'projects',
    angle: 216,
    color: colors.pitStops.projects,
    label: 'Projects',
  },
  contact: {
    id: 'contact',
    angle: 288,
    color: colors.pitStops.contact,
    label: 'Contact',
  },
};

export const SNAP_THRESHOLD = 36; // ±36° for section detection
export const ROTATION_SENSITIVITY = 0.5; // Mouse delta multiplier
export const MOMENTUM_DECAY = 0.95; // Velocity decay per frame
export const SNAP_DURATION = 0.8; // Seconds for auto-snap animation
export const NAV_DURATION = 1.2; // Seconds for button navigation
