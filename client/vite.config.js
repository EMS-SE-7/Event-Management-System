import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The client always calls relative URLs such as /api/events.
    // In development, Vite forwards them to the Express server.
    proxy: { '/api': 'http://localhost:5000' },
  },
})
