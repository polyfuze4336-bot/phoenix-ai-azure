/**
 * Phoenix AI — pure demo seed data (no Prisma / no I/O).
 *
 * Extracted from `scripts/seed.ts` so the row → Prisma-model field mapping is
 * unit-testable without a database. `scripts/seed.ts` imports these builders and
 * performs the idempotent upserts.
 *
 * =====================================================================
 *  FICTIONAL DEMONSTRATION DATA ONLY. No real patients, no PII.
 * =====================================================================
 */

export const DEMO = '[DEMO]';

export const CASE_TYPES = [
  'BURN', 'BURN', 'BURN', 'DIABETIC_ULCER', 'PRESSURE_ULCER', 'TRAUMATIC_WOUND', 'SURGICAL_WOUND',
] as const;
export const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'] as const;
export const REGIONS = ['Head/Neck', 'Trunk', 'Upper Limb', 'Lower Limb', 'Perineum'] as const;
export const AGE_GROUPS = ['0-5', '6-12', '13-18', '19-40', '41-60', '60+'] as const;
export const OUTCOMES = ['HEALED', 'ONGOING', 'REFERRED', 'COMPLICATED'] as const;
export const BURN_DEGREES = ['1ST', '2ND_SUPERFICIAL', '2ND_DEEP', '3RD', '4TH'] as const;

export interface DemoCaseRow {
  id: string;
  caseType: string;
  burnDegree: string | null;
  severity: string;
  tbsaPercent: number | null;
  bodyRegion: string;
  confidence: number;
  ageGroup: string;
  outcome: string;
  characteristics: string;
  recommendations: string;
}

/** Deterministic (idempotent) set of fictional cases for dashboard analytics. */
export function buildDemoCases(): DemoCaseRow[] {
  const rows: DemoCaseRow[] = [];
  const total = 48;
  for (let i = 0; i < total; i++) {
    const caseType = CASE_TYPES[i % CASE_TYPES.length];
    const severity = SEVERITIES[i % SEVERITIES.length];
    const bodyRegion = REGIONS[i % REGIONS.length];
    const ageGroup = AGE_GROUPS[i % AGE_GROUPS.length];
    const outcome = OUTCOMES[i % OUTCOMES.length];
    const isBurn = caseType === 'BURN';
    const burnDegree = isBurn ? BURN_DEGREES[i % BURN_DEGREES.length] : null;
    const tbsaPercent = isBurn ? Number((((i * 7) % 45) + 1).toFixed(1)) : null;
    const confidence = Number((0.7 + (i % 25) / 100).toFixed(2)); // 0.70..0.94
    rows.push({
      id: `seed-case-${String(i + 1).padStart(4, '0')}`,
      caseType,
      burnDegree,
      severity,
      tbsaPercent,
      bodyRegion,
      confidence,
      ageGroup,
      outcome,
      characteristics: `${DEMO} Fictional ${caseType.toLowerCase().replace(/_/g, ' ')} sample for analytics.`,
      recommendations: `${DEMO} Demonstration case - not a real patient record.`,
    });
  }
  return rows;
}

/**
 * Community education articles. Copy mirrors the existing in-app content so that,
 * if the UI is later wired to the database, the visible text is unchanged.
 * Marked as seed data via the stable `seed-article-*` ids.
 */
