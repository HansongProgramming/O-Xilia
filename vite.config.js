import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    host: '127.0.0.1', // Use IP instead of localhost
    port: 5173,
    strictPort: true,
    // Prevent connection reset issues
    hmr: {
      host: '127.0.0.1',
      port: 5173
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client']
  }
})