import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api'
  // Derive the backend origin from the API URL (strip the /api path)
  const backendOrigin = apiUrl.replace(/\/api$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxies /api/* → http://localhost:5000/api/* during dev
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
