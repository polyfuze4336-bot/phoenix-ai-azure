/**
 * Rich, evidence-gated schema for the staged burn/wound analysis pipeline.
 *
 * This is the internal contract the multi-stage pipeline builds. It deliberately
 * separates OBSERVATION (what is visible) from INTERPRETATION (what it may mean),
 * attaches FIELD-LEVEL CONFIDENCE, and records MISSING INFORMATION, LIMITATIONS,
 * RED FLAGS and CONSISTENCY/SAFETY CHECKS so the UI can be honest about what the
 * model can and cannot conclude from a single photograph.
 *
 * The pipeline maps this structure back to the existing 22-field
 * `hcpWoundAnalysisSchema` (see `toFlatHcpAnalysis`) so the /api/analyze-wound
 * SSE contract and the current HCP client keep working unchanged; the rich
 * object is additionally attached under `result.structured` for the enhanced UI.
 *
 * IMPORTANT: nothing here asserts clinical accuracy. Confidence values reflect
 * the MODEL'S self-reported certainty and image quality gating — not validated
 * diagnostic performance. See docs/ai/gpt4o-baseline-evaluation.md.
 */

import { z } from 'zod';
import type { HcpWoundAnalysis } from '../validation/wound-analysis-schema';

/* ------------------------------------------------------------------ helpers */

const str = (fallback = '') =>
  z
    .preprocess((v) => (typeof v === 'number' || typeof v === 'boolean' ? String(v) : v), z.string())
    .catch(fallback);

const strArray = z
  .preprocess((v) => {
    if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : String(x)));
    if (typeof v === 'string' && v.trim()) return [v];
    return [];
  }, z.array(z.string()))
  .catch([] as string[]);

const numOrNull = z
  .preprocess((v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, z.number().nullable())
  .catch(null);

const boolLoose = z
  .preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (['true', 'yes', 'y'].includes(s)) return true;
      if (['false', 'no', 'n'].includes(s)) return false;
    }
    return v;
  }, z.boolean())
  .catch(false);

/** Confidence band for a single interpreted field. */
export const confidenceLevel = z
  .preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(['high', 'moderate', 'low', 'insufficient']))
  .catch('low');
export type ConfidenceLevel = z.infer<typeof confidenceLevel>;

/** An observation/interpretation pair with its own confidence and evidence. */
export const clinicalField = z.object({
  observation: str(),
  interpretation: str(),
  confidence: confidenceLevel,
  basis: strArray,
});
export type ClinicalField = z.infer<typeof clinicalField>;

const clinicalFieldLoose = clinicalField.catch({
  observation: '',
  interpretation: '',
  confidence: 'low' as ConfidenceLevel,
  basis: [],
});

/* ---------------------------------------------------- stage 1: observation */

export const visualObservationSchema = z.object({
  imageQualityAdequate: boolLoose,
  imageQualityIssues: strArray, // blur, lighting, occlusion, no scale, distance
  imageQualityNote: str(),
  anatomicalLocation: str(),
  observedSkinTone: str(), // descriptive only, NOT Fitzpatrick
  visibleFindings: strArray, // colour, surface, blistering, borders, discharge
  scalePresent: boolLoose, // is a ruler/coin/reference visible?
  notes: str(),
});
export type VisualObservation = z.infer<typeof visualObservationSchema>;

/* --------------------------------------- stage 2: interpretation + quantify */

export const interpretationSchema = z.object({
  woundCategory: clinicalFieldLoose,
  woundType: str(),
  isBurn: boolLoose,
  burnMechanism: clinicalFieldLoose, // thermal/scald/chemical/electrical/flame/friction
  burnDepth: clinicalFieldLoose, // superficial / superficial partial / deep partial / full
  tissueComposition: clinicalFieldLoose,
  exudate: clinicalFieldLoose,
  infectionSigns: clinicalFieldLoose,
  edgesAndPeriwound: clinicalFieldLoose,
  severity: str(),
  // Quantification — separates visual extent from measured dimensions.
  visualExtent: str(), // qualitative, e.g. "small area on dorsal hand"
  measuredDimensions: str('unavailable'), // 'unavailable' unless a scale reference is present
  tbsaEstimate: numOrNull, // percent, null when not a burn / cannot estimate
  tbsaRange: str(),
  tbsaMethod: str(),
  tbsaBodyRegions: str(),
  tbsaAssumptions: strArray,
  tbsaLimitations: strArray,
  reportedFitzpatrickType: str('unknown'), // only if supplied in context; else 'unknown'
  skinToneInterpretationNote: str(),
});
export type Interpretation = z.infer<typeof interpretationSchema>;

/* ------------------------------------------- stage 3: management + referral */

export const managementSchema = z.object({
  firstAid: str(),
  woundCare: str(),
  dressing: str(),
  referralLevel: z
    .preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(['routine', 'consultation', 'urgent', 'transfer']))
    .catch('consultation'),
  referralCriteria: str(),
  locationConsiderations: str(), // hands/face/feet/perineum/joints lower the threshold
  followUp: str(),
  redFlags: strArray,
});
export type Management = z.infer<typeof managementSchema>;

/* ---------------------------------------------------- stage 4: critic pass */

export const criticSchema = z.object({
  pass: boolLoose,
  issues: strArray, // contradictions, unsupported claims, false precision, overclaim
  recommendedCorrections: strArray,
});
export type Critic = z.infer<typeof criticSchema>;

/* ------------------------------------------------ deterministic Parkland box */

export const parklandBlock = z.object({
  indicated: z.enum(['yes', 'no', 'uncertain']),
  requiresWeight: z.boolean(),
  summary: str(), // human-readable, computed by APP (not the model)
  total24hMl: numOrNull,
  first8hMl: numOrNull,
  next16hMl: numOrNull,
});
export type ParklandBlock = z.infer<typeof parklandBlock>;

/* --------------------------------------------------------- combined result */

export const analysisQuality = z
  .preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v), z.enum(['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT']))
  .catch('LOW');
export type AnalysisQuality = z.infer<typeof analysisQuality>;

export const burnWoundAnalysisSchema = z.object({
  schemaVersion: z.literal('2.0').catch('2.0'),
  analysisQuality,
  imageQuality: z.object({
    adequate: boolLoose,
    issues: strArray,
    note: str(),
  }),
  observation: visualObservationSchema,
  interpretation: interpretationSchema,
  management: managementSchema,
  parkland: parklandBlock,
  confidenceByCategory: z.record(z.string(), confidenceLevel).catch({}),
  missingInformation: strArray,
  limitations: strArray,
  redFlags: strArray,
  recommendedFollowUpQuestions: strArray,
  qualityChecks: criticSchema,
  overallConfidence: str(),
});
export type BurnWoundAnalysis = z.infer<typeof burnWoundAnalysisSchema>;

/* --------------------------------------------- flat back-compat adapter (v1) */

/**
 * Map the rich structure to the existing 22-field HCP result so the current
 * SSE contract and HCP client render unchanged during rollout. The rich object
 * travels alongside under `result.structured` for the enhanced UI.
 */
export function toFlatHcpAnalysis(a: BurnWoundAnalysis): HcpWoundAnalysis {
  const i = a.interpretation;
  const withBasis = (f: { interpretation: string; observation: string; basis: string[] }) => {
    const main = f.interpretation || f.observation;
    return main;
  };
  const fitz =
    i.reportedFitzpatrickType && i.reportedFitzpatrickType.toLowerCase() !== 'unknown'
      ? i.reportedFitzpatrickType
      : `Not reliably determinable from a photograph (observed skin tone: ${a.observation.observedSkinTone || 'unclear'})`;

  return {
    fitzpatrickType: fitz,
    fitzpatrickNote:
      i.skinToneInterpretationNote ||
      'Fitzpatrick type describes UV response and cannot be reliably determined from a single image; use texture, temperature and oedema cues on darker skin.',
    woundCategory: withBasis(i.woundCategory) || 'N/A',
    woundType: i.woundType || 'N/A',
    burnDegree: i.isBurn ? withBasis(i.burnDepth) || 'N/A' : 'N/A',
    severity: i.severity || 'N/A',
    characteristics:
      [a.observation.visibleFindings.join('; '), withBasis(i.woundCategory)].filter(Boolean).join(' — ') || 'N/A',
    tissueComposition: withBasis(i.tissueComposition) || 'N/A',
    exudate: withBasis(i.exudate) || 'N/A',
    woundEdges: withBasis(i.edgesAndPeriwound) || 'N/A',
    confidence: a.overallConfidence || a.analysisQuality,
    tbsaEstimate: i.tbsaEstimate != null ? String(i.tbsaEstimate) : '0',
    tbsaRange: i.tbsaRange || 'N/A',
    tbsaBodyRegions: i.tbsaBodyRegions || 'N/A',
    tbsaMethod: i.tbsaMethod || 'N/A',
    isBurn: i.isBurn,
    parklandFluid: a.parkland.summary || 'N/A',
    firstAid: a.management.firstAid || 'N/A',
    woundCare: a.management.woundCare || 'N/A',
    dressing: a.management.dressing || 'N/A',
    referral: [a.management.referralCriteria, a.management.locationConsiderations].filter(Boolean).join(' ') || 'N/A',
    followUp: a.management.followUp || 'N/A',
  };
}
