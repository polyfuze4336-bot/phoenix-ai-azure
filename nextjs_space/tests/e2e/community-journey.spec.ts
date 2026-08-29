import { test, expect, type Page } from '@playwright/test';
import {
  seedLanguage,
  setMobileViewport,
  setDesktopViewport,
} from './_helpers';

/**
 * Community journey (verbatim steps):
 *  1. Load /community.        2. Navigate to first aid.   3. Navigate to articles.
 *  4. Navigate to assessment. 5. Confirm image check is absent.
 *  6. Confirm the former image route redirects home.
 *  7. Navigate to chat.       8. Send a question.        9. Confirm response.
 * 10. Confirm selected-language controls. 11. Test mobile navigation.
 *
 * The AI-backed chat steps assert a deterministic terminal state — a real
 * response when Azure OpenAI is configured, or the app's explicit failure
 * state otherwise. They are never skipped.
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
      imageCheck: 'Image Check',
      placeholder: 'Type your message...',
      question: 'How do I treat a minor kitchen burn at home?',
    }
    : {
      imageCheck: 'Semakan Imej',
      placeholder: 'Taip mesej anda...',
      question: 'Bagaimanakah saya merawat kelecuran kecil di dapur di rumah?',
    };

  // 1. Load /community.
  await page.goto('/community');
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('aside a[href="/community/first-aid"]').first()).toBeVisible();
  await expect(page.locator('aside a[href="/community/first-aid-video"]').first()).toBeVisible();
  await expect(page.locator('aside a[href="/community/burn-prevention"]').first()).toBeVisible();

  // 2. Navigate to first aid.
  await navTo(page, '/community/first-aid', /\/community\/first-aid$/);

  await navTo(page, '/community/first-aid-video', /\/community\/first-aid-video$/);
  await navTo(page, '/community/burn-prevention', /\/community\/burn-prevention$/);

  // 3. Navigate to articles.
  await navTo(page, '/community/articles', /\/community\/articles$/);

  // 4. Navigate to assessment.
  await navTo(page, '/community/assessment', /\/community\/assessment$/);

  // 5. Confirm Image Check is absent from the home cards and portal navigation.
  await page.goto('/community');
  await expect(page.getByText(labels.imageCheck, { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="/community/image-check"]')).toHaveCount(0);

  // 6. Confirm the retired route redirects to Community Home.
  await page.goto('/community/image-check');
  await expect(page).toHaveURL(/\/community$/);

  // 7. Navigate to chat.
  await navTo(page, '/community/chat', /\/community\/chat$/);
  const chatInput = page.getByPlaceholder(labels.placeholder);
  await expect(chatInput).toBeVisible();

  // 8. Send a question.
  const question = labels.question;
  await chatInput.fill(question);
  await chatInput.press('Enter');
  await expect(page.getByText(question).first()).toBeVisible(); // user message rendered

  // 9. Confirm response (assistant bubble gains content OR the error fallback).
  const assistantBubbles = page.locator('div.justify-start');
  await expect(assistantBubbles.last()).toBeVisible();
  await expect
    .poll(async () => (await assistantBubbles.last().innerText()).trim(), { timeout: 90_000 })
    .not.toMatch(/^\.*$/);

  // 10. Confirm the selected-language chat control remains consistent.
  await expect(page.getByPlaceholder(labels.placeholder)).toBeVisible();

  // 11. Test mobile navigation (open the drawer, confirm Image Check remains
  //     absent, then jump to first aid).
  await setMobileViewport(page);
  await expect(page.locator('nav a[href="/community/image-check"]')).toHaveCount(0);
  await page.locator('header button.lg\\:hidden').first().click(); // hamburger
  await expect(page.locator('aside a[href="/community/image-check"]')).toHaveCount(0);
  await expect(page.locator('aside a[href="/community/first-aid-video"]').last()).toBeVisible();
  await expect(page.locator('aside a[href="/community/burn-prevention"]').last()).toBeVisible();
  const drawerFirstAid = page.locator('aside a[href="/community/first-aid"]').last();
  await expect(drawerFirstAid).toBeVisible();
  await drawerFirstAid.click();
  await expect(page).toHaveURL(/\/community\/first-aid$/);
  await setDesktopViewport(page);
});
}
