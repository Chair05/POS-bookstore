import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API always runs in ../backend. In development this dev server proxies
// /api and /uploads to it, so the browser only ever talks to one origin and
// no CORS preflight is involved. In production a reverse proxy does the same
// job (see deploy/nginx.conf), which is why nothing here is hard-coded.
const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000'

export default defineConfig(() => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      }
    }
  }
}))
