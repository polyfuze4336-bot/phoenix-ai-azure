import { expect, test } from '@playwright/test';
import { seedLanguage } from './_helpers';

const VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280];

test('First Aid Video renders approved content and switches language immediately', async ({ page }) => {
  await seedLanguage(page, 'en');
  await page.goto('/community/first-aid-video');

  await expect(page.getByRole('heading', { name: 'First Aid Video' })).toBeVisible();
  await expect(page.getByText('First aid video is currently unavailable.')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Burn First Aid' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: 'Cool the burn' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: '20–30 minutes' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: 'Cover the burn' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: 'Seek medical treatment' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: 'Do not apply' })).toBeVisible();
  await expect(page.locator('strong em').filter({ hasText: 'Remember: Cool → Cover → Seek Treatment' })).toBeVisible();
  await expect(page.getByRole('link', { name: /download/i })).toHaveCount(0);

  await page.getByRole('button', { name: 'Switch to Bahasa Malaysia' }).click();
  await expect(page.getByRole('heading', { name: 'Video Pertolongan Cemas' })).toBeVisible();
  await expect(page.getByText('Video pertolongan cemas tidak tersedia buat masa ini.')).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: '20–30 minit' })).toBeVisible();
  await expect(page.getByText('Video ini adalah untuk tujuan pendidikan sahaja', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Tukar kepada bahasa Inggeris' }).click();
  await expect(page.getByRole('heading', { name: 'First Aid Video' })).toBeVisible();
  await expect(page.getByText('This video is for educational purposes only', { exact: false })).toBeVisible();
});

test('Burn Injury Prevention has five bilingual categories and links to First Aid', async ({ page }) => {
  await seedLanguage(page, 'en');
  await page.goto('/community/burn-prevention');

  for (const heading of [
    'General Public',
    'Parents & Caregivers',
    'Children',
    'Home / Domestic Safety',
    'Workplace Safety',
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Switch to Bahasa Malaysia' }).click();
  for (const heading of [
    'Orang Awam',
    'Ibu Bapa & Penjaga',
    'Kanak-kanak',
    'Keselamatan Rumah / Domestik',
    'Keselamatan Tempat Kerja',
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }

  await page.getByRole('link', { name: 'Lihat Pertolongan Cemas' }).click();
  await expect(page).toHaveURL(/\/community\/first-aid$/);
});

test('Community education pages remain contained at supported widths', async ({ page }) => {
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    for (const route of ['/community', '/community/first-aid-video', '/community/burn-prevention']) {
      await page.goto(route);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        `${route} must not overflow at ${width}px`,
      ).toBe(true);
    }
  }
});
