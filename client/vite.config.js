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
      // Test levels: `npm run test:unit` and `npm run test:integration` run one project each.
      projects: [
        { extends: true, test: { name: 'unit', include: ['src/utils/**/*.test.{js,jsx}'] } },
        {
          extends: true,
          test: { name: 'integration', include: ['src/**/*.test.{js,jsx}'], exclude: ['src/utils/**'] },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx', 'src/api/mock*.js'],
        reporter: ['text', 'text-summary', 'html', 'json', 'json-summary', 'lcovonly'],
      },
    },
  }
})
