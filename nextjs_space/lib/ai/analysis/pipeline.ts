/**
 * Staged burn/wound analysis pipeline.
 *
 * Replaces the single uncontrolled model call with an evidence-gated sequence:
 *   1. Visual observation (image)      — describe only what is visible
 *   2. Clinical interpretation (image) — category/mechanism/depth with evidence
 *   3. Management & referral (text)    — location-aware guidance
 *   4. Consistency/safety critic (text)
 * followed by DETERMINISTIC post-processing:
 *   - Parkland is computed in app code from patient weight (never invented)
 *   - safety rules cap confidence on poor images, strip fabricated measurements,
 *     force Fitzpatrick to 'unknown' unless supplied, and escalate special-site burns
 *
 * The pipeline returns the rich {@link BurnWoundAnalysis}. The route maps it to
 * the legacy 22-field result and attaches the rich object under `structured`.
 *
 * HONESTY: confidence/quality here reflect model self-report + image-quality
 * gating, NOT validated diagnostic accuracy. See docs/ai/gpt4o-baseline-evaluation.md.
 */

import { getAiProvider } from '../ai-provider';
import { getAnalysisModelDeployment } from '../model-config';
import { collectCompletion, parseJsonObject } from '../streaming/collect';
import type { AiMessage } from '../types';
import { calculateResuscitation } from '@/lib/clinical/parkland';
import {
  burnWoundAnalysisSchema,
  criticSchema,
  interpretationSchema,
  managementSchema,
  visualObservationSchema,
  type BurnWoundAnalysis,
  type ConfidenceLevel,
  type Interpretation,
  type Management,
  type VisualObservation,
} from '../schemas/burn-wound-analysis';
import { WOUND_VISUAL_OBSERVATION_PROMPT } from '../prompts/wound-visual-observation';
import { WOUND_CLINICAL_INTERPRETATION_PROMPT } from '../prompts/wound-clinical-interpretation';
import { WOUND_MANAGEMENT_PROMPT } from '../prompts/wound-management';
import { WOUND_ANALYSIS_CRITIC_PROMPT } from '../prompts/wound-analysis-critic';

/** Optional patient context supplied by the clinician (never invented). */
export interface PatientContext {
  weightKg?: number;
  ageGroup?: string;
  fitzpatrickType?: string;
  mechanism?: string;
  timeSinceInjury?: string;
  freeText?: string;
}

export interface PipelineInput {
  imageDataUrl: string; // data:<mime>;base64,....
  patient?: PatientContext;
  /** Prior analysis + clinician answers for a REFINE pass (second pass). */
  refine?: { priorAnalysis: BurnWoundAnalysis; answers: string };
  correlationId?: string;
}

const SPECIAL_SITES = ['hand', 'finger', 'face', 'foot', 'feet', 'perineum', 'genital', 'joint', 'circumferential', 'eye', 'ear', 'neck'];

const STAGE_TIMEOUT_MS = 60_000;

function contextBlock(p?: PatientContext): string {
  if (!p) return 'No additional patient context was provided.';
  const parts: string[] = [];
  if (p.weightKg) parts.push(`weight: ${p.weightKg} kg`);
  if (p.ageGroup) parts.push(`age group: ${p.ageGroup}`);
  if (p.fitzpatrickType) parts.push(`reported Fitzpatrick type: ${p.fitzpatrickType}`);
  if (p.mechanism) parts.push(`mechanism: ${p.mechanism}`);
  if (p.timeSinceInjury) parts.push(`time since injury: ${p.timeSinceInjury}`);
  if (p.freeText) parts.push(`notes: ${p.freeText}`);
  return parts.length ? `Provided patient context: ${parts.join('; ')}.` : 'No additional patient context was provided.';
}

