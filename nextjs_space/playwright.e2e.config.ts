import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Phoenix AI end-to-end user-journey tests.
 *
 * Separate from playwright.config.ts (visual baseline) and
 * playwright.network.config.ts (Abacus dependency guard). These specs exercise
 * the three required user journeys (public landing, HCP, community) as real
 * click-throughs against the PRODUCTION build.
 *
 * A single desktop project is used; journey steps that must verify mobile /
 * responsive navigation resize the viewport in-test (page.setViewportSize) so a
 * single run covers both layouts deterministically.
 *
 * Run `npm run build` first, then `npm run test:e2e`.
 *
 * Set PLAYWRIGHT_BASE_URL to run the same journeys against an already-deployed
 * target (e.g. an App Service staging slot in the deployment pipeline). When it
 * is set, the local production web server is NOT started.
 */
const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  // AI-backed steps stream from Azure OpenAI when configured; allow generous time
  // but the tests also assert the explicit failure state when AI is unavailable.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: remoteBaseUrl || 'http://localhost:3000',
    locale: 'en-US',
    timezoneId: 'Asia/Kuala_Lumpur',
    colorScheme: 'light',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'journeys',
      use: {},
    },
  ],
  // Only boot a local server when targeting localhost. Against a deployed URL the
  // pipeline points PLAYWRIGHT_BASE_URL at the running site instead.
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: { NEXTAUTH_URL: 'http://localhost:3000' },
      },
});
