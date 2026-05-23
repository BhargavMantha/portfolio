import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Dev-only: serve public/<dir>/index.html when URL is "/<dir>/" or "/<dir>"
// so static sub-pages (e.g. /agentic-stack/) work in `vite dev` the same way
// Netlify/Vercel serve them in production. The SPA fallback otherwise wins.
const publicDirIndex = (): Plugin => ({
  name: 'serve-public-dir-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const raw = req.url?.split('?')[0]
      if (!raw || raw === '/') return next()
      const candidates = raw.endsWith('/')
        ? [path.join(server.config.publicDir, raw, 'index.html')]
        : [
            path.join(server.config.publicDir, raw, 'index.html'),
            path.join(server.config.publicDir, raw + '.html'),
          ]
      for (const file of candidates) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          fs.createReadStream(file).pipe(res)
          return
        }
      }
      return next()
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), publicDirIndex()],
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