export const DEMO_ARTICLES = [
  {
    id: 'seed-article-1',
    category: 'prevention',
    titleEn: 'Preventing Burns at Home',
    titleBm: 'Mencegah Kelecuran di Rumah',
    summaryEn: 'Simple household habits that prevent the most common burn injuries.',
    summaryBm: 'Tabiat rumah yang mudah untuk mencegah kecederaan kelecuran yang biasa.',
    contentEn:
      'Most burns happen at home, especially in the kitchen. Always supervise children around hot surfaces. Keep hot drinks away from table edges. Turn pot handles inward on the stove. Install smoke detectors and keep a fire extinguisher accessible. Never leave cooking unattended. Test bath water temperature before bathing children. Keep lighters and matches out of reach of children.',
    contentBm:
      'Kebanyakan kelecuran berlaku di rumah, terutamanya di dapur. Sentiasa awasi kanak-kanak di sekitar permukaan panas. Jauhkan minuman panas dari tepi meja. Pusingkan pemegang periuk ke dalam di atas dapur. Pasang pengesan asap dan simpan pemadam api yang mudah diakses. Jangan tinggalkan masakan tanpa pengawasan. Uji suhu air mandian sebelum memandikan kanak-kanak. Simpan pemetik api dan mancis di luar jangkauan kanak-kanak.',
  },
  {
    id: 'seed-article-2',
    category: 'wound_care',
    titleEn: 'Proper Wound Care at Home',
    titleBm: 'Penjagaan Luka yang Betul di Rumah',
    summaryEn: 'How to clean, dress, and monitor a wound safely at home.',
    summaryBm: 'Cara membersih, membalut, dan memantau luka dengan selamat di rumah.',
    contentEn:
      "Proper wound care is essential for healing. Start by washing your hands thoroughly. Clean the wound gently with clean water - avoid using alcohol or hydrogen peroxide as they can damage tissue. Apply a thin layer of antiseptic ointment. Cover with a sterile bandage and change it daily. Keep the wound moist for better healing. Watch for signs of infection: increasing redness, swelling, warmth, pus, or fever. Seek medical attention if the wound is deep, won't stop bleeding, or shows signs of infection.",
    contentBm:
      'Penjagaan luka yang betul adalah penting untuk penyembuhan. Mulakan dengan membasuh tangan anda dengan teliti. Bersihkan luka dengan lembut menggunakan air bersih - elakkan menggunakan alkohol atau hidrogen peroksida kerana ia boleh merosakkan tisu. Sapukan lapisan nipis salap antiseptik. Tutup dengan pembalut steril dan tukar setiap hari. Pastikan luka lembap untuk penyembuhan yang lebih baik. Perhatikan tanda-tanda jangkitan: kemerahan yang meningkat, bengkak, panas, nanah, atau demam. Dapatkan rawatan perubatan jika luka dalam, pendarahan tidak berhenti, atau menunjukkan tanda jangkitan.',
  },
  {
    id: 'seed-article-3',
    category: 'nutrition',
    titleEn: 'Nutrition for Wound Healing',
    titleBm: 'Pemakanan untuk Penyembuhan Luka',
    summaryEn: 'Key nutrients - protein, vitamin C, zinc, vitamin A - that support healing.',
    summaryBm: 'Nutrien utama - protein, vitamin C, zink, vitamin A - yang menyokong penyembuhan.',
    contentEn:
      'Good nutrition is crucial for wound healing. Protein is essential - eat lean meats, fish, eggs, dairy, and legumes. Vitamin C helps produce collagen - eat citrus fruits, strawberries, bell peppers, and broccoli. Zinc supports immune function - found in nuts, seeds, whole grains, and shellfish. Vitamin A promotes skin repair - found in sweet potatoes, carrots, spinach, and liver. Stay well-hydrated by drinking plenty of water. Avoid excessive sugar and processed foods that can impair healing.',
    contentBm:
      'Pemakanan yang baik adalah penting untuk penyembuhan luka. Protein adalah penting - makan daging tanpa lemak, ikan, telur, tenusu, dan kekacang. Vitamin C membantu menghasilkan kolagen - makan buah sitrus, strawberi, lada benggala, dan brokoli. Zink menyokong fungsi imun - terdapat dalam kacang, biji, bijirin penuh, dan kerang. Vitamin A menggalakkan pembaikan kulit - terdapat dalam ubi keledek, lobak merah, bayam, dan hati. Kekal terhidrat dengan minum banyak air. Elakkan gula berlebihan dan makanan diproses yang boleh menjejaskan penyembuhan.',
  },
  {
    id: 'seed-article-4',
    category: 'infection',
    titleEn: 'Recognizing Wound Infection',
    titleBm: 'Mengenal Pasti Jangkitan Luka',
    summaryEn: 'The warning signs of wound infection and when to seek care.',
    summaryBm: 'Tanda-tanda amaran jangkitan luka dan bila perlu mendapatkan rawatan.',
    contentEn:
      'Knowing the signs of wound infection can help you seek timely medical care. Watch for: increasing pain around the wound, spreading redness beyond the wound edges, swelling and warmth, yellow or green pus or discharge, foul smell from the wound, red streaks extending from the wound, fever or chills. If you notice any of these signs, seek medical attention promptly. Do not attempt to drain pus yourself. Keep the wound clean and covered while waiting for medical help.',
    contentBm:
      'Mengetahui tanda-tanda jangkitan luka dapat membantu anda mendapatkan rawatan perubatan tepat pada masanya. Perhatikan: peningkatan kesakitan di sekitar luka, kemerahan yang merebak melangkaui tepi luka, bengkak dan kehangatan, nanah kuning atau hijau, bau busuk dari luka, garis merah memanjang dari luka, demam atau menggigil. Jika anda melihat mana-mana tanda ini, dapatkan rawatan perubatan segera. Jangan cuba mengalirkan nanah sendiri. Pastikan luka bersih dan ditutup semasa menunggu bantuan perubatan.',
  },
  {
    id: 'seed-article-5',
    category: 'prevention',
    titleEn: 'Fire Safety and Emergency Preparedness',
    titleBm: 'Keselamatan Kebakaran dan Kesiapsiagaan Kecemasan',
    summaryEn: 'Prepare your home and family for fire emergencies.',
    summaryBm: 'Sediakan rumah dan keluarga anda untuk kecemasan kebakaran.',
    contentEn:
      'Being prepared for fire emergencies can save lives. Install smoke alarms on every level of your home. Create and practice a fire escape plan with your family. Keep fire extinguishers in the kitchen and garage. Know the stop-drop-and-roll technique if clothing catches fire. In case of fire, get out quickly, stay low to avoid smoke, and call 999. Never go back inside a burning building. Keep emergency numbers visible and accessible.',
    contentBm:
      'Bersedia untuk kecemasan kebakaran dapat menyelamatkan nyawa. Pasang penggera asap di setiap tingkat rumah anda. Cipta dan amalkan pelan pelarian kebakaran bersama keluarga. Simpan pemadam api di dapur dan garaj. Ketahui teknik berhenti-jatuh-berguling jika pakaian terbakar. Sekiranya berlaku kebakaran, keluar dengan cepat, rendahkan badan untuk mengelak asap, dan hubungi 999. Jangan masuk semula ke dalam bangunan yang terbakar. Simpan nombor kecemasan di tempat yang mudah dilihat dan diakses.',
  },
] as const;
