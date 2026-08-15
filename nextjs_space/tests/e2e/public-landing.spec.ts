import { test, expect } from '@playwright/test';
import { toggleLanguage, setMobileViewport, setDesktopViewport } from './_helpers';

/**
 * Public landing journey (verbatim steps):
 *  1. Load /.
 *  2. Confirm Phoenix logo.
 *  3. Confirm KKM/HKL logo.
 *  4. Confirm HCP entry.
 *  5. Confirm community entry.
 *  6. Confirm language switching.
 *  7. Confirm responsive navigation.
 */
test('public landing journey', async ({ page }) => {
  // 1. Load /.
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);

  // 2. Confirm Phoenix logo (brand logo image, /logo.png via next/image).
  const phoenixLogos = page.getByAltText(/Phoenix AI/i);
  await expect(phoenixLogos.first()).toBeVisible();
  const phoenixSrc = await phoenixLogos.first().getAttribute('src');
  expect(phoenixSrc).toMatch(/logo\.png/);

  // 3. Confirm KKM/HKL endorsement logo.
  const kkmLogo = page.getByAltText(/Kementerian Kesihatan Malaysia/i);
  await expect(kkmLogo).toBeVisible();
  expect(await kkmLogo.getAttribute('src')).toMatch(/kkm-hkl-logo/);

  // 4. Confirm HCP entry (links to the HCP login).
  const hcpEntry = page.locator('a[href="/hcp-login"]');
  await expect(hcpEntry).toBeVisible();
  await expect(hcpEntry).toContainText(/Healthcare Professional Portal/i);

  // 5. Confirm community entry (links to the community portal).
  const communityEntry = page.locator('a[href="/community"]');
  await expect(communityEntry).toBeVisible();
  await expect(communityEntry).toContainText(/Community Portal/i);

  // 6. Confirm language switching (English -> Bahasa Malaysia -> English) using the
  //    fully language-conditional HCP portal card title as the discriminator.
  await expect(page.getByText('Healthcare Professional Portal', { exact: true })).toBeVisible();
  await toggleLanguage(page);
  await expect(
    page.getByText('Portal Profesional Penjagaan Kesihatan', { exact: true }),
  ).toBeVisible(); // Bahasa Malaysia
  await toggleLanguage(page);
  await expect(page.getByText('Healthcare Professional Portal', { exact: true })).toBeVisible();

  // 7. Confirm responsive navigation: the portal entries remain reachable on a
  // narrow (mobile) viewport, then again on desktop.
  await setMobileViewport(page);
  await expect(page.locator('a[href="/hcp-login"]')).toBeVisible();
  await expect(page.locator('a[href="/community"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle language' }).first()).toBeVisible();

  await setDesktopViewport(page);
  await expect(page.locator('a[href="/hcp-login"]')).toBeVisible();
  await expect(page.locator('a[href="/community"]')).toBeVisible();
});

test('v2 routes are not published', async ({ request }) => {
  for (const path of ['/v2', '/v2/hcp', '/v2/hcp/ai-assurance', '/v2/community']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
