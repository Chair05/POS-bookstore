import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The API runs in the Linux supabase-laco-pos backend (default http://localhost:5300).
// In development this dev server proxies /api and /uploads to it, so the browser
// only ever talks to one origin and no CORS preflight is involved.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || 'http://localhost:5300'

  return {
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
        },
      },
    },
  }
})
