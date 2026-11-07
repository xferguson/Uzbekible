import { defineConfig, devices } from '@playwright/test';

const port = 4173;
// Cloud sessions ship a pre-installed Chromium; set PW_CHROMIUM_PATH to use it explicitly.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.e2e.ts', 'src/games/**/*.e2e.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'off',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Test build (mode "e2e") exposes window.__uzbekibleTest.
    command: `npx vite build --mode e2e && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}/Uzbekible/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
