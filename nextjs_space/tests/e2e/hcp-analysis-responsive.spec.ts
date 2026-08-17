import { expect, test, type Page } from '@playwright/test';
import { seedHcpAuth, TINY_PNG } from './_helpers';

const LONG_TEXT = 'Clinical assessment text '.repeat(20)
  + 'continuous-clinical-token-without-natural-breaks-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const RESULT = {
  fitzpatrickType: 'Type III',
  fitzpatrickNote: LONG_TEXT,
  woundCategory: 'Burn',
  woundType: LONG_TEXT,
  burnDegree: 'Deep partial thickness',
  severity: 'Moderate',
  characteristics: LONG_TEXT,
  tissueComposition: LONG_TEXT,
  exudate: LONG_TEXT,
  woundEdges: LONG_TEXT,
  confidence: 'Moderate',
  tbsaEstimate: '18',
  tbsaRange: '16–20%',
  tbsaBodyRegions: LONG_TEXT,
  tbsaMethod: `Lund and Browder ${LONG_TEXT}`,
  isBurn: true,
  parklandFluid: `4 mL × 70 kg × 18% TBSA = 5040 mL\n${LONG_TEXT}`,
  firstAid: LONG_TEXT,
  woundCare: LONG_TEXT,
  dressing: LONG_TEXT,
  referral: LONG_TEXT,
  followUp: LONG_TEXT,
  structured: {
    analysisQuality: 'MODERATE',
    imageQuality: { adequate: true, issues: [], note: '' },
    observation: {
      observedSkinTone: 'medium',
      anatomicalLocation: LONG_TEXT,
      visibleFindings: [LONG_TEXT],
      scalePresent: false,
    },
    interpretation: {
      woundCategory: field('Burn'),
      burnDepth: field(LONG_TEXT),
      burnMechanism: field(LONG_TEXT),
      tissueComposition: field(LONG_TEXT),
      exudate: field(LONG_TEXT),
      infectionSigns: field(LONG_TEXT),
      edgesAndPeriwound: field(LONG_TEXT),
      isBurn: true,
      reportedFitzpatrickType: 'unknown',
      skinToneInterpretationNote: LONG_TEXT,
      measuredDimensions: 'unavailable',
      visualExtent: LONG_TEXT,
      tbsaAssumptions: [LONG_TEXT],
      tbsaLimitations: [LONG_TEXT],
    },
    parkland: { indicated: 'indicated', requiresWeight: false, summary: LONG_TEXT },
    confidenceByCategory: { woundCategory: 'moderate' },
    missingInformation: [LONG_TEXT],
    limitations: [LONG_TEXT],
    redFlags: [LONG_TEXT],
    recommendedFollowUpQuestions: [LONG_TEXT],
    qualityChecks: { pass: true, issues: [], recommendedCorrections: [] },
    overallConfidence: 'moderate',
  },
};

function field(interpretation: string) {
  return {
    observation: LONG_TEXT,
    interpretation,
    confidence: 'moderate',
    basis: [LONG_TEXT],
  };
}

async function expectViewportContained(page: Page, width: number) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    mainWidth: document.querySelector('main')?.scrollWidth ?? 0,
    mainClientWidth: document.querySelector('main')?.clientWidth ?? 0,
    navWidth: document.querySelector('nav.fixed')?.scrollWidth ?? 0,
    navClientWidth: document.querySelector('nav.fixed')?.clientWidth ?? 0,
  }));

  expect(dimensions.viewportWidth).toBe(width);
  expect(dimensions.documentWidth).toBeLessThanOrEqual(width);
  expect(dimensions.mainWidth).toBeLessThanOrEqual(dimensions.mainClientWidth);
  if (width < 1024) {
    expect(dimensions.navWidth).toBeLessThanOrEqual(dimensions.navClientWidth);
  }
}

test('analysis results remain contained at phone, tablet, and desktop widths', async ({ page }) => {
  await seedHcpAuth(page);
  await page.route('**/api/analyze-wound', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify({ status: 'completed', result: RESULT })}\n\n`,
    });
  });
  await page.route('**/api/hcp/analyses', async (route) => {
    await route.fulfill({ status: 204 });
  });

  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/hcp/analysis');
    await expect(page.getByRole('heading', { name: 'AI Wound & Burn Analysis' })).toBeVisible();
    await expectViewportContained(page, width);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'safe-demo.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await page.getByRole('button', { name: 'Analyze Image' }).click();
    await expect(page.getByRole('heading', { name: 'Analysis Results' })).toBeVisible();
    await expect(page.getByText('TBSA Estimation')).toBeVisible();
    await expect(page.getByText('Parkland Formula')).toBeVisible();
    await expect(page.getByText('Management Recommendations')).toBeVisible();
    await expect(page.getByText('Why this assessment?')).toBeVisible();

    await page.getByRole('button', { name: /Wound Category/i }).click();
    await expect(page.getByText('Observed:', { exact: false }).first()).toBeVisible();
    await expectViewportContained(page, width);
  }
});
