import { test, expect, type Page } from '@playwright/test';
import { seedHcpAuth, seedLanguage } from './_helpers';

interface RouteExpectation {
  path: string;
  en: string;
  ms: string;
}

const communityRoutes: RouteExpectation[] = [
  { path: '/community', en: 'Welcome to Phoenix AI Community Health', ms: 'Selamat Datang ke Kesihatan Komuniti Phoenix AI' },
  { path: '/community/first-aid', en: 'First Aid Education', ms: 'Pendidikan Pertolongan Cemas' },
  { path: '/community/assessment', en: 'Burn Severity Self-Assessment', ms: 'Penilaian Kendiri Keterukan Kelecuran' },
  { path: '/community/image-check', en: 'Upload a photo of your wound', ms: 'Muat naik gambar luka anda' },
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
    await expect(page.locator('main')).toContainText(route[language]);
    const opposite = language === 'en' ? route.ms : route.en;
    await expect(page.locator('main')).not.toContainText(opposite);
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
}