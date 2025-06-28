import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Specify the port for the dev server
    proxy: {
      // Configure proxy to avoid CORS issues when developing
      '/api': {
        target: '${import.meta.env.VITE_BACKEND_URL}',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})