import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split React and React-DOM into separate chunk
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Split Three.js ecosystem into separate chunk
          if (
            id.includes('/node_modules/three/') ||
            id.includes('/node_modules/@react-three/')
          ) {
            return 'three-vendor';
          }
          // Split other large libraries
          if (id.includes('/node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
