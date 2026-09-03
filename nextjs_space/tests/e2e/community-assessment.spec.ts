import { test, expect, type Page } from '@playwright/test';
import { seedLanguage } from './_helpers';

type Language = 'en' | 'ms';
type Severity = 'minor' | 'moderate' | 'emergency';

const cases: Record<Language, Record<Severity, {
  answers: string[];
  title: string;
  nextStep: string;
  emergencyButton?: string;
}>> = {
  en: {
    minor: {
      answers: ['Hot liquid (water, oil)', 'Smaller than a coin', 'Red, like a sunburn', 'Mild (1-3)'],
      title: 'Minor — Professional Review Recommended',
      nextStep: 'Even if the burn appears minor, consider having it assessed by a community healthcare professional, clinic, or primary care provider.',
    },
    moderate: {
      answers: ['Fire/Flame', 'About the size of your palm', 'Red with blisters', 'Mild (1-3)'],
      title: 'Moderate — Seek Medical Assessment',
      nextStep: 'Please seek assessment by a healthcare professional at a hospital or appropriate medical facility.',
    },
    emergency: {
      answers: ['Electrical', 'Covers a large body area (arm, leg, chest)', 'White, waxy, or charred', 'No pain / Numbness (10)'],
      title: 'Emergency — Go to Hospital Immediately',
      nextStep: 'Please seek urgent medical assessment at a hospital. Call 999 or go to the nearest Emergency Department immediately.',
      emergencyButton: 'Call 999 Now',
    },
  },
  ms: {
    minor: {
      answers: ['Cecair panas (air, minyak)', 'Lebih kecil daripada syiling', 'Merah, seperti selaran matahari', 'Ringan (1-3)'],
      title: 'Ringan — Penilaian Profesional Disyorkan',
      nextStep: 'Walaupun kecederaan melecur kelihatan ringan, pertimbangkan untuk mendapatkan penilaian daripada profesional penjagaan kesihatan di klinik atau perkhidmatan penjagaan kesihatan primer.',
    },
    moderate: {
      answers: ['Api atau nyalaan', 'Kira-kira sebesar tapak tangan anda', 'Merah dengan lepuh', 'Ringan (1-3)'],
      title: 'Sederhana — Dapatkan Penilaian Perubatan',
      nextStep: 'Sila dapatkan penilaian daripada profesional penjagaan kesihatan di hospital atau fasiliti perubatan yang sesuai.',
    },
    emergency: {
      answers: ['Elektrik', 'Meliputi kawasan badan yang besar (lengan, kaki, dada)', 'Putih, berlilin, atau hangus', 'Tiada sakit atau kebas (10)'],
      title: 'Kecemasan — Pergi ke Hospital Segera',
      nextStep: 'Sila dapatkan penilaian perubatan dengan segera di hospital. Hubungi 999 atau pergi ke Jabatan Kecemasan terdekat dengan segera.',
      emergencyButton: 'Hubungi 999 Sekarang',
    },
  },
};

async function completeAssessment(page: Page, answers: string[]): Promise<void> {
  for (const answer of answers) {
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
}

for (const language of ['en', 'ms'] as const) {
  for (const severity of ['minor', 'moderate', 'emergency'] as const) {
    test(`self-assessment ${severity} result recommends professional care in ${language}`, async ({ page }) => {
      await seedLanguage(page, language);
      await page.goto('/community/assessment');
      const expected = cases[language][severity];
      await completeAssessment(page, expected.answers);

      await expect(page.getByRole('heading', { name: expected.title })).toBeVisible();
      await expect(page.getByText(expected.nextStep, { exact: true })).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/no (?:medical attention|healthcare assessment) (?:is )?(?:needed|required)/i);

      if (expected.emergencyButton) {
        const emergencyLink = page.getByRole('link', { name: expected.emergencyButton });
        await expect(emergencyLink).toBeVisible();
        await expect(emergencyLink).toHaveAttribute('href', 'tel:999');
      }
    });
  }
}

test('login and Bahasa Malaysia assessment results fit supported mobile and desktop widths', async ({ page }) => {
  await seedLanguage(page, 'ms');
  for (const width of [320, 360, 375, 390, 412, 430, 1280]) {
    await page.setViewportSize({ width, height: width === 1280 ? 900 : 844 });
    await page.goto('/hcp-login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.goto('/community/assessment');
    await completeAssessment(page, cases.ms.minor.answers);
    await expect(page.getByText(cases.ms.minor.nextStep, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
