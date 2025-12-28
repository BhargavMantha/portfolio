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
} as const;

export type ColorScheme = typeof colors;