/** Run one model stage and parse its JSON object (null on failure). */
async function runStage(
  systemPrompt: string,
  userParts: AiMessage['content'],
  correlationId: string | undefined,
  route: string,
): Promise<Record<string, unknown> | null> {
  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userParts },
  ];
  const upstream = await getAiProvider().streamChatCompletion({
    messages,
    model: getAnalysisModelDeployment(),
    maxOutputTokens: 1400,
    responseFormat: 'json_object',
    correlationId,
    route,
    timeoutMs: STAGE_TIMEOUT_MS,
  });
  const { text } = await collectCompletion(upstream.body);
  return parseJsonObject(text);
}

/* ----------------------------------------------------- deterministic helpers */

const CONF_ORDER: ConfidenceLevel[] = ['insufficient', 'low', 'moderate', 'high'];
function capConfidence(c: ConfidenceLevel, max: ConfidenceLevel): ConfidenceLevel {
  return CONF_ORDER.indexOf(c) > CONF_ORDER.indexOf(max) ? max : c;
}

function isSpecialSite(text: string): boolean {
  const t = (text || '').toLowerCase();
  return SPECIAL_SITES.some((s) => t.includes(s));
}

function computeParkland(isBurn: boolean, tbsa: number | null, weightKg?: number) {
  if (!isBurn || !tbsa || tbsa <= 0) {
    return { indicated: 'no' as const, requiresWeight: false, summary: 'Not applicable (not a burn or no estimable TBSA).', total24hMl: null, first8hMl: null, next16hMl: null };
  }
  if (!weightKg || weightKg <= 0) {
    return {
      indicated: 'uncertain' as const,
      requiresWeight: true,
      summary:
        'Parkland fluid resuscitation may be indicated, but requires the patient\'s weight to calculate. ' +
        'Enter the weight in the Parkland Calculator. (No weight is assumed — a fixed 70 kg estimate is clinically unsafe.)',
      total24hMl: null,
      first8hMl: null,
      next16hMl: null,
    };
  }
  const r = calculateResuscitation({ weightKg, tbsaPercent: tbsa, formula: 'parkland' });
  if (!r) return { indicated: 'uncertain' as const, requiresWeight: true, summary: 'Unable to calculate.', total24hMl: null, first8hMl: null, next16hMl: null };
  const summary =
    `Parkland (4 mL x ${weightKg} kg x ${tbsa}% TBSA) = ${Math.round(r.total24h)} mL over 24h. ` +
    `First 8h: ${Math.round(r.first8h)} mL (~${Math.round(r.rate8h)} mL/h). ` +
    `Next 16h: ${Math.round(r.next16h)} mL (~${Math.round(r.rate16h)} mL/h). ` +
    `Titrate to urine output ~${r.urineTarget} mL/h.`;
  return { indicated: 'yes' as const, requiresWeight: false, summary, total24hMl: Math.round(r.total24h), first8hMl: Math.round(r.first8h), next16hMl: Math.round(r.next16h) };
}

/* --------------------------------------------------------------- orchestrator */

export async function runAnalysisPipeline(input: PipelineInput): Promise<BurnWoundAnalysis> {
  const { imageDataUrl, patient, refine, correlationId } = input;
  const ctx = contextBlock(patient);

  // Stage 1 — Visual observation (vision).
  const obsRaw = await runStage(
    WOUND_VISUAL_OBSERVATION_PROMPT,
    [
      { type: 'text', text: `${ctx}\nDescribe what is visible in this image.` },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ],
    correlationId,
    'analyze-wound:observation',
  );
  const observation: VisualObservation = visualObservationSchema.parse(obsRaw ?? {});

  // Stage 2 — Clinical interpretation + quantification (vision, grounded in stage 1).
  const priorNote = refine
    ? `\nThis is a REFINE pass. Prior analysis summary: ${JSON.stringify(refine.priorAnalysis.interpretation).slice(0, 1500)}\nClinician answers to follow-up questions: ${refine.answers}`
    : '';
  const interpRaw = await runStage(
    WOUND_CLINICAL_INTERPRETATION_PROMPT,
    [
      {
        type: 'text',
        text: `${ctx}\nObservations from the observation stage:\n${JSON.stringify(observation)}${priorNote}\nInterpret this wound.`,
      },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ],
    correlationId,
    'analyze-wound:interpretation',
  );
  const interpretation: Interpretation = interpretationSchema.parse(interpRaw ?? {});

  // Stage 3 — Management & referral (text-only).
  const mgmtRaw = await runStage(
    WOUND_MANAGEMENT_PROMPT,
    `${ctx}\nClinical interpretation:\n${JSON.stringify(interpretation)}\nObservations:\n${JSON.stringify(observation)}\nProvide management and referral.`,
    correlationId,
    'analyze-wound:management',
  );
  const management: Management = managementSchema.parse(mgmtRaw ?? {});

  // Stage 4 — Safety / consistency critic (text-only).
  const draft = { observation, interpretation, management };
  const criticRaw = await runStage(
    WOUND_ANALYSIS_CRITIC_PROMPT,
    `Draft analysis to audit:\n${JSON.stringify(draft)}`,
    correlationId,
    'analyze-wound:critic',
  );
  const critic = criticSchema.parse(criticRaw ?? { pass: true, issues: [], recommendedCorrections: [] });

  return assemble({ observation, interpretation, management, critic, patient });
}

