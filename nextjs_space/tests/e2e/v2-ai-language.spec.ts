import { test, expect } from '@playwright/test';
import { TINY_PNG, toggleLanguage } from './_helpers';

test('v2 wound analysis completes end to end and sends the BM selection', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route('**/api/analyze-wound', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body:
        'data: {"status":"processing","message":"Menganalisis"}\n\n' +
        'data: {"status":"completed","result":{"woundCategory":"Kelecuran","woundType":"Lecur air panas","burnDegree":"Separa ketebalan","severity":"Sederhana","confidence":"Sederhana","tbsaRange":"1-2%","isBurn":true}}\n\n',
    });
  });

  await page.goto('/v2/hcp/analysis');
  await toggleLanguage(page);
  await expect(page.getByText(/Akta Perlindungan Data Peribadi 2010/)).toBeVisible();
  await expect(page.getByText(/sokongan keputusan klinikal sahaja/i)).toBeVisible();

  await page.getByRole('button', { name: /Continue/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'wound.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: /Run AI assessment/i }).click();

  await expect(page.getByRole('heading', { name: 'Assessment' })).toBeVisible();
  await expect(page.getByText('Lecur air panas')).toBeVisible();
  expect(requestBody?.lang).toBe('bm');
  expect(Array.isArray(requestBody?.images)).toBeTruthy();
});

test('v2 HCP chatbot sends BM and renders the streamed BM response', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route('**/api/hcp-chat', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body:
        'data: {"choices":[{"delta":{"content":"Ini ialah sokongan keputusan klinikal dalam Bahasa Malaysia."}}]}\n\n' +
        'data: [DONE]\n\n',
    });
  });

  await page.goto('/v2/hcp/chat');
  await toggleLanguage(page);
  await page.getByPlaceholder(/Ask a clinical question/i).fill('Apakah rawatan awal?');
  await page.getByPlaceholder(/Ask a clinical question/i).press('Enter');

  await expect(page.getByText(/sokongan keputusan klinikal dalam Bahasa Malaysia/i)).toBeVisible();
  expect(requestBody?.lang).toBe('bm');
});
