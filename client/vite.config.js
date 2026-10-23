import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, send every /api request to the Express server.
    // The browser only ever sees localhost:5173, so the session cookie is
    // same-origin, just like in production where Vercel forwards /api to Railway.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
