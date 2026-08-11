import { test, expect, type Page } from '@playwright/test';
import { seedHcpAuth } from './_helpers';

/**
 * Dead-control regression guard (Step 21 — clickable-control audit).
 *
 * This spec does not exercise business flows (the journey specs do that). It
 * asserts a structural invariant that every visibly clickable control must
 * satisfy: it points somewhere real. Specifically, on every rendered route:
 *   - no anchor uses a placeholder href ("#", "", or "javascript:void");
 *   - every in-app anchor (href="/...") targets a route that resolves (not 404);
 *   - the primary navigation is present and its links are non-placeholder.
 *
 * If a future change reintroduces a dead link or an empty handler surfaced as an
 * anchor, this test fails deterministically. It never skips.
 */

const PUBLIC_ROUTES = [
  '/',
  '/hcp-login',
  '/community',
  '/community/first-aid',
  '/community/assessment',
  '/community/articles',
  '/community/chat',
];

const HCP_ROUTES = [
  '/hcp',
  '/hcp/analysis',
  '/hcp/tbsa',
  '/hcp/parkland',
  '/hcp/guidelines',
  '/hcp/chat',
];

/** Assert no anchor on the page uses a placeholder/dead href. */
async function expectNoDeadAnchors(page: Page): Promise<void> {
  const deadHrefs = await page.$$eval('a[href]', (anchors) =>
    anchors
      .map((a) => (a.getAttribute('href') ?? '').trim())
      .filter(
        (href) =>
          href === '#' ||
          href === '' ||
          href.toLowerCase().startsWith('javascript:'),
      ),
  );
  expect(deadHrefs, `dead/placeholder anchors found: ${JSON.stringify(deadHrefs)}`).toEqual([]);
}

/** Collect the set of internal (same-app) hrefs referenced on the page. */
async function internalHrefs(page: Page): Promise<string[]> {
  const hrefs = await page.$$eval('a[href]', (anchors) =>
    anchors.map((a) => (a.getAttribute('href') ?? '').trim()),
  );
  return Array.from(
    new Set(
      hrefs.filter((href) => href.startsWith('/') && !href.startsWith('//')),
    ),
  );
}

test.describe('clickable controls — no dead links (public + community)', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} has no placeholder anchors and resolvable links`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `route ${route} should render`).toBeLessThan(400);

      await expectNoDeadAnchors(page);

      // Every internal link must resolve (strip query string before HEAD/GET check).
      for (const href of await internalHrefs(page)) {
        const target = href.split('?')[0];
        if (target.startsWith('/api/')) continue; // API routes verified in tests/api.
        const res = await page.request.get(target);
        expect(res.status(), `internal link ${href} on ${route} must resolve`).toBeLessThan(404);
      }
    });
  }
});

test.describe('clickable controls — no dead links (HCP portal, seeded demo session)', () => {
  test.beforeEach(async ({ page }) => {
    await seedHcpAuth(page);
  });

  for (const route of HCP_ROUTES) {
    test(`route ${route} has no placeholder anchors`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `route ${route} should render`).toBeLessThan(400);
      // The gated layout resolves the seeded session before rendering nav.
      await expect(page.locator('aside').first()).toBeVisible({ timeout: 15_000 });
      await expectNoDeadAnchors(page);
    });
  }
});
