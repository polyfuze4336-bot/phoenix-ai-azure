import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * Phoenix AI — Abacus runtime-dependency guard.
 *
 * Fails if the browser makes ANY network request to an Abacus-owned domain while
 * loading the app. This protects the migration guarantee that no Abacus-hosted
 * browser script (e.g. https://apps.abacus.ai/chatllm/appllm-lib.js) is loaded at
 * runtime.
 *
 * Scope: BROWSER requests only. Server-side AI calls (app/api/* → apps.abacus.ai)
 * are made by the Next.js server, never by the browser, so they are intentionally
 * NOT matched here — those are migrated in a later step.
 */

/** Matches apps.abacus.ai, abacus.ai, and any *.abacus.ai / *.abacusai.* asset domain. */
const ABACUS_HOST = /(^|\.)abacus(ai)?\.(ai|app|com)$/i;

/** Every publicly reachable route in the app. */
const ROUTES = [
  '/',
  '/hcp-login',
  '/hcp',
  '/hcp/analysis',
  '/hcp/chat',
  '/hcp/guidelines',
  '/hcp/parkland',
  '/hcp/tbsa',
  '/community',
  '/community/articles',
  '/community/assessment',
  '/community/chat',
  '/community/first-aid',
  '/community/first-aid-video',
  '/community/burn-prevention',
];

const DEMO_HCP_SESSION = JSON.stringify({
  name: 'Admin Phoenix',
  role: 'Pentadbir Sistem',
  email: 'admin.phoenix',
});

/** Seed the demo HCP session so gated /hcp routes render (mirrors the demo login). */
async function seedHcpAuth(page: Page) {
  await page.addInitScript((session) => {
    try {
      window.sessionStorage.setItem('hcp_auth', session as string);
    } catch {
      /* sessionStorage unavailable — ignore */
    }
  }, DEMO_HCP_SESSION);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

test('no browser request targets an Abacus domain on any route', async ({ page }) => {
  const abacusRequests: string[] = [];

  const record = (req: Request) => {
    if (ABACUS_HOST.test(hostOf(req.url()))) {
      abacusRequests.push(`${req.method()} ${req.url()}`);
    }
  };
  page.on('request', record);

  await seedHcpAuth(page);

  for (const route of ROUTES) {
    await page
      .goto(route, { waitUntil: 'networkidle' })
      .catch(() => page.goto(route));
    // Give any deferred/async scripts a chance to fire a request.
    await page.waitForTimeout(400);
  }

  expect(
    abacusRequests,
    `Unexpected browser request(s) to an Abacus domain:\n${abacusRequests.join('\n')}`,
  ).toEqual([]);
});
