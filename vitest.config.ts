import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'out', 'e2e'],
    css: false,
    restoreMocks: true,
    reporters: process.env.CI ? ['default'] : ['default'],
    coverage: {
      enabled: false,
      include: ['lib/**', 'components/**', 'workers/**'],
    },
  },
});
