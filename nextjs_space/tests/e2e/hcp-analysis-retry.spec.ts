import { test, expect } from '@playwright/test';
import { TINY_PNG, seedHcpAuth, toggleLanguage } from './_helpers';

test('failed analysis retains context and provides bilingual retry actions', async ({ page }) => {
  await seedHcpAuth(page);
  const retryHeaders: string[] = [];
  await page.route('**/api/analyze-wound', async (route) => {
    retryHeaders.push(route.request().headers()['x-analysis-retry-count'] ?? 'missing');
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unavailable', code: 'AI_UPSTREAM_5XX' }),
    });
  });

  await page.goto('/hcp/analysis');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'safe-demo.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  const weightInput = page.locator('input[type="number"]').first();
  await weightInput.fill('68');
  await page.getByRole('button', { name: 'Analyze Image' }).click();

  await expect(page.getByRole('heading', { name: 'Analysis could not be completed.' })).toBeVisible();
  await expect(page.getByText('Your image has been retained in this session. Please retry the analysis. If the issue continues, try a smaller or clearer image.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry Analysis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose Another Image' })).toBeVisible();
  await expect(weightInput).toHaveValue('68');
  await expect(page.getByAltText('Wound image')).toBeVisible();

  await page.getByRole('button', { name: 'Retry Analysis' }).click();
  await expect.poll(() => retryHeaders).toEqual(['0', '1']);
  await expect(weightInput).toHaveValue('68');

  await toggleLanguage(page);
  await expect(page.getByRole('heading', { name: 'Analisis tidak dapat diselesaikan.' })).toBeVisible();
  await expect(page.getByText('Imej anda dikekalkan untuk sesi ini. Sila cuba analisis sekali lagi. Jika masalah berterusan, cuba gunakan imej yang lebih kecil atau lebih jelas.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cuba Analisis Semula' })).toBeVisible();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Pilih Imej Lain' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.getByAltText('Wound image')).toBeVisible();
  await expect(weightInput).toHaveValue('68');
});