import { test, expect, type Page } from '@playwright/test';
import { seedHcpAuth, seedLanguage } from './_helpers';

interface RouteExpectation {
  path: string;
  en: string;
  ms: string;
}

const communityRoutes: RouteExpectation[] = [
  { path: '/', en: 'AI-powered clinical decision support for healthcare professionals and health education for the community.', ms: 'Sokongan keputusan klinikal berkuasa AI untuk profesional penjagaan kesihatan dan pendidikan kesihatan untuk komuniti.' },
  { path: '/community', en: 'Welcome to Phoenix AI Community Health', ms: 'Selamat Datang ke Kesihatan Komuniti Phoenix AI' },
  { path: '/community/first-aid', en: 'First Aid Education', ms: 'Pendidikan Pertolongan Cemas' },
  { path: '/community/assessment', en: 'Burn Severity Self-Assessment', ms: 'Penilaian Kendiri Keterukan Kelecuran' },
  { path: '/community/articles', en: 'Health Articles', ms: 'Artikel Kesihatan' },
  { path: '/community/chat', en: 'Friendly health guidance for burns and wounds', ms: 'Panduan kesihatan mesra untuk kelecuran dan luka' },
];

const hcpRoutes: RouteExpectation[] = [
  { path: '/hcp', en: 'Clinical analytics overview for burn and wound cases', ms: 'Gambaran analitik klinikal bagi kes kelecuran dan luka' },
  { path: '/hcp/analysis', en: 'Upload or capture a wound/burn image for AI-powered clinical assessment', ms: 'Muat naik atau tangkap imej luka/kelecuran untuk penilaian klinikal berkuasa AI' },
  { path: '/hcp/tbsa', en: 'Severity Classification', ms: 'Klasifikasi Keterukan' },
  { path: '/hcp/parkland', en: 'Enter weight and TBSA% to calculate fluid requirements', ms: 'Masukkan berat dan TBSA% untuk mengira keperluan cecair' },
  { path: '/hcp/guidelines', en: 'Evidence-based protocols aligned with Malaysian CPG', ms: 'Protokol berasaskan bukti selaras dengan CPG Malaysia' },
  { path: '/hcp/history', en: 'Previously analysed wound images and their AI assessments, retained for reference.', ms: 'Imej luka yang dianalisis sebelum ini dan penilaian AInya, disimpan untuk rujukan.' },
  { path: '/hcp/chat', en: 'AI-powered burn & wound specialist consultation', ms: 'Perundingan pakar kelecuran & luka berkuasa AI' },
];

async function assertRoutes(
  page: Page,
  language: 'en' | 'ms',
  routes: RouteExpectation[],
): Promise<void> {
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('body')).toContainText(route[language]);
    const opposite = language === 'en' ? route.ms : route.en;
    await expect(page.locator('body')).not.toContainText(opposite);
  }
}

for (const language of ['en', 'ms'] as const) {
  test(`community routes render consistently in ${language}`, async ({ page }) => {
    await seedLanguage(page, language);
    await assertRoutes(page, language, communityRoutes);
  });

  test(`HCP routes render consistently in ${language}`, async ({ page }) => {
    await seedLanguage(page, language);
    await seedHcpAuth(page);
    await assertRoutes(page, language, hcpRoutes);
  });

  test(`HCP AI input surfaces display the clinical notice in ${language}`, async ({ page }) => {
    await seedLanguage(page, language);
    await seedHcpAuth(page);
    const label = language === 'en'
      ? 'Clinical and personal-data notice'
      : 'Notis klinikal dan data peribadi';

    for (const path of ['/hcp/analysis', '/hcp/chat']) {
      await page.goto(path);
      const notices = page.getByRole('note', { name: label });
      await expect(notices.filter({ hasText: language === 'en'
        ? 'does not replace professional clinical judgement'
        : 'tidak menggantikan pertimbangan profesional klinikal' })).toHaveCount(1);
      await expect(notices.filter({ hasText: language === 'en'
        ? 'Avoid entering unnecessary patient identifiers'
        : 'Elakkan memasukkan pengecam pesakit' })).toHaveCount(1);
      await expect(notices.filter({ hasText: language === 'en'
        ? 'applicable Malaysian personal data protection requirements'
        : 'keperluan perlindungan data peribadi Malaysia yang berkenaan' })).toHaveCount(1);
    }
  });
}

test('HCP chat keeps privacy notices outside the responsive conversation panel', async ({ page }) => {
  await seedLanguage(page, 'en');
  await seedHcpAuth(page);
  const viewports = [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/hcp/chat');

    const panel = page.getByTestId('hcp-chat-panel');
    const messages = page.getByTestId('hcp-chat-messages');
    const privacyNotices = page.getByTestId('hcp-chat-privacy-notices');
    const composer = page.getByPlaceholder('Type your message...');

    if (viewport.height < 800) {
      await composer.fill('Responsive layout check');
      await composer.press('Enter');
      await expect(page.getByText('Responsive layout check', { exact: true })).toBeVisible();
    }

    await expect(panel.getByText('Confidentiality', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('Personal Data', { exact: true })).toHaveCount(0);
    await expect(privacyNotices.getByText('Confidentiality', { exact: true })).toBeVisible();
    await expect(privacyNotices.getByText('Personal Data', { exact: true })).toBeVisible();

    const noticesBox = await privacyNotices.boundingBox();
    const messagesBox = await messages.boundingBox();
    const composerBox = await composer.boundingBox();

    expect(noticesBox).not.toBeNull();
    expect(messagesBox?.height ?? 0).toBeGreaterThan(viewport.height >= 800 ? 200 : 40);
    expect(noticesBox!.y).toBeGreaterThanOrEqual(composerBox!.y + composerBox!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    if (viewport.width < 1024) {
      const navigationBox = await page.locator('nav.fixed.bottom-0').boundingBox();
      expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(navigationBox!.y);
    }
  }
});