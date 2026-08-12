/**
 * Typed schemas + safe parsing for the streamed wound-analysis JSON results.
 *
 * The model is asked to return a structured JSON object. Here we validate that
 * output with Zod against the EXACT fields the front-end renders (see
 * `app/hcp/analysis/_components/analysis-client.tsx`).
 *
 * Validation is deliberately *tolerant of type variance* (a number or boolean
 * where a string is expected is coerced) so a usable model result is not
 * rejected on a technicality. But when the output is NOT valid JSON, is not an
 * object, or carries none of the expected fields, we do NOT fabricate a
 * clinical result. Instead we return an explicit, clearly-labelled
 * "assessment could not be completed" state that preserves the medical
 * disclaimer, so the user is told the analysis failed.
 *
 * NOTE (behaviour change vs the source app): the original routes echoed the raw
 * model buffer into the result and used differing wording for the `[DONE]` vs
 * end-of-stream paths. That is replaced by Zod validation + a single explicit
 * safe-fallback state. Documented in docs/migration/MIGRATION.md.
 */

import { z } from 'zod';
import { StructuredResultPhase } from '../streaming/sse';

/** A string field that tolerantly coerces numbers/booleans and defaults on miss. */
const strField = (fallback = 'N/A') =>
  z
    .preprocess(
      (v) => (typeof v === 'number' || typeof v === 'boolean' ? String(v) : v),
      z.string(),
    )
    .catch(fallback);

/** A boolean field that tolerates "true"/"yes"/"false"/"no" strings. */
const boolField = z
  .preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === 'yes') return true;
      if (s === 'false' || s === 'no') return false;
    }
    return v;
  }, z.boolean())
  .catch(false);

/** HCP clinical wound-analysis result rendered by the HCP clients. */
export const hcpWoundAnalysisSchema = z.object({
  fitzpatrickType: strField(),
  fitzpatrickNote: strField(),
  woundCategory: strField(),
  woundType: strField(),
  burnDegree: strField(),
  severity: strField(),
  characteristics: strField(),
  tissueComposition: strField(),
  exudate: strField(),
  woundEdges: strField(),
  confidence: strField(),
  tbsaEstimate: strField('0'),
  tbsaClassification: strField('Unavailable'),
  tbsaRange: strField(),
  tbsaBodyRegions: strField(),
  tbsaMethod: strField(),
  imageCount: strField('1'),
  distinctAnatomicalRegions: strField(),
  probableDuplicateViews: strField('None identified'),
  multiImageAggregationNote: strField(),
  isBurn: boolField,
  parklandFluid: strField(),
  firstAid: strField(),
  woundCare: strField(),
  dressing: strField(),
  referral: strField(),
  followUp: strField(),
});

export type HcpWoundAnalysis = z.infer<typeof hcpWoundAnalysisSchema>;

/** Community-facing wound-analysis result (3 fields rendered by the community client). */
export const communityWoundAnalysisSchema = z.object({
  description: strField(''),
  recommendation: strField(''),
  firstAidTips: strField(''),
});

export type CommunityWoundAnalysis = z.infer<typeof communityWoundAnalysisSchema>;

/** Keys whose presence signals a genuine model result (vs an unrelated object). */
const HCP_SIGNAL_KEYS = [
  'woundType',
  'woundCategory',
  'severity',
  'characteristics',
  'burnDegree',
  'tissueComposition',
];
const COMMUNITY_SIGNAL_KEYS = ['description', 'recommendation', 'firstAidTips'];

const HCP_UNAVAILABLE_MESSAGE =
  'The AI assessment could not be completed: the model did not return a valid ' +
  'structured result. Please retry the analysis or rely on your own clinical ' +
  'judgement. This tool provides clinical decision support only and is not a ' +
  'substitute for professional medical assessment.';

/** Explicit safe fallback for the HCP path — no fabricated clinical findings. */
export const HCP_ASSESSMENT_UNAVAILABLE: HcpWoundAnalysis = {
  fitzpatrickType: 'N/A',
  fitzpatrickNote: 'N/A',
  woundCategory: 'N/A',
  woundType: 'Assessment could not be completed',
  burnDegree: 'N/A',
  severity: 'N/A',
  characteristics: HCP_UNAVAILABLE_MESSAGE,
  tissueComposition: 'N/A',
  exudate: 'N/A',
  woundEdges: 'N/A',
  confidence: 'N/A',
  tbsaEstimate: '0',
  tbsaClassification: 'Unavailable',
  tbsaRange: 'N/A',
  tbsaBodyRegions: 'N/A',
  tbsaMethod: 'N/A',
  imageCount: '1',
  distinctAnatomicalRegions: 'N/A',
  probableDuplicateViews: 'None identified',
  multiImageAggregationNote: 'N/A',
  isBurn: false,
  parklandFluid: 'N/A',
  firstAid: 'N/A',
  woundCare: 'N/A',
  dressing: 'N/A',
  referral: 'Please seek an in-person clinical assessment.',
  followUp: 'N/A',
};

const COMMUNITY_UNAVAILABLE_MESSAGE =
  'Sorry, we could not check your image this time. Please try again with a ' +
  'clear, well-lit photo. This is not a medical diagnosis.';

/** Explicit safe fallback for the community path — no fabricated advice. */
export const COMMUNITY_ASSESSMENT_UNAVAILABLE: CommunityWoundAnalysis = {
  description: COMMUNITY_UNAVAILABLE_MESSAGE,
  recommendation: 'We recommend you see a doctor or visit a clinic to be safe.',
  firstAidTips:
    'Keep the wound clean and covered. If you are worried, please see a ' +
    'healthcare professional.',
};

function tryParseObject(buffer: string): Record<string, unknown> | null {
  if (!buffer || !buffer.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(buffer);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

function hasMeaningfulValue(obj: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((k) => {
    const v = obj[k];
    if (typeof v === 'string') return v.trim().length > 0;
    return v !== undefined && v !== null;
  });
}

/**
 * Validate the accumulated HCP model output. Returns the parsed result on
 * success, or an explicit "assessment could not be completed" state (never a
 * fabricated clinical result) when the output is invalid.
 */
export function parseHcpWoundAnalysis(buffer: string): HcpWoundAnalysis {
  const obj = tryParseObject(buffer);
  if (!obj || !hasMeaningfulValue(obj, HCP_SIGNAL_KEYS)) {
    return HCP_ASSESSMENT_UNAVAILABLE;
  }
  const result = hcpWoundAnalysisSchema.safeParse(obj);
  return result.success ? result.data : HCP_ASSESSMENT_UNAVAILABLE;
}

/**
 * Validate the accumulated community model output. The `phase` argument is
 * accepted for signature compatibility with the SSE helper but the safe
 * fallback is identical for both completion phases.
 */
export function parseCommunityWoundAnalysis(
  buffer: string,
  _phase?: StructuredResultPhase,
): CommunityWoundAnalysis {
  const obj = tryParseObject(buffer);
  if (!obj || !hasMeaningfulValue(obj, COMMUNITY_SIGNAL_KEYS)) {
    return COMMUNITY_ASSESSMENT_UNAVAILABLE;
  }
  const result = communityWoundAnalysisSchema.safeParse(obj);
  return result.success ? result.data : COMMUNITY_ASSESSMENT_UNAVAILABLE;
}
