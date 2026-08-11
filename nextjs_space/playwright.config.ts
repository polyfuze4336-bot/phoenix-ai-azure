import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Phoenix AI visual + route baseline capture.
 *
 * This config is used to capture a faithful screenshot baseline of the migrated
 * app (Step 7 of the migration). It does NOT change the UI — it only observes it.
 *
 * Four projects map to the required capture dimensions:
 *   - desktop-1440  → 1440 × 1000
 *   - desktop-1280  → 1280 × 800
 *   - tablet-768    → 768 × 1024   (responsive)
 *   - mobile-390    → 390 × 844    (responsive)
 *
 * The web server runs the PRODUCTION build (`next start`) so screenshots are free
 * of dev-only overlays. Run `npm run build` first (see docs/testing/visual-baseline.md).
 */
export default defineConfig({
  testDir: './tests/visual',
  // Screenshots are the artifact; a "failed" state capture must not abort the run.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    // Deterministic rendering for stable baselines.
    locale: 'en-US',
    timezoneId: 'Asia/Kuala_Lumpur',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile-390',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: { NEXTAUTH_URL: 'http://localhost:3000' },
  },
});
