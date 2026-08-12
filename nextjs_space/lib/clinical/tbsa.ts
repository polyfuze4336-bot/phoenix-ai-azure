/**
 * Total Body Surface Area (TBSA) burn calculation (pure) — Lund & Browder chart.
 *
 * Extracted verbatim from the TBSA calculator UI so the age-variable body chart
 * and the region percentage maths are unit-testable without a browser/canvas.
 * The pixel-counting that produces the per-region `Counts` still lives in the
 * client component; everything downstream of the counts is pure and lives here.
 *
 * This is a faithful migration: the constants, per-region maxima, rounding and
 * severity bands are unchanged from the original component.
 */

export type AgeGroup = '0' | '1' | '5' | '10' | '15' | 'adult';

export const REGION_KEYS = [
  'head', 'neck', 'antTrunk', 'postTrunk',
  'rightArm', 'leftArm', 'buttocks', 'genitalia',
  'rightLeg', 'leftLeg',
] as const;
export type RegionKey = (typeof REGION_KEYS)[number];

/** Per-region painted pixel counts (total / partial-thickness / full-thickness). */
export interface Counts {
  total: Record<string, number>;
  ptl: Record<string, number>;
  ftl: Record<string, number>;
}

export interface TbsaRegionRow {
  region: RegionKey;
  ptlPct: number;
  ftlPct: number;
}

export interface TbsaBreakdown {
  rows: TbsaRegionRow[];
  ptlTotal: number;
  ftlTotal: number;
  total: number;
}

export type PhotographicTbsaClassification = 'Minor' | 'Major' | 'Unavailable';

export interface PhotographicTbsaResult {
  estimate: number | null;
  classification: PhotographicTbsaClassification;
}

/**
 * Bound an AI-reported photographic TBSA and classify it deterministically.
 * Exactly 15% is Major; Minor is strictly below 15%.
 */
export function classifyPhotographicTbsa(value: number | null): PhotographicTbsaResult {
  if (value == null || !Number.isFinite(value)) {
    return { estimate: null, classification: 'Unavailable' };
  }
  const estimate = round1(Math.min(100, Math.max(0, value)));
  return { estimate, classification: estimate >= 15 ? 'Major' : 'Minor' };
}

// Lund & Browder age-variable areas (½ of the region; doubled where paired).
export const VARIABLE_AREAS = {
  head: { label: 'A = ½ OF HEAD', '0': 9.5, '1': 8.5, '5': 6.5, '10': 5.5, '15': 4.5, 'adult': 3.5 },
  thigh: { label: 'B = ½ OF ONE THIGH', '0': 2.75, '1': 3.25, '5': 4, '10': 4.25, '15': 4.5, 'adult': 4.75 },
  lowerLeg: { label: 'C = ½ OF ONE LOWER LEG', '0': 2.5, '1': 2.5, '5': 2.75, '10': 3, '15': 3.25, 'adult': 3.5 },
};

const FIXED_MAXES: Record<RegionKey, number> = {
  head: 0, neck: 2, antTrunk: 13, postTrunk: 13, rightArm: 9, leftArm: 9,
  buttocks: 5, genitalia: 1, rightLeg: 0, leftLeg: 0,
};

/** Maximum TBSA % attributable to a whole region for the given age band. */
export function getMaxForRegion(region: RegionKey, age: AgeGroup): number {
  if (region === 'head') return VARIABLE_AREAS.head[age] * 2;
  if (region === 'rightLeg' || region === 'leftLeg') {
    return (VARIABLE_AREAS.thigh[age] * 2) + (VARIABLE_AREAS.lowerLeg[age] * 2) + 3.5;
  }
  return FIXED_MAXES[region];
}

/** Render a decimal as a mixed fraction (e.g. 3.5 -> "3½"). */
export function formatFraction(n: number): string {
  if (n === Math.floor(n)) return String(n);
  const whole = Math.floor(n);
  const frac = n - whole;
  if (Math.abs(frac - 0.25) < 0.01) return whole ? `${whole}¼` : '¼';
  if (Math.abs(frac - 0.5) < 0.01) return whole ? `${whole}½` : '½';
  if (Math.abs(frac - 0.75) < 0.01) return whole ? `${whole}¾` : '¾';
  return String(n);
}

/** Clinical severity band for a total TBSA percentage. */
export function getSeverity(tbsa: number): { label: string; color: string } {
  if (tbsa < 10) return { label: 'Minor (<10%)', color: 'bg-green-500' };
  if (tbsa <= 20) return { label: 'Moderate (10-20%)', color: 'bg-yellow-500' };
  if (tbsa <= 40) return { label: 'Major (20-40%)', color: 'bg-orange-500' };
  return { label: 'Critical (>40%)', color: 'bg-red-600' };
}

/** Round to one decimal place. */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Combine anterior + posterior painted counts into per-region and total burn
 * percentages, scaled to each region's age-adjusted maximum.
 */
export function computeTbsaBreakdown(
  antCounts: Counts,
  postCounts: Counts,
  age: AgeGroup,
): TbsaBreakdown {
  const rows = REGION_KEYS.map((region): TbsaRegionRow => {
    const tot = (antCounts.total[region] || 0) + (postCounts.total[region] || 0);
    const p = (antCounts.ptl[region] || 0) + (postCounts.ptl[region] || 0);
    const f = (antCounts.ftl[region] || 0) + (postCounts.ftl[region] || 0);
    const max = getMaxForRegion(region, age);
    const ptlPct = tot > 0 ? round1((p / tot) * max) : 0;
    const ftlPct = tot > 0 ? round1((f / tot) * max) : 0;
    return { region, ptlPct, ftlPct };
  });
  const ptlTotal = round1(rows.reduce((a, r) => a + r.ptlPct, 0));
  const ftlTotal = round1(rows.reduce((a, r) => a + r.ftlPct, 0));
  return { rows, ptlTotal, ftlTotal, total: round1(ptlTotal + ftlTotal) };
}
