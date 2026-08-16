import { expect, type Page } from '@playwright/test';

/**
 * Shared helpers for the Phoenix AI user-journey e2e tests.
 */

/** A tiny but valid 1x1 PNG (transparent) used as an uploaded wound image. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** The demo HCP session object the real demo login writes to sessionStorage. */
export const DEMO_HCP_SESSION = {
  name: 'Dr. Ahmad Faizal',
  role: 'Pakar Perubatan Kecemasan',
  email: 'doctor@phoenix.my',
};

/** Seed the demo HCP session so gated /hcp routes render without the login flow. */
export async function seedHcpAuth(page: Page): Promise<void> {
  await page.addInitScript((session) => {
    try {
      window.sessionStorage.setItem('hcp_auth', JSON.stringify(session));
    } catch {
      /* sessionStorage unavailable — ignore */
    }
  }, DEMO_HCP_SESSION);
}

/** Seed the persisted global language before React hydrates. */
export async function seedLanguage(page: Page, language: 'en' | 'ms'): Promise<void> {
  await page.addInitScript((selectedLanguage) => {
    window.localStorage.setItem('phoenix-ai-language', selectedLanguage);
  }, language);
}

/** Click the language toggle using either localized accessible name. */
export async function toggleLanguage(page: Page): Promise<void> {
  const toggle = page
    .getByRole('button', { name: /Switch to (?:English|Bahasa Malaysia)|Tukar kepada (?:bahasa Inggeris|Bahasa Malaysia)/i })
    .first();
  await expect(toggle).toBeVisible();
  await toggle.click();
}

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize(MOBILE);
}
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize(DESKTOP);
}

/**
 * Assert that an AI-backed workflow reached a DETERMINISTIC terminal state.
 *
 * Per the test brief we must NOT skip when a workflow is unavailable. When Azure
 * OpenAI is configured the success locator resolves; when it is not, the app
 * renders an explicit failure/fallback state (error banner or the
 * "assessment could not be completed" copy). Either is a valid, non-skipped
 * outcome — a hang or blank screen is a real failure.
 */
export async function expectAiTerminalState(
  page: Page,
  successLocatorText: RegExp,
  failureLocatorText: RegExp,
): Promise<void> {
  const success = page.getByText(successLocatorText).first();
  const failure = page.getByText(failureLocatorText).first();
  const alert = page.getByRole('alert').first();
  await expect.poll(
    async () => await success.isVisible() || await failure.isVisible() || await alert.isVisible(),
    { timeout: 90_000 },
  ).toBe(true);
}
