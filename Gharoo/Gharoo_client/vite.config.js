import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/',

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/admin': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path === '/admin' ? '/admin/login' : path,
      },
      '/login': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: () => '/admin/login',
      },
      '^/service(?:/|$)': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
    },
  },
})
