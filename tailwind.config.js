/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#000814',       // Space Black
        secondary: '#001d3d',     // Deep Navy
        tertiary: '#003566',      // Navy Blue
        'accent-cyan': '#00F5FF',     // Bright Cyan
        'accent-blue': '#00D4FF',     // Electric Blue
        'accent-medium': '#0096FF',   // Medium Blue
        'accent-deep': '#0077B6',     // Deep Blue
        'accent-ice': '#E0F4FF',      // Ice Blue Glow
        'accent-orange': '#00D4FF',   // Replaced with blue
        'accent-green': '#00F5FF',    // Replaced with cyan
        'neutral-gray': '#8ecae6',    // Light Blue-gray
      },
    },
  },
  plugins: [],
};