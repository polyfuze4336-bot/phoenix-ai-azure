/**
 * Phoenix AI v2.0 — synthetic demonstration dataset (pure, no I/O).
 *
 * =====================================================================
 *  SYNTHETIC DEMONSTRATION DATA ONLY. No real patients, no PII.
 *  Every record is fictional and clearly labelled in the UI.
 * =====================================================================
 *
 * Deterministic so the v2 dashboard, cases list, case detail, reports and
 * insights render identical content on every load and can be unit-tested. This
 * module powers the v2 UI ONLY and is never imported by the Original experience.
 */

import { SYNTHETIC_DATA_LABEL } from './version';

export type CaseType =
  | 'BURN'
  | 'DIABETIC_ULCER'
  | 'PRESSURE_ULCER'
  | 'TRAUMATIC_WOUND'
  | 'SURGICAL_WOUND';

export type Severity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type CaseStatus = 'ACTIVE' | 'MONITORING' | 'REFERRED' | 'HEALED';
export type Priority = 'ROUTINE' | 'URGENT' | 'CRITICAL';
export type BurnDegree = '1ST' | '2ND_SUPERFICIAL' | '2ND_DEEP' | '3RD';

export interface TimelineEvent {
  id: string;
  at: string; // ISO date
  kind: 'created' | 'analysis' | 'note' | 'referral' | 'dressing' | 'review';
  title: string;
  detail: string;
  author: string;
}

export interface DemoCase {
  id: string;
  /** Fictional non-identifying alias (never a real name). */
  alias: string;
  caseType: CaseType;
  burnDegree: BurnDegree | null;
  severity: Severity;
  status: CaseStatus;
  priority: Priority;
  tbsaPercent: number | null;
  bodyRegion: string;
  ageGroup: string;
  sex: 'M' | 'F';
  confidence: number; // 0..1
  mechanism: string;
  clinician: string;
  facility: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  recommendations: string[];
  timeline: TimelineEvent[];
  synthetic: true;
  label: string;
}

const CASE_TYPES: CaseType[] = [
  'BURN', 'BURN', 'BURN', 'DIABETIC_ULCER', 'PRESSURE_ULCER', 'TRAUMATIC_WOUND', 'SURGICAL_WOUND',
];
const SEVERITIES: Severity[] = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
const STATUSES: CaseStatus[] = ['ACTIVE', 'MONITORING', 'REFERRED', 'HEALED'];
const REGIONS = ['Head/Neck', 'Anterior Trunk', 'Right Upper Limb', 'Left Lower Limb', 'Hand', 'Foot', 'Perineum'];
const AGE_GROUPS = ['0-5', '6-12', '13-18', '19-40', '41-60', '60+'];
const BURN_DEGREES: BurnDegree[] = ['1ST', '2ND_SUPERFICIAL', '2ND_DEEP', '3RD'];
const MECHANISMS = ['Scald (hot liquid)', 'Flame', 'Contact (hot surface)', 'Chemical', 'Electrical', 'Friction', 'Pressure', 'Post-surgical'];
const CLINICIANS = ['Dr. A. Rahman', 'Dr. S. Lim', 'Dr. N. Kumar', 'Dr. M. Yusof', 'Dr. P. Chen'];
const ALIAS_PREFIX = ['Case', 'Patient', 'Record'];

/** Small deterministic PRNG (mulberry32) so the dataset is stable across loads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed reference "now" so relative dates in the demo are deterministic. */
const REFERENCE_NOW = new Date('2026-08-07T09:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildTimeline(rng: () => number, createdAt: number, caseType: CaseType, status: CaseStatus): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const author = pick(rng, CLINICIANS);
  events.push({
    id: 'ev-created',
    at: new Date(createdAt).toISOString(),
    kind: 'created',
    title: 'Case created',
    detail: 'Synthetic case opened for demonstration.',
    author,
  });
  events.push({
    id: 'ev-analysis',
    at: new Date(createdAt + Math.floor(rng() * 2 * DAY)).toISOString(),
    kind: 'analysis',
    title: 'AI assessment recorded',
    detail: 'Staged wound-analysis pipeline produced a structured assessment.',
    author: 'Phoenix AI',
  });
  events.push({
    id: 'ev-dressing',
    at: new Date(createdAt + Math.floor((2 + rng() * 3) * DAY)).toISOString(),
    kind: 'dressing',
    title: 'Dressing change',
    detail: 'Wound cleaned and re-dressed; no signs of infection noted.',
    author,
  });
  if (status === 'REFERRED') {
    events.push({
      id: 'ev-referral',
      at: new Date(createdAt + Math.floor((3 + rng() * 4) * DAY)).toISOString(),
      kind: 'referral',
      title: 'Referred to burns unit',
      detail: 'Escalated for specialist review per protocol.',
      author,
    });
  }
  if (status === 'HEALED') {
    events.push({
      id: 'ev-review',
      at: new Date(createdAt + Math.floor((7 + rng() * 10) * DAY)).toISOString(),
      kind: 'review',
      title: 'Wound healed',
      detail: 'Epithelialisation complete; case closed.',
      author,
    });
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

function severityToPriority(severity: Severity, status: CaseStatus): Priority {
  if (status === 'HEALED') return 'ROUTINE';
  if (severity === 'CRITICAL') return 'CRITICAL';
  if (severity === 'SEVERE') return 'URGENT';
  return 'ROUTINE';
}

let cachedCases: DemoCase[] | null = null;

/** Deterministic set of synthetic cases used across the v2 experience. */
export function getDemoCases(): DemoCase[] {
  if (cachedCases) return cachedCases;
  const rng = mulberry32(20260807);
  const total = 42;
  const rows: DemoCase[] = [];
  for (let i = 0; i < total; i++) {
    const caseType = CASE_TYPES[i % CASE_TYPES.length];
    const isBurn = caseType === 'BURN';
    const severity = pick(rng, SEVERITIES);
    const status = pick(rng, STATUSES);
    const createdAt = REFERENCE_NOW - Math.floor((rng() * 45 + 0.5) * DAY);
    const updatedAt = createdAt + Math.floor(rng() * 5 * DAY);
    const tbsaPercent = isBurn ? Number(((rng() * 34) + 1).toFixed(1)) : null;
    const confidence = Number((0.7 + rng() * 0.24).toFixed(2));
    const region = pick(rng, REGIONS);
    const mechanism = isBurn ? pick(rng, MECHANISMS.slice(0, 5)) : pick(rng, MECHANISMS);
    const clinician = pick(rng, CLINICIANS);
    const readableType = caseType.toLowerCase().replace(/_/g, ' ');
    rows.push({
      id: `v2-case-${String(i + 1).padStart(3, '0')}`,
      alias: `${pick(rng, ALIAS_PREFIX)} ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      caseType,
      burnDegree: isBurn ? pick(rng, BURN_DEGREES) : null,
      severity,
      status,
      priority: severityToPriority(severity, status),
      tbsaPercent,
      bodyRegion: region,
      ageGroup: pick(rng, AGE_GROUPS),
      sex: rng() > 0.5 ? 'M' : 'F',
      confidence,
      mechanism,
      clinician,
      facility: 'Demo Facility',
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
      summary: `Synthetic ${readableType} on ${region.toLowerCase()}${isBurn ? `, est. ${tbsaPercent}% TBSA` : ''}. Demonstration record only.`,
      recommendations: [
        'Clean with sterile saline; apply appropriate dressing.',
        'Monitor for signs of infection (redness, swelling, discharge).',
        status === 'REFERRED' ? 'Specialist review at burns unit.' : 'Review at next scheduled dressing change.',
      ],
      timeline: buildTimeline(rng, createdAt, caseType, status),
      synthetic: true,
      label: SYNTHETIC_DATA_LABEL,
    });
  }
  cachedCases = rows;
  return rows;
}

export function getDemoCaseById(id: string): DemoCase | undefined {
  return getDemoCases().find((c) => c.id === id);
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  monitoring: number;
  referred: number;
  healed: number;
  burnCases: number;
  criticalPriority: number;
  avgConfidence: number;
  avgTbsa: number;
}

export function getDashboardStats(): DashboardStats {
  const cases = getDemoCases();
  const burns = cases.filter((c) => c.caseType === 'BURN');
  const tbsaVals = burns.map((c) => c.tbsaPercent ?? 0).filter((v) => v > 0);
  return {
    totalCases: cases.length,
    activeCases: cases.filter((c) => c.status === 'ACTIVE').length,
    monitoring: cases.filter((c) => c.status === 'MONITORING').length,
    referred: cases.filter((c) => c.status === 'REFERRED').length,
    healed: cases.filter((c) => c.status === 'HEALED').length,
    burnCases: burns.length,
    criticalPriority: cases.filter((c) => c.priority === 'CRITICAL').length,
    avgConfidence: Number((cases.reduce((s, c) => s + c.confidence, 0) / cases.length).toFixed(2)),
    avgTbsa: tbsaVals.length ? Number((tbsaVals.reduce((s, v) => s + v, 0) / tbsaVals.length).toFixed(1)) : 0,
  };
}

export interface Distribution {
  label: string;
  value: number;
}

/** Case-type distribution for insights charts (deterministic). */
export function getCaseTypeDistribution(): Distribution[] {
  const cases = getDemoCases();
  const map = new Map<string, number>();
  for (const c of cases) {
    const key = c.caseType.replace(/_/g, ' ');
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getSeverityDistribution(): Distribution[] {
  const cases = getDemoCases();
  const order: Severity[] = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
  return order.map((sev) => ({
    label: sev.charAt(0) + sev.slice(1).toLowerCase(),
    value: cases.filter((c) => c.severity === sev).length,
  }));
}

export function getStatusDistribution(): Distribution[] {
  const cases = getDemoCases();
  const order: CaseStatus[] = ['ACTIVE', 'MONITORING', 'REFERRED', 'HEALED'];
  return order.map((st) => ({
    label: st.charAt(0) + st.slice(1).toLowerCase(),
    value: cases.filter((c) => c.status === st).length,
  }));
}

/** Deterministic weekly case volume (last 8 weeks) derived from case createdAt. */
export function getWeeklyVolume(): Distribution[] {
  const cases = getDemoCases();
  const weeks: Distribution[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = REFERENCE_NOW - (w + 1) * 7 * DAY;
    const end = REFERENCE_NOW - w * 7 * DAY;
    const value = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= start && t < end;
    }).length;
    weeks.push({ label: `W-${w}`, value });
  }
  return weeks;
}
