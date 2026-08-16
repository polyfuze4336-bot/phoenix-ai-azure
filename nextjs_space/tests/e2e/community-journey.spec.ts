import { test, expect, type Page } from '@playwright/test';
import {
  TINY_PNG,
  expectAiTerminalState,
  seedLanguage,
  setMobileViewport,
  setDesktopViewport,
} from './_helpers';

/**
 * Community journey (verbatim steps):
 *  1. Load /community.        2. Navigate to first aid.   3. Navigate to articles.
 *  4. Navigate to assessment. 5. Navigate to image check. 6. Upload an image.
 *  7. Confirm simplified advice.
 *  8. Navigate to chat.       9. Send a question.        10. Confirm response.
 * 11. Confirm selected-language controls. 12. Test mobile navigation.
 *
 * AI-backed steps (6-7, 9-10) assert a deterministic terminal state — a real
 * simplified result when Azure OpenAI is configured, or the app's explicit
 * failure/fallback state otherwise. They are never skipped.
 */

/** Click the visible desktop-sidebar nav link for a community route and await the URL. */
async function navTo(page: Page, href: string, urlRe: RegExp): Promise<void> {
  await page.locator(`aside a[href="${href}"]`).first().click();
  await expect(page).toHaveURL(urlRe);
  await expect(page.locator('main')).not.toBeEmpty();
}

for (const language of ['en', 'ms'] as const) {
test(`community journey in ${language}`, async ({ page }) => {
  await seedLanguage(page, language);
  const labels = language === 'en'
    ? {
      check: /Check My Wound/i,
      checking: /Checking/i,
      result: /What We Found/i,
      failure: /Analysis failed|could not be completed/i,
      placeholder: 'Type your message...',
      question: 'How do I treat a minor kitchen burn at home?',
    }
    : {
      check: /Periksa Luka Saya/i,
      checking: /Memeriksa/i,
      result: /Apa Yang Kami Temui/i,
      failure: /Analisis gagal|tidak dapat diselesaikan/i,
      placeholder: 'Taip mesej anda...',
      question: 'Bagaimanakah saya merawat kelecuran kecil di dapur di rumah?',
    };

  // 1. Load /community.
  await page.goto('/community');
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('aside a[href="/community/first-aid"]').first()).toBeVisible();

  // 2. Navigate to first aid.
  await navTo(page, '/community/first-aid', /\/community\/first-aid$/);

  // 3. Navigate to articles.
  await navTo(page, '/community/articles', /\/community\/articles$/);

  // 4. Navigate to assessment.
  await navTo(page, '/community/assessment', /\/community\/assessment$/);

  // 5. Navigate to image check.
  await navTo(page, '/community/image-check', /\/community\/image-check$/);

  // 6. Upload an image (hidden file input).
  await page.locator('input[type="file"]').setInputFiles({
    name: 'wound.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  const checkBtn = page.getByRole('button', { name: labels.check });
  await expect(checkBtn).toBeVisible();
  await page.route('**/api/community-analyze', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await checkBtn.click();
  // Loading state.
  await expect(page.getByRole('button', { name: labels.checking })).toBeVisible();

  // 7. Confirm simplified advice (real "What We Found" result OR explicit failure).
  await expectAiTerminalState(page, labels.result, labels.failure);

  // 8. Navigate to chat.
  await navTo(page, '/community/chat', /\/community\/chat$/);
  const chatInput = page.getByPlaceholder(labels.placeholder);
  await expect(chatInput).toBeVisible();

  // 9. Send a question.
  const question = labels.question;
  await chatInput.fill(question);
  await chatInput.press('Enter');
  await expect(page.getByText(question).first()).toBeVisible(); // user message rendered

  // 10. Confirm response (assistant bubble gains content OR the error fallback).
  const assistantBubbles = page.locator('div.justify-start');
  await expect(assistantBubbles.last()).toBeVisible();
  await expect
    .poll(async () => (await assistantBubbles.last().innerText()).trim(), { timeout: 90_000 })
    .not.toMatch(/^\.*$/);

  // 11. Confirm the selected-language chat control remains consistent.
  await expect(page.getByPlaceholder(labels.placeholder)).toBeVisible();

  // 12. Test mobile navigation (open the drawer, jump to first aid).
  await setMobileViewport(page);
  await page.locator('header button.lg\\:hidden').first().click(); // hamburger
  const drawerFirstAid = page.locator('aside a[href="/community/first-aid"]').last();
  await expect(drawerFirstAid).toBeVisible();
  await drawerFirstAid.click();
  await expect(page).toHaveURL(/\/community\/first-aid$/);
  await setDesktopViewport(page);
});
}
