import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  // GitHub Pages serves the project site under /Uzbekible/.
  base: '/Uzbekible/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered from src/shell/registerSW.ts so we can show the toast
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Uzbekible',
        short_name: 'Uzbekible',
        description: 'Games that make Uzbek happen.',
        theme_color: '#1B3F8F', // cobalt
        background_color: '#F7F4EC', // glaze white
        display: 'standalone',
        start_url: '/Uzbekible/',
        scope: '/Uzbekible/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell, fonts and content packs are all precached for offline play.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}'],
        navigateFallback: '/Uzbekible/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
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
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/main.tsx', 'src/**/index.ts'],
      reporter: ['text-summary', 'lcov'],
    },
  },
});
