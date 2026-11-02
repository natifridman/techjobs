/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Backend URL: use container name in Docker, localhost otherwise
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // CPU-heavy parser fuzzing can starve jsdom's first accessibility query on
    // shared CI runners. Keep the normal timeouts and assertions, but run CI
    // files sequentially; local runs retain parallel workers.
    fileParallelism: !process.env.CI,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
      ],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/auth': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/auth': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
