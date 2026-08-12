import { test, expect, type Page } from '@playwright/test';
import {
  TINY_PNG,
  expectAiTerminalState,
  setMobileViewport,
  setDesktopViewport,
} from './_helpers';

/**
 * HCP journey (verbatim steps):
 *  1. Load /hcp-login.        2. Use demo doctor login.   3. Reach /hcp.
 *  4. Navigate to analysis.   5. Upload two valid views.  6. Request AI assessment.
 *  7. Confirm loading state.  8. Confirm structured result.
 *  9. Navigate to chat.      10. Send a clinical question. 11. Confirm streaming response.
 * 12. Navigate to TBSA.      13. Complete a TBSA calculation.
 * 14. Navigate to Parkland.  15. Complete a fluid calculation.
 * 16. Navigate to guidelines.17. Confirm content.
 * 18. Test mobile navigation.19. Log out.
 *
 * AI-backed steps (6-8, 10-11) assert a deterministic terminal state: a real
 * result when Azure OpenAI is configured, or the app's explicit failure/fallback
 * state otherwise. They are never skipped.
 */

/** Click the visible desktop-sidebar nav link for an HCP route and await the URL. */
async function navTo(page: Page, href: string, urlRe: RegExp): Promise<void> {
  await page.locator(`aside a[href="${href}"]`).first().click();
  await expect(page).toHaveURL(urlRe);
}

test('hcp journey', async ({ page }) => {
  // 1. Load /hcp-login.
  await page.goto('/hcp-login');
  await expect(page.getByRole('heading', { name: /Healthcare Professional Portal/i })).toBeVisible();

  // 2. Use demo doctor login (verified server-side via /api/auth/login).
  await page.locator('input[type="email"]').fill('doctor@phoenix.my');
  await page.locator('input[type="password"]').fill('phoenix2026');
  await page.getByRole('button', { name: /^Sign In$/ }).click();

  // 3. Reach /hcp.
  await expect(page).toHaveURL(/\/hcp$/);
  await expect(page.locator('aside a[href="/hcp/analysis"]').first()).toBeVisible();

  // 4. Navigate to analysis.
  await navTo(page, '/hcp/analysis', /\/hcp\/analysis$/);
  await expect(page.getByRole('heading', { name: /AI Wound & Burn Analysis/i })).toBeVisible();

  // 5. Upload two views (identical fixture bytes intentionally exercise duplicate-view handling).
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'wound-view-1.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'wound-view-2.png', mimeType: 'image/png', buffer: TINY_PNG },
  ]);
  await expect(page.getByText('View 1')).toBeVisible();
  await expect(page.getByText('View 2')).toBeVisible();
  const analyzeBtn = page.getByRole('button', { name: /Analyze Image/i });
  await expect(analyzeBtn).toBeVisible();

  // 6. Request AI assessment.
  await analyzeBtn.click();

  // 7. Confirm loading state (the analyze button is disabled while analyzing).
  await expect(page.getByRole('button', { name: /Analyzing/i })).toBeVisible();

  // 8. Confirm structured result (real result OR the explicit unavailable state).
  await expectAiTerminalState(
    page,
    /Analysis Results/i,
    /Analysis failed|could not be completed/i,
  );

  // 9. Navigate to chat.
  await navTo(page, '/hcp/chat', /\/hcp\/chat$/);
  const chatInput = page.getByPlaceholder(/type|message|soalan|question/i).first();
  await expect(chatInput).toBeVisible();

  // 10. Send a clinical question.
  const question = 'What is the initial management of a deep partial-thickness burn?';
  await chatInput.fill(question);
  await chatInput.press('Enter');
  await expect(page.getByText(question).first()).toBeVisible(); // user message rendered

  // 11. Confirm streaming response (assistant bubble gains content OR the error
  //     fallback — both are deterministic, never a hang).
  const assistantBubbles = page.locator('div.justify-start');
  await expect(assistantBubbles.last()).toBeVisible();
  await expect
    .poll(async () => (await assistantBubbles.last().innerText()).trim(), { timeout: 90_000 })
    .not.toMatch(/^\.*$/);

  // 12. Navigate to TBSA.
  await navTo(page, '/hcp/tbsa', /\/hcp\/tbsa$/);
  await expect(page.getByRole('heading', { name: /TBSA/i }).first()).toBeVisible();

  // 13. Complete a TBSA calculation by painting over the body figure.
  const canvas = page.locator('canvas.cursor-crosshair').first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const cx = box.x + box.width / 2;
    // Paint a few vertical strokes down the torso so the region mask registers.
    for (const offset of [-8, 0, 8]) {
      await page.mouse.move(cx + offset, box.y + box.height * 0.28);
      await page.mouse.down();
      await page.mouse.move(cx + offset, box.y + box.height * 0.5, { steps: 12 });
      await page.mouse.up();
    }
  }
  // The Total TBSA readout should now be greater than zero.
  const totalReadout = page.locator('p.font-mono.text-5xl').first();
  await expect(totalReadout).toBeVisible();
  await expect.poll(async () => (await totalReadout.innerText()).trim(), { timeout: 15_000 }).not.toBe('0%');

  // 14. Navigate to Parkland.
  await navTo(page, '/hcp/parkland', /\/hcp\/parkland$/);
  await expect(page.getByRole('heading', { name: /Parkland|Fluid/i }).first()).toBeVisible();

  // 15. Complete a fluid calculation (weight 70 kg, TBSA 25%).
  const numbers = page.locator('input[type="number"]');
  await numbers.nth(0).fill('70');
  await numbers.nth(1).fill('25');
  // Parkland: 4 x 70 x 25 = 7000 mL total over 24h.
  await expect(page.getByText(/7000\s*mL/i).first()).toBeVisible();

  // 16. Navigate to guidelines.
  await navTo(page, '/hcp/guidelines', /\/hcp\/guidelines$/);

  // 17. Confirm content.
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();

  // 18. Test mobile navigation (open the drawer, jump to the dashboard).
  await setMobileViewport(page);
  await page.locator('header button.lg\\:hidden').first().click(); // hamburger
  const drawerDashboard = page.locator('aside a[href="/hcp"]').last();
  await expect(drawerDashboard).toBeVisible();
  await drawerDashboard.click();
  await expect(page).toHaveURL(/\/hcp$/);
  await setDesktopViewport(page);

  // 19. Log out (open the profile menu, then Sign Out).
  await page.locator('header button:has(div.rounded-full)').first().click();
  await page.getByRole('button', { name: /Sign Out|Log Keluar/i }).click();
  await expect(page).toHaveURL(/\/hcp-login$/);
});
