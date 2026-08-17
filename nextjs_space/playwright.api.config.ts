import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Phoenix AI HTTP API integration tests.
 *
 * Drives the real Next.js route handlers over HTTP against the PRODUCTION build:
 * health probes and the three AI routes (hcp-chat, community-chat, and analyze-wound).
 * Input-validation paths (400/413) are exercised WITHOUT a model
 * call, and well-formed requests are asserted to reach a deterministic terminal
 * response (a stream when Azure OpenAI is configured, or an explicit error status
 * otherwise) — never a hang, and never skipped.
 *
 * The web server is booted with a deliberately small image ceiling
 * (AZURE_AI_MAX_IMAGE_MB=1) so the 413 body-size guard can be verified with a light
 * (~2 MB) request instead of a real 15 MB upload.
 *
 * Run `npm run build` first, then `npm run test:api`.
 */
export default defineConfig({
  testDir: './tests/api',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [{ name: 'api', use: {} }],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXTAUTH_URL: 'http://localhost:3000',
      AZURE_AI_MAX_IMAGE_MB: '1',
    },
  },
});
