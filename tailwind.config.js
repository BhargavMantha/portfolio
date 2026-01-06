/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',           // Iron Man Near-Black
        secondary: '#1A1A1A',         // Slightly Lighter Black
        tertiary: '#2A2A2A',          // Dark Gray
        'arc-reactor': '#FFC107',     // Arc Reactor Gold
        'electric-blue': '#00D4FF',   // Electric Blue (HUD)
        'accent-cyan': '#00F5FF',     // Bright Cyan
        'accent-blue': '#00D4FF',     // Electric Blue
        'accent-medium': '#0096FF',   // Medium Blue
        'accent-gold': '#FFC107',     // Gold
        'accent-orange': '#FF6B35',   // Orange (for projects)
        'text-primary': 'rgba(255, 255, 255, 0.9)',
        'text-secondary': 'rgba(255, 255, 255, 0.6)',
        'text-tertiary': 'rgba(255, 255, 255, 0.4)',
      },
    },
  },
  plugins: [],
};