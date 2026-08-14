import { test, expect } from '@playwright/test';
import { toggleLanguage, setMobileViewport, setDesktopViewport } from './_helpers';

/**
 * Public landing journey (verbatim steps):
 *  1. Load /.
 *  2. Confirm Phoenix logo.
 *  3. Confirm v2.0 is the retained public experience.
 *  4. Confirm v2 HCP entry.
 *  5. Confirm v2 community entry.
 *  6. Confirm the original experience is not advertised.
 *  7. Confirm language control and responsive navigation.
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

  // 3. Confirm v2.0 is the retained public experience.
  await expect(page.getByRole('heading', { name: /Phoenix AI v2\.0/i })).toBeVisible();

  // 4. Confirm v2 HCP entry.
  const hcpEntry = page.locator('a[href="/v2/hcp"]');
  await expect(hcpEntry).toBeVisible();
  await expect(hcpEntry).toContainText(/Clinician Workspace/i);

  // 5. Confirm v2 community entry.
  const communityEntry = page.locator('a[href="/v2/community"]');
  await expect(communityEntry).toBeVisible();
  await expect(communityEntry).toContainText(/Community Portal/i);

  // 6. Confirm no original/v1 entry is advertised.
  await expect(page.locator('a[href="/hcp-login"]')).toHaveCount(0);
  await expect(page.locator('a[href="/community"]')).toHaveCount(0);
  await expect(page.getByText(/Original Experience|Pengalaman Asal/i)).toHaveCount(0);

  // 7. Confirm language control remains operable and entries stay responsive.
  await toggleLanguage(page);
  await toggleLanguage(page);

  await setMobileViewport(page);
  await expect(page.locator('a[href="/v2/hcp"]')).toBeVisible();
  await expect(page.locator('a[href="/v2/community"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle language' }).first()).toBeVisible();

  await setDesktopViewport(page);
  await expect(page.locator('a[href="/v2/hcp"]')).toBeVisible();
  await expect(page.locator('a[href="/v2/community"]')).toBeVisible();
});
