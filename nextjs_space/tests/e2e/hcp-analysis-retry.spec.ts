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

    for (const mode of ['Acute Burn Injury', 'General Wound']) {
      test(`${mode} shows a bilingual clinical refusal without raw provider details`, async ({ page }) => {
        await seedHcpAuth(page);
        await page.route('**/api/analyze-wound', async (route) => {
          expect(route.request().postDataJSON().assessmentType).toBe(
            mode === 'General Wound' ? 'general_wound' : 'acute_burn',
          );
          await route.fulfill({
            status: 422, contentType: 'application/json',
            body: JSON.stringify({ code: 'AI_CONTENT_FILTER', error: 'Raw provider detail that must not appear' }),
          });
        });
        await page.goto('/hcp/analysis');
        if (mode === 'General Wound') {
          await page.locator('aside').first().getByRole('button', { name: mode }).click();
        }
        await page.locator('input[type="file"]').setInputFiles({
          name: 'clinical-demo.png', mimeType: 'image/png', buffer: TINY_PNG,
        });
        await page.getByRole('button', { name: 'Analyze Image' }).click();
        await expect(page.getByText('This clinical image could not be analysed by the AI service. Please use clinical judgement and complete the assessment manually.')).toBeVisible();
        await expect(page.getByText('Raw provider detail that must not appear')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Retry Analysis' })).toBeVisible();
        await toggleLanguage(page);
        await expect(page.getByText('Imej klinikal ini tidak dapat dianalisis oleh perkhidmatan AI. Sila gunakan pertimbangan klinikal dan lengkapkan penilaian secara manual.')).toBeVisible();
      });
    }
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