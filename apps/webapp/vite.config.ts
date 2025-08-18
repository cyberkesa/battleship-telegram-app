import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const isBuild = process.env.NODE_ENV === 'production'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@battleship/shared-types': fileURLToPath(new URL(isBuild ? '../../packages/shared-types/dist/index.js' : '../../packages/shared-types/src/index.ts', import.meta.url)),
      // Use CommonJS entry during production build to expose named exports reliably
      '@battleship/game-logic': fileURLToPath(new URL(isBuild ? '../../packages/game-logic/dist/index.cjs' : '../../packages/game-logic/src/index.ts', import.meta.url)),
      '@battleship/ui': fileURLToPath(new URL(isBuild ? '../../packages/ui/dist/index.js' : '../../packages/ui/src/index.ts', import.meta.url)),
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
