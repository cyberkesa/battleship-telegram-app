import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@battleship/shared-types': fileURLToPath(new URL('../../packages/shared-types/dist/index.js', import.meta.url)),
      '@battleship/game-logic': fileURLToPath(new URL('../../packages/game-logic/dist/index.js', import.meta.url)),
      '@battleship/ui': fileURLToPath(new URL('../../packages/ui/dist/index.js', import.meta.url)),
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
