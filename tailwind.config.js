/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: '#000000',           // Deep Void Black (Matches Image Sequence)
        secondary: '#0F0F0F',         // Panel Black
        tertiary: '#1A1A1A',          // Border/Highlight
        'arc-reactor': '#FFC107',     // Gold
        'electric-blue': '#00D4FF',   // Core Blue
        'stark-glass': 'rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};