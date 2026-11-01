import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: {
      // Dev calls go to /api; set VITE_API_PROXY in client/.env if the server is not on port 5000
      proxy: { '/api': env.VITE_API_PROXY || 'http://localhost:5000' },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
