import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@battleship/shared-types': path.resolve(__dirname, '../../packages/shared-types/dist/index.js'),
      '@battleship/game-logic': path.resolve(__dirname, '../../packages/game-logic/dist/index.js'),
      '@battleship/ui': path.resolve(__dirname, '../../packages/ui/dist/index.js'),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
