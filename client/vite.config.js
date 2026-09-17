import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '^/service(?:/|$)': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
    },
  },
})