/* ------------------------------------------------- deterministic assembly */

/**
 * Deterministic post-processing of the merged stage outputs. Exported for unit
 * testing — it encodes the safety rules (no assumed Parkland weight, Fitzpatrick
 * forced 'unknown', no fabricated measurements, image-quality confidence
 * capping, special-site escalation) independently of any live model call.
 */
export function assembleAnalysis(args: {
  observation: VisualObservation;
  interpretation: Interpretation;
  management: Management;
  critic: { pass: boolean; issues: string[]; recommendedCorrections: string[] };
  patient?: PatientContext;
}): BurnWoundAnalysis {
  return assemble(args);
}

function assemble(args: {
  observation: VisualObservation;
  interpretation: Interpretation;
  management: Management;
  critic: { pass: boolean; issues: string[]; recommendedCorrections: string[] };
  patient?: PatientContext;
}): BurnWoundAnalysis {
  const { observation, patient } = args;
  const interpretation = { ...args.interpretation };
  const management = { ...args.management };

  // --- Safety rule: strip fabricated measurements without a scale reference.
  if (!observation.scalePresent) interpretation.measuredDimensions = 'unavailable';

  // --- Safety rule: Fitzpatrick must be 'unknown' unless the clinician supplied it.
  if (patient?.fitzpatrickType) {
    interpretation.reportedFitzpatrickType = patient.fitzpatrickType;
  } else {
    interpretation.reportedFitzpatrickType = 'unknown';
  }

  // --- Safety rule: non-burn cannot carry a TBSA value.
  if (!interpretation.isBurn) {
    interpretation.tbsaEstimate = null;
    interpretation.tbsaRange = 'N/A';
    interpretation.tbsaMethod = 'N/A';
  }

  // --- Image-quality gating: cap confidence when the image is not adequate.
  const issues = observation.imageQualityIssues ?? [];
  const inadequate = !observation.imageQualityAdequate;
  const heavyIssues = issues.length >= 2;
  const confCap: ConfidenceLevel = inadequate ? (heavyIssues ? 'low' : 'moderate') : 'high';
  const capField = <T extends { confidence: ConfidenceLevel }>(f: T): T => ({ ...f, confidence: capConfidence(f.confidence, confCap) });
  interpretation.woundCategory = capField(interpretation.woundCategory);
  interpretation.burnDepth = capField(interpretation.burnDepth);
  interpretation.burnMechanism = capField(interpretation.burnMechanism);
  interpretation.tissueComposition = capField(interpretation.tissueComposition);
  interpretation.exudate = capField(interpretation.exudate);
  interpretation.infectionSigns = capField(interpretation.infectionSigns);
  interpretation.edgesAndPeriwound = capField(interpretation.edgesAndPeriwound);

  // --- Special-site escalation: never leave a special-site burn on routine follow-up.
  const locationText = `${observation.anatomicalLocation} ${interpretation.tbsaBodyRegions} ${management.locationConsiderations}`;
  if (interpretation.isBurn && isSpecialSite(locationText) && management.referralLevel === 'routine') {
    management.referralLevel = 'consultation';
    management.locationConsiderations =
      (management.locationConsiderations ? management.locationConsiderations + ' ' : '') +
      'Special anatomical site — threshold for specialist referral is lowered.';
  }

  // --- Deterministic Parkland (never from an assumed weight).
  const parkland = computeParkland(interpretation.isBurn, interpretation.tbsaEstimate, patient?.weightKg);

  // --- Analysis-quality band.
  const analysisQuality: BurnWoundAnalysis['analysisQuality'] = inadequate
    ? heavyIssues
      ? interpretation.woundCategory.confidence === 'insufficient'
        ? 'INSUFFICIENT'
        : 'LOW'
      : 'MODERATE'
    : 'HIGH';

  // --- Field-level confidence map.
  const confidenceByCategory: Record<string, ConfidenceLevel> = {
    woundCategory: interpretation.woundCategory.confidence,
    burnDepth: interpretation.burnDepth.confidence,
    burnMechanism: interpretation.burnMechanism.confidence,
    tissueComposition: interpretation.tissueComposition.confidence,
    infection: interpretation.infectionSigns.confidence,
    edges: interpretation.edgesAndPeriwound.confidence,
  };

  // --- Missing information + follow-up questions (deterministic, honest).
  const missing: string[] = [];
  if (!patient?.weightKg && interpretation.isBurn) missing.push('Patient weight — required to calculate fluid resuscitation.');
  if (!observation.scalePresent) missing.push('A size reference (ruler/coin) — needed to measure real dimensions.');
  if (interpretation.isBurn && !patient?.mechanism) missing.push('Burn mechanism (scald/flame/chemical/electrical) and time since injury.');
  if (!patient?.freeText) missing.push('Relevant history: comorbidities (e.g. diabetes), pain, sensation, tetanus status.');
  missing.push(...(interpretation.tbsaLimitations ?? []));

  const followUpQuestions: string[] = [];
  if (!patient?.weightKg && interpretation.isBurn) followUpQuestions.push('What is the patient\'s weight (kg)?');
  if (interpretation.isBurn && !patient?.mechanism) followUpQuestions.push('What caused the burn, and how long ago did it happen?');
  followUpQuestions.push('Is there loss of sensation, deep pain, or reduced capillary refill in the affected area?');
  if (interpretation.infectionSigns.confidence !== 'insufficient') followUpQuestions.push('Are there systemic signs of infection (fever, spreading redness, increasing pain, purulent discharge)?');

  const limitations: string[] = [
    'This assessment is based solely on a single photograph and cannot replace hands-on clinical examination.',
    ...(inadequate ? ['Image quality limits reliability: ' + (observation.imageQualityNote || issues.join(', ')) + '.'] : []),
    ...(interpretation.tbsaLimitations ?? []),
  ];

  const overallConfidence =
    analysisQuality === 'HIGH' ? 'High' : analysisQuality === 'MODERATE' ? 'Moderate' : analysisQuality === 'LOW' ? 'Low' : 'Insufficient';

  const candidate = {
    schemaVersion: '2.0' as const,
    analysisQuality,
    imageQuality: { adequate: observation.imageQualityAdequate, issues, note: observation.imageQualityNote },
    observation,
    interpretation,
    management,
    parkland,
    confidenceByCategory,
    missingInformation: Array.from(new Set(missing)).filter(Boolean),
    limitations: Array.from(new Set(limitations)).filter(Boolean),
    redFlags: management.redFlags ?? [],
    recommendedFollowUpQuestions: Array.from(new Set(followUpQuestions)).filter(Boolean),
    qualityChecks: args.critic,
    overallConfidence,
  };

  return burnWoundAnalysisSchema.parse(candidate);
}
