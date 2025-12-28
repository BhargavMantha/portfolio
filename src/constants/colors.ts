export const colors = {
  pitStops: {
    hero: '#FFC107',      // Vibrant Gold (Iron Man)
    about: '#00D4FF',     // Electric Blue (Primary)
    experience: '#0096FF', // Medium Blue
    projects: '#0077B6',  // Deep Blue
    contact: '#E0F4FF',   // White/Ice Blue Glow
  },

  atmosphere: {
    cyan: '#00F5FF',      // Bright Cyan
    blue: '#00D4FF',      // Electric Blue
    deepBlue: '#0077B6',  // Deep Blue
  },

  background: {
    primary: '#000814',   // Space Black
    secondary: '#001d3d', // Deep Navy
  },

  ui: {
    glassBackground: 'rgba(0, 29, 61, 0.7)', // Deep Navy glass
    glassBlur: '20px',
  },
} as const;

export type ColorScheme = typeof colors;
