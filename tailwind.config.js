/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#050816',
        secondary: '#151030',
        tertiary: '#100d25',
        'accent-cyan': '#00cea8',
        'accent-magenta': '#f272c8',
        'accent-purple': '#915EFF',
        'accent-blue': '#2b77e7',
        'accent-orange': '#ff6b35',
        'accent-green': '#00ff88',
        'neutral-gray': '#aaa6c3',
      },
    },
  },
  plugins: [],
};