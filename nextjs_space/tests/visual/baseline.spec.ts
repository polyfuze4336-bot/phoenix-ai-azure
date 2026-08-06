import { test, type Page, type TestInfo } from '@playwright/test';

/**
 * Phoenix AI — visual & route baseline capture.
 *
 * Captures screenshots of every accessible route across the four required
 * dimensions (driven by Playwright projects) in both languages and across the
 * key UI states. This is an OBSERVATION-ONLY step: it never mutates the UI or
 * app source. Output: tests/visual/baseline/<route>/<viewport>-<lang>-<state>.png
 *
 * HCP routes are gated by a mock, client-side auth check (sessionStorage
 * `hcp_auth`). Per the task, we use the EXISTING demo login only to reach those
 * pages during baseline capture — we seed the same session object the real demo
 * login flow writes (see app/hcp-login/page.tsx MOCK_USERS).
 */

const DEMO_HCP_SESSION = JSON.stringify({
  name: 'Dr. Ahmad Faizal',
  role: 'Pakar Perubatan Kecemasan',
  email: 'doctor@phoenix.my',
});

type Lang = 'en' | 'bm';

function slug(route: string): string {
  return route === '/' ? 'landing' : route.replace(/^\//, '').replace(/\//g, '-');
}

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

/** Save a full-page screenshot under the per-viewport baseline folder. */
async function shot(page: Page, info: TestInfo, route: string, name: string) {
  const vp = info.project.name;
  await page.screenshot({
    path: `tests/visual/baseline/${slug(route)}/${vp}-${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}

/** The language toggle button always displays the OTHER language's code. */
async function switchToBahasa(page: Page) {
  const toggle = page.getByRole('button', { name: 'Toggle language' }).first();
  if (await toggle.count()) {
    // Default load is English; the button reads "BM". One click → Bahasa Malaysia.
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

async function gotoStable(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' }).catch(() => page.goto(route));
  await page.waitForTimeout(600); // settle entrance animations
}

/** Try to open the mobile drawer nav (portal layouts). Returns true if opened. */
async function openMobileNav(page: Page): Promise<boolean> {
  const hamburger = page.locator('header button.lg\\:hidden').first();
  try {
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(400);
      return true;
    }
  } catch {
    /* no hamburger at this viewport */
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

test('landing', async ({ page }, info) => {
  await gotoStable(page, '/');
  await shot(page, info, '/', 'en-initial');
  await switchToBahasa(page);
  await shot(page, info, '/', 'bm-initial');
});

test('hcp-login', async ({ page }, info) => {
  await gotoStable(page, '/hcp-login');
  await shot(page, info, '/hcp-login', 'en-initial-empty');
  await switchToBahasa(page);
  await shot(page, info, '/hcp-login', 'bm-initial-empty');

  // Error state: submit invalid credentials.
  await page.goto('/hcp-login').catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('input[type="email"]').fill('wrong@phoenix.my');
  await page.locator('input[type="password"]').fill('bad-password');
  await page.getByRole('button', { name: /log in|log masuk|sign in/i }).first().click().catch(() => {});
  await page.waitForTimeout(1600); // 1.2s mock delay + render
  await shot(page, info, '/hcp-login', 'en-error');
});

// ---------------------------------------------------------------------------
// HCP portal routes (gated — seed demo session first)
// ---------------------------------------------------------------------------

const HCP_ROUTES = [
  '/hcp',
  '/hcp/analysis',
  '/hcp/chat',
  '/hcp/guidelines',
  '/hcp/parkland',
  '/hcp/tbsa',
];

for (const route of HCP_ROUTES) {
  test(`hcp:${route}`, async ({ page }, info) => {
    await seedHcpAuth(page);
    await gotoStable(page, route);
    await shot(page, info, route, 'en-initial');
    await switchToBahasa(page);
    await shot(page, info, route, 'bm-initial');

    // Navigation open (mobile drawer) — only meaningful on the narrow viewport.
    if (info.project.name === 'mobile-390') {
      await page.goto(route).catch(() => {});
      await page.waitForTimeout(500);
      const opened = await openMobileNav(page);
      if (opened) await shot(page, info, route, 'en-nav-open');
    }
  });
}

// Parkland: completed form + result panel + ICU alert.
test('hcp:parkland-completed', async ({ page }, info) => {
  await seedHcpAuth(page);
  await gotoStable(page, '/hcp/parkland');
  const numbers = page.locator('input[type="number"]');
  await numbers.nth(0).fill('70'); // weight
  await numbers.nth(1).fill('25'); // TBSA (>20 triggers ICU alert)
  await page.waitForTimeout(500);
  await shot(page, info, '/hcp/parkland', 'en-completed-result');
  await switchToBahasa(page);
  await shot(page, info, '/hcp/parkland', 'bm-completed-result');
});

// HCP user menu (dialog-like dropdown) + AI analysis error state.
test('hcp:analysis-states', async ({ page }, info) => {
  await seedHcpAuth(page);
  await gotoStable(page, '/hcp/analysis');
  // Open the user menu (acts as a dialog/dropdown) if present.
  const userMenu = page.getByRole('button', { name: /Dr\.|Ahmad|account|profile/i }).first();
  try {
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
      await shot(page, info, '/hcp/analysis', 'en-user-menu');
    }
  } catch {
    /* menu not reachable at this viewport */
  }
});

// ---------------------------------------------------------------------------
// Community portal routes (public)
// ---------------------------------------------------------------------------

const COMMUNITY_ROUTES = [
  '/community',
  '/community/articles',
  '/community/assessment',
  '/community/chat',
  '/community/first-aid',
  '/community/image-check',
];

for (const route of COMMUNITY_ROUTES) {
  test(`community:${route}`, async ({ page }, info) => {
    await gotoStable(page, route);
    await shot(page, info, route, 'en-initial');
    await switchToBahasa(page);
    await shot(page, info, route, 'bm-initial');

    if (info.project.name === 'mobile-390') {
      await page.goto(route).catch(() => {});
      await page.waitForTimeout(500);
      const opened = await openMobileNav(page);
      if (opened) await shot(page, info, route, 'en-nav-open');
    }
  });
}

// Community self-assessment: complete the questionnaire → result panel.
test('community:assessment-completed', async ({ page }, info) => {
  await gotoStable(page, '/community/assessment');
  // Answer each question by clicking the first option until the result appears.
  for (let i = 0; i < 6; i++) {
    const options = page.locator('button').filter({ hasText: /.+/ });
    const first = options.first();
    try {
      if (await first.isVisible()) {
        await first.click();
        await page.waitForTimeout(400);
      }
    } catch {
      break;
    }
    if (await page.getByText(/Home Care|Visit a Clinic|Emergency|Penjagaan|Klinik|Kecemasan/i).first().count()) {
      break;
    }
  }
  await page.waitForTimeout(500);
  await shot(page, info, '/community/assessment', 'en-completed-result');
});
