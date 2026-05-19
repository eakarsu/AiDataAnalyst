import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  esbuild: {
    loader: 'jsx',
    include: [/src\/.*\.jsx?$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: Number(process.env.FRONTEND_PORT) || 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true
      },
      '/auth': {
        target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true
      },
      '/public': {
        target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true
      },
      '/exports': {
        target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true
      }
    }
  }
})
