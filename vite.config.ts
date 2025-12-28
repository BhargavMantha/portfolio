import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three']
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Disable code splitting to prevent TDZ errors from cross-chunk imports
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  },
})
