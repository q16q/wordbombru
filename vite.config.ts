import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'web',
  build: {
    // Указываем путь для сборки
    outDir: '../dist',
    // Очищаем директорию перед сборкой
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './web/src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
