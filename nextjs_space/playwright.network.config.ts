import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Abacus runtime-dependency guard.
 *
 * Separate from playwright.config.ts (visual baseline) so it runs once on a single
 * desktop browser rather than across the four screenshot viewports. It reuses the
 * same production web server. Run `npm run build` first, then `npm run test:network`.
 */
export default defineConfig({
  testDir: './tests/network',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: { NEXTAUTH_URL: 'http://localhost:3000' },
  },
});
