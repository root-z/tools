import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: resolve('./src/lib')
    },
    conditions: process.env.VITEST ? ['browser'] : [],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./tests/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: [/svelte/]
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'src/app.d.ts'
      ]
    }
  }
});