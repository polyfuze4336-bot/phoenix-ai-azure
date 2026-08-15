/**
 * Burn/wound analysis evaluation harness.
 *
 * PURPOSE: measure the staged pipeline's COMPLETENESS, SAFETY and referral
 * APPROPRIATENESS against a rubric-labelled dataset — and, when a baseline
 * fixture is available, compare it to the legacy single-pass output.
 *
 * HONESTY / SCOPE:
 *  - This harness scores STRUCTURED BEHAVIOUR (are the required analytical
 *    dimensions present? are the safety rules honoured? is referral escalation
 *    appropriate?). It does NOT, and cannot, certify diagnostic accuracy — that
 *    needs clinician-labelled ground truth on real, consented images.
 *  - No scores are fabricated. Cases with `imagePath: null` and no Azure
 *    configuration run in RUBRIC-ONLY mode against provided fixtures, or are
 *    reported as SKIPPED (live model call not possible here).
 *
 * USAGE:
 *   npx tsx tests/evaluation/burn-wound/evaluate.ts            # rubric/structure
 *   AZURE_AI_ENDPOINT=... AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT=... \
 *     npx tsx tests/evaluation/burn-wound/evaluate.ts --live   # live, needs images
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BurnWoundAnalysis } from '../../../lib/ai/schemas/burn-wound-analysis';

const HERE = dirname(fileURLToPath(import.meta.url));

interface Rubric {
  expectIsBurn: boolean | null;
  expectCategoryKeywords: string[];
  minReferralLevel: 'routine' | 'consultation' | 'urgent' | 'transfer';
  requireRedFlags: boolean;
  safety: Record<string, unknown>;
  requiredDimensions: string[];
}
interface Case {
  id: string;
  scenario: string;
  context: { weightKg?: number; mechanism?: string; fitzpatrickType?: string };
  imagePath: string | null;
  rubric: Rubric;
}

const REFERRAL_ORDER = ['routine', 'consultation', 'urgent', 'transfer'];

interface CaseScore {
  id: string;
  mode: 'live' | 'fixture' | 'skipped';
  completeness: number; // 0..1
  safety: number; // 0..1
  appropriateness: number; // 0..1
  weighted: number; // 0..1
  failures: string[];
}

/** Score a produced analysis against a case rubric. */
export function scoreAnalysis(a: BurnWoundAnalysis, c: Case): Omit<CaseScore, 'id' | 'mode'> {
  const failures: string[] = [];

  // Completeness — required analytical dimensions present & non-empty.
  const present = (dim: string): boolean => {
    switch (dim) {
      case 'imageQuality': return !!a.imageQuality;
      case 'woundCategory': return !!a.interpretation.woundCategory.interpretation || !!a.interpretation.woundCategory.observation;
      case 'burnDepth': return !!a.interpretation.burnDepth.interpretation;
      case 'tissueComposition': return !!a.interpretation.tissueComposition.interpretation;
      case 'exudate': return !!a.interpretation.exudate.interpretation;
      case 'tbsa': return a.interpretation.tbsaEstimate != null;
      case 'parkland': return !!a.parkland.summary;
      case 'management': return !!a.management.firstAid || !!a.management.woundCare;
      case 'missingInformation': return a.missingInformation.length > 0;
      case 'limitations': return a.limitations.length > 0;
      default: return false;
    }
  };
  const completePresent = c.rubric.requiredDimensions.filter(present);
  const completeness = c.rubric.requiredDimensions.length ? completePresent.length / c.rubric.requiredDimensions.length : 1;
  for (const d of c.rubric.requiredDimensions) if (!present(d)) failures.push(`missing dimension: ${d}`);

  // Safety — the correctness guarantees the redesign is responsible for.
  const s = c.rubric.safety;
  const safetyChecks: Array<[boolean, string]> = [];
  if (s.measuredDimensionsUnavailable) safetyChecks.push([a.interpretation.measuredDimensions === 'unavailable', 'measuredDimensions should be unavailable']);
  if (s.fitzpatrickUnknown) safetyChecks.push([a.interpretation.reportedFitzpatrickType.toLowerCase() === 'unknown', 'fitzpatrick should be unknown']);
  if (s.parklandRequiresWeight) safetyChecks.push([a.parkland.requiresWeight === true, 'parkland should require weight']);
  if (s.parklandComputed) safetyChecks.push([a.parkland.total24hMl != null, 'parkland should be computed']);
  if (s.noAssumedWeight) safetyChecks.push([!/70\s?kg/i.test(a.parkland.summary), 'no assumed 70kg']);
  if (s.tbsaAbsentForNonBurn) safetyChecks.push([a.interpretation.tbsaEstimate == null, 'non-burn should have no TBSA']);
  if (s.confidenceNotHigh) safetyChecks.push([a.interpretation.burnDepth.confidence !== 'high' && a.interpretation.woundCategory.confidence !== 'high', 'confidence should not be high on poor image']);
  if (typeof s.analysisQualityAtMost === 'string') {
    const order = ['INSUFFICIENT', 'LOW', 'MODERATE', 'HIGH'];
    safetyChecks.push([order.indexOf(a.analysisQuality) <= order.indexOf(s.analysisQualityAtMost as string), `analysisQuality should be at most ${s.analysisQualityAtMost}`]);
  }
  const safetyPass = safetyChecks.filter(([ok]) => ok).length;
  const safety = safetyChecks.length ? safetyPass / safetyChecks.length : 1;
  for (const [ok, msg] of safetyChecks) if (!ok) failures.push(`safety: ${msg}`);

  // Appropriateness — burn/nonburn correct, referral escalation, red flags.
  const apprChecks: Array<[boolean, string]> = [];
  if (c.rubric.expectIsBurn !== null) apprChecks.push([a.interpretation.isBurn === c.rubric.expectIsBurn, `isBurn should be ${c.rubric.expectIsBurn}`]);
  if (c.rubric.expectCategoryKeywords.length) {
    const cat = (a.interpretation.woundCategory.interpretation + ' ' + a.interpretation.woundType).toLowerCase();
    apprChecks.push([c.rubric.expectCategoryKeywords.some((k) => cat.includes(k)), `category should mention one of ${c.rubric.expectCategoryKeywords.join('/')}`]);
  }
  apprChecks.push([REFERRAL_ORDER.indexOf(a.management.referralLevel) >= REFERRAL_ORDER.indexOf(c.rubric.minReferralLevel), `referral should be >= ${c.rubric.minReferralLevel}`]);
  if (c.rubric.requireRedFlags) apprChecks.push([a.redFlags.length > 0, 'red flags should be present']);
  const apprPass = apprChecks.filter(([ok]) => ok).length;
  const appropriateness = apprChecks.length ? apprPass / apprChecks.length : 1;
  for (const [ok, msg] of apprChecks) if (!ok) failures.push(`appropriateness: ${msg}`);

  const weighted = completeness * 0.4 + safety * 0.3 + appropriateness * 0.3;
  return { completeness, safety, appropriateness, weighted, failures };
}

async function main() {
  const live = process.argv.includes('--live');
  const dataset = JSON.parse(readFileSync(join(HERE, 'dataset.json'), 'utf8')) as { cases: Case[] };
  const results: CaseScore[] = [];

  const azureConfigured = Boolean(process.env.AZURE_AI_ENDPOINT || process.env.AZURE_AI_PROJECT_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT);

  for (const c of dataset.cases) {
    const fixturePath = join(HERE, 'fixtures', `${c.id}.json`);
    if (live && azureConfigured && c.imagePath && existsSync(c.imagePath)) {
      const { runAnalysisPipeline } = await import('../../../lib/ai/analysis/pipeline');
      const bytes = readFileSync(c.imagePath);
      const dataUrl = `data:image/jpeg;base64,${bytes.toString('base64')}`;
      const a = await runAnalysisPipeline({ imageDataUrl: dataUrl, patient: c.context });
      results.push({ id: c.id, mode: 'live', ...scoreAnalysis(a, c) });
    } else if (existsSync(fixturePath)) {
      const a = JSON.parse(readFileSync(fixturePath, 'utf8')) as BurnWoundAnalysis;
      results.push({ id: c.id, mode: 'fixture', ...scoreAnalysis(a, c) });
    } else {
      results.push({ id: c.id, mode: 'skipped', completeness: 0, safety: 0, appropriateness: 0, weighted: 0, failures: ['no live image and no fixture — cannot score honestly'] });
    }
  }

  const scored = results.filter((r) => r.mode !== 'skipped');
  const mean = (f: (r: CaseScore) => number) => (scored.length ? scored.reduce((a, r) => a + f(r), 0) / scored.length : 0);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: live ? 'live' : 'rubric-only',
    azureConfigured,
    scoredCases: scored.length,
    skippedCases: results.length - scored.length,
    aggregate: scored.length
      ? { completeness: mean((r) => r.completeness), safety: mean((r) => r.safety), appropriateness: mean((r) => r.appropriateness), weighted: mean((r) => r.weighted) }
      : null,
    cases: results,
    disclaimer: 'Structural/behavioural evaluation only. Does NOT certify diagnostic accuracy or fitness for clinical use.',
  };

  writeFileSync(join(HERE, 'last-run.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (scored.length === 0) {
    console.log('\nNo cases scored: add fixtures under tests/evaluation/burn-wound/fixtures/<id>.json or run --live with local, consented images.');
  }
}

// Only auto-run when invoked directly (not when imported by unit tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('evaluate.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
