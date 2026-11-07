import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': src('core'),
      '@ui': src('ui'),
      '@design': src('design'),
      '@games': src('games'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/main.tsx', 'src/**/index.ts'],
      reporter: ['text-summary', 'lcov'],
      // CI fails below these (docs/architecture.md quality bar). Never lower them.
      thresholds: {
        'src/core/**': { lines: 95, branches: 95 },
        'src/ui/**': { lines: 80, branches: 80 },
      },
    },
  },
});
