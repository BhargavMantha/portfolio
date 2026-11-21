import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Served under bhargavmantha.dev/loveletter/
export default defineConfig({
  base: '/loveletter/',
  plugins: [react()],
  test: { environment: 'jsdom', globals: false },
})
