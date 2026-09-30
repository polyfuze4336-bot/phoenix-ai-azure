import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { seedLanguage } from './_helpers';

type Language = 'en' | 'ms';
const labels = {
  en: {
    cause: 'Type of burn', age: 'Age of the person (years)', time: 'Time since injury (hours)',
    size: 'How large is the burned area?', appearance: 'What does the burn look like?',
    pain: 'Rate the pain level (1-10)', scald: 'Scald / hot liquid', electrical: 'Electrical',
    contact: 'Contact', minor: 'Minor Burn', major: 'Major Burn', yes: 'Yes', unsure: 'Unsure',
    symptoms: ['Shortness of breath', 'Chest pain', 'Dizziness', 'Blurred vision', 'Tinnitus / ringing in the ears', 'Was there an explosion or blast?', 'Did the person lose consciousness at any time?', 'Does the burn involve the face or eyes?'],
    next: 'Continue to photo step', assess: 'See assessment', notice: 'Always check with a healthcare professional for proper assessment and advice.',
    indeterminate: 'Unable to classify this burn safely from the information provided. Please seek assessment from a healthcare professional.',
  },
  ms: {
    cause: 'Jenis kelecuran', age: 'Umur mangsa (tahun)', time: 'Tempoh sejak kecederaan (jam)',
    size: 'Seberapa besar kawasan yang terbakar?', appearance: 'Bagaimanakah rupa kelecuran?',
    pain: 'Nilaikan tahap kesakitan (1-10)', scald: 'Air atau cecair panas', electrical: 'Elektrik',
    contact: 'Sentuhan', minor: 'Kelecuran Ringan', major: 'Kelecuran Serius', yes: 'Ya', unsure: 'Tidak pasti',
    symptoms: ['Sesak nafas', 'Sakit dada', 'Pening', 'Penglihatan kabur', 'Telinga berdengung', 'Adakah berlaku letupan?', 'Adakah mangsa pernah pengsan?', 'Adakah kelecuran melibatkan muka atau mata?'],
    next: 'Teruskan ke langkah gambar', assess: 'Lihat penilaian', notice: 'Sentiasa dapatkan pemeriksaan dan nasihat daripada profesional kesihatan.',
    indeterminate: 'Tidak dapat mengelaskan kelecuran ini dengan selamat berdasarkan maklumat yang diberikan. Sila dapatkan pemeriksaan daripada profesional kesihatan.',
  },
};

async function fillQuestions(page: Page, lang: Language, opts: { cause?: string; size?: string; symptom?: number; answer?: string } = {}) {
  const text = labels[lang];
  await expect(page.getByLabel(text.cause)).toBeVisible();
  await expect(page.getByLabel(lang === 'en' ? 'Upload or take a photo' : 'Muat naik atau ambil gambar')).toHaveCount(0);
  await page.getByLabel(text.cause).selectOption({ label: opts.cause ?? text.scald });
  await page.getByLabel(text.age).fill('30');
  await page.getByLabel(text.time).fill('2');
  await page.getByLabel(text.size).selectOption({ label: opts.size ?? (lang === 'en' ? 'Smaller than a coin' : 'Lebih kecil daripada syiling') });
  await page.getByLabel(text.appearance).selectOption({ label: lang === 'en' ? 'Red, like a sunburn' : 'Merah, seperti selaran matahari' });
  await page.getByLabel(text.pain).selectOption({ label: lang === 'en' ? 'Mild (1-3)' : 'Ringan (1-3)' });
  for (let i = 0; i < text.symptoms.length; i++) {
    await page.getByRole('group', { name: text.symptoms[i] }).getByLabel(i === opts.symptom ? opts.answer ?? text.yes : lang === 'en' ? 'No' : 'Tidak', { exact: true }).check();
  }
  await page.getByRole('button', { name: text.next }).click();
  await expect(page.getByText(lang === 'en' ? /You can now upload or take a photo/ : /Anda kini boleh memuat naik atau mengambil gambar/)).toBeVisible();
}

for (const lang of ['en', 'ms'] as const) {
  test(`Community burn questionnaire, Minor, Major, 999, indeterminate and first aid in ${lang}`, async ({ page }) => {
    const text = labels[lang];
    await seedLanguage(page, lang);
    await page.goto('/community/assessment');
    await fillQuestions(page, lang);
    await page.getByRole('button', { name: text.assess }).click();
    await expect(page.getByRole('heading', { name: text.minor })).toBeVisible();
    await expect(page.getByText(text.notice, { exact: true })).toBeVisible();
    await page.getByRole('link', { name: lang === 'en' ? 'First Aid Tips' : 'Tips Pertolongan Cemas' }).click();
    await expect(page).toHaveURL(/\/community\/first-aid$/);

    await page.goto('/community/assessment');
    await fillQuestions(page, lang, { cause: text.electrical });
    await page.getByRole('button', { name: text.assess }).click();
    await expect(page.getByRole('heading', { name: text.major })).toBeVisible();
    await expect(page.getByText(text.notice, { exact: true })).toBeVisible();

    await page.goto('/community/assessment');
    await fillQuestions(page, lang, { cause: text.contact, symptom: 1 });
    await page.getByRole('button', { name: text.assess }).click();
    await expect(page.getByRole('heading', { name: text.major })).toBeVisible();
    await expect(page.getByRole('link', { name: lang === 'en' ? 'Call 999 immediately' : 'Hubungi 999 segera' })).toHaveAttribute('href', 'tel:999');
    await expect(page.getByText(text.notice, { exact: true })).toBeVisible();

    await page.goto('/community/assessment');
    await fillQuestions(page, lang, { cause: text.contact });
    await page.getByRole('button', { name: text.assess }).click();
    await expect(page.getByRole('heading', { name: text.indeterminate })).toBeVisible();
    await expect(page.getByText(text.notice, { exact: true })).toBeVisible();
  });

  test(`First Aid primary order and safety content in ${lang}`, async ({ page }) => {
    await seedLanguage(page, lang);
    await page.goto('/community/first-aid');
    const headings = await page.locator('button h3').allTextContents();
    expect(headings).toEqual(lang === 'en'
      ? ['Flame Burn', 'Contact / Scald Burn', 'Chemical Burn', 'Electrical Burn', 'Wound First Aid']
      : ['Kelecuran Akibat Api', 'Kelecuran Akibat Sentuhan / Cecair Panas', 'Kelecuran Kimia', 'Kelecuran Elektrik', 'Pertolongan Cemas Luka']);
    await expect(page.getByText(lang === 'en' ? /Extinguish flames: Stop/ : /Padamkan api: Berhenti/)).toBeVisible();
    await page.getByRole('button', { name: headings[1] }).click();
    await expect(page.getByText(lang === 'en' ? '2. Cool under running water for 20 minutes' : '2. Sejukkan di bawah air mengalir selama 20 minit')).toBeVisible();
    await page.getByRole('button', { name: headings[2] }).click();
    await expect(page.getByText(lang === 'en' ? '2. Brush off dry chemicals before irrigation' : '2. Sapu bahan kimia kering sebelum membilas dengan air')).toBeVisible();
    await page.getByRole('button', { name: headings[3] }).click();
    await expect(page.getByText(lang === 'en' ? /Turn off the power before touching/ : /Matikan bekalan elektrik sebelum menyentuh/)).toBeVisible();
    await expect(page.getByText(lang === 'en' ? /Do not assume a small skin burn/ : /Jangan anggap kelecuran kecil/)).toBeVisible();
  });
}

test('Community assessment and First Aid fit mobile, tablet and desktop', async ({ page }) => {
  await seedLanguage(page, 'ms');
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/community/assessment');
    await fillQuestions(page, 'ms', { symptom: 0 });
    await page.getByRole('button', { name: labels.ms.assess }).click();
    await expect(page.getByText(labels.ms.notice, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.goto('/community/first-aid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('valid photo upload follows questionnaire and cannot downgrade emergency', async ({ page }) => {
  await seedLanguage(page, 'en');
  await page.goto('/community/assessment');
  await fillQuestions(page, 'en', { symptom: 0 });
  await page.route('**/api/community-burn', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.answers.shortnessOfBreath).toBe('yes');
    expect(payload.image.length).toBeGreaterThan(0);
    await route.fulfill({ json: { classification: 'minor', disposition: 'clinic', observation: 'Red area visible.' } });
  });
  await page.getByLabel('Upload or take a photo').setInputFiles(path.join(__dirname, '../images/demo-reliability/demo-analysis.png'));
  await page.getByRole('button', { name: 'See assessment' }).click();
  await expect(page.getByRole('heading', { name: 'Major Burn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call 999 immediately' })).toBeVisible();
});
