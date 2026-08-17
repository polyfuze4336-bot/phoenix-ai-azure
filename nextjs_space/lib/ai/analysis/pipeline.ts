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
import { AiError, type AiErrorCategory, type AiMessage } from '../types';
import {
  calculateResuscitation,
  determineParklandIndication,
  type PatientCategory,
} from '@/lib/clinical/parkland';
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
import { completeWithLanguageValidation, withLanguageInstruction } from '../language';
import type { AppLanguage } from '@/lib/i18n';

/** Optional patient context supplied by the clinician (never invented). */
export interface PatientContext {
  weightKg?: number;
  ageGroup?: PatientCategory;
  fitzpatrickType?: string;
  mechanism?: string;
  timeSinceInjury?: string;
  freeText?: string;
}

export interface PipelineInput {
  imageDataUrl: string; // data:<mime>;base64,....
  language: AppLanguage;
  patient?: PatientContext;
  /** Prior analysis + clinician answers for a REFINE pass (second pass). */
  refine?: { priorAnalysis: BurnWoundAnalysis; answers: string };
  correlationId?: string;
}

const SPECIAL_SITES = ['hand', 'finger', 'face', 'foot', 'feet', 'perineum', 'genital', 'joint', 'circumferential', 'eye', 'ear', 'neck'];

const DEFAULT_ANALYSIS_TIMEOUT_MS = 90_000;
const MIN_ANALYSIS_TIMEOUT_MS = 10_000;
const MAX_ANALYSIS_TIMEOUT_MS = 180_000;

export function getAnalysisTimeoutMs(): number {
  const configured = Number.parseInt(process.env.AI_ANALYSIS_TIMEOUT_MS ?? '', 10);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_ANALYSIS_TIMEOUT_MS;
  return Math.min(MAX_ANALYSIS_TIMEOUT_MS, Math.max(MIN_ANALYSIS_TIMEOUT_MS, configured));
}

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

interface StageResult {
  value: Record<string, unknown> | null;
  category: Extract<AiErrorCategory, 'AI_INVALID_JSON' | 'AI_SCHEMA_VALIDATION_FAILED'>;
}

function repairContent(content: AiMessage['content']): AiMessage['content'] {
  const instruction =
    'The previous response was not valid for the required JSON schema. Return only one complete JSON object using the requested fields. Do not invent missing clinical information; use null, empty arrays, or explicit unavailable text where permitted.';
  return typeof content === 'string'
    ? `${content}\n\n${instruction}`
    : [...content, { type: 'text', text: instruction }];
}

/** Run one model stage, with one bounded repair attempt for invalid structured output. */
async function runStage(
  systemPrompt: string,
  userParts: AiMessage['content'],
  language: AppLanguage,
  correlationId: string | undefined,
  route: string,
  hasRequiredSignal: (value: Record<string, unknown>) => boolean,
): Promise<StageResult> {
  let category: StageResult['category'] = 'AI_INVALID_JSON';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const messages: AiMessage[] = [
      { role: 'system', content: withLanguageInstruction(systemPrompt, language) },
      { role: 'user', content: attempt === 0 ? userParts : repairContent(userParts) },
    ];
    try {
      const completion = await completeWithLanguageValidation({
        messages,
        language,
        route,
        correlationId,
        complete: async (completionMessages) => (await getAiProvider().streamChatCompletion({
          messages: completionMessages,
          model: getAnalysisModelDeployment(),
          maxOutputTokens: 1400,
          responseFormat: 'json_object',
          correlationId,
          route,
          timeoutMs: getAnalysisTimeoutMs(),
        })).body,
      });
      const parsed = parseJsonObject(completion.text);
      if (!parsed) {
        category = 'AI_INVALID_JSON';
        continue;
      }
      if (!hasRequiredSignal(parsed)) {
        category = 'AI_SCHEMA_VALIDATION_FAILED';
        continue;
      }
      return { value: parsed, category };
    } catch (error) {
      if (attempt === 0 && error instanceof AiError &&
        (error.category === 'AI_STREAM_INTERRUPTED' || error.category === 'AI_EMPTY_RESPONSE')) {
        continue;
      }
      throw error;
    }
  }
  return { value: null, category };
}

function clinicalFieldHasValue(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' &&
    typeof (value as { interpretation?: unknown }).interpretation === 'string' &&
    (value as { interpretation: string }).interpretation.trim());
}

export function hasObservationSignal(value: Record<string, unknown>): boolean {
  return typeof value.imageQualityAdequate === 'boolean' &&
    typeof value.scalePresent === 'boolean' && Array.isArray(value.visibleFindings);
}

export function hasInterpretationSignal(value: Record<string, unknown>): boolean {
  return typeof value.isBurn === 'boolean' && (!value.isBurn ||
    (clinicalFieldHasValue(value.woundCategory) && clinicalFieldHasValue(value.burnDepth)));
}

function hasManagementSignal(value: Record<string, unknown>): boolean {
  return typeof value.referralLevel === 'string' &&
    (typeof value.firstAid === 'string' || typeof value.woundCare === 'string');
}

function hasCriticSignal(value: Record<string, unknown>): boolean {
  return typeof value.pass === 'boolean' && Array.isArray(value.issues);
}

function unavailableManagement(language: AppLanguage): Management {
  const unavailable = language === 'ms'
    ? 'Bahagian ini tidak tersedia. Semakan profesional penjagaan kesihatan diperlukan.'
    : 'This section is unavailable. Review by a healthcare professional is required.';
  return managementSchema.parse({
    firstAid: unavailable,
    woundCare: unavailable,
    dressing: unavailable,
    referralLevel: 'consultation',
    referralCriteria: unavailable,
    locationConsiderations: unavailable,
    followUp: unavailable,
    redFlags: [],
  });
}

function unavailableCritic(language: AppLanguage) {
  return criticSchema.parse({
    pass: false,
    issues: [language === 'ms'
      ? 'Semakan konsistensi automatik tidak tersedia; semakan klinikal diperlukan.'
      : 'Automated consistency review is unavailable; clinical review is required.'],
    recommendedCorrections: [],
  });
}

function coreStageError(category: StageResult['category']): AiError {
  return new AiError({
    code: 'upstream_error',
    category,
    status: 502,
    clientMessage: 'The AI assessment could not be completed. Please try another image.',
  });
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

export function computeParkland(
  isBurn: boolean,
  tbsa: number | null,
  patientCategory: PatientCategory | undefined,
  weightKg: number | undefined,
  language: AppLanguage,
) {
  const normalizedTbsa = tbsa != null && Number.isFinite(tbsa) ? tbsa : null;
  const indication = determineParklandIndication({ isBurn, tbsaPercent: normalizedTbsa, patientCategory });
  if (indication.reason === 'non_burn_or_zero') {
    return {
      indicated: 'no' as const,
      requiresWeight: false,
      summary: language === 'ms'
        ? 'Regimen Parkland tidak berkenaan kerana ini bukan kelecuran atau TBSA tidak dapat dianggarkan.'
        : 'Parkland regimen is not applicable because this is not a burn or TBSA cannot be estimated.',
      total24hMl: null,
      first8hMl: null,
      next16hMl: null,
    };
  }
  if (indication.indicated === 'uncertain') {
    return {
      indicated: 'uncertain' as const,
      requiresWeight: false,
      summary: language === 'ms'
        ? 'Indikasi regimen Parkland tidak pasti. Pilih kategori pesakit dewasa atau kanak-kanak untuk menggunakan ambang TBSA yang sesuai.'
        : 'Parkland regimen indication is uncertain. Select whether the patient is an adult or child to apply the appropriate TBSA threshold.',
      total24hMl: null,
      first8hMl: null,
      next16hMl: null,
    };
  }
  if (indication.indicated === 'no') {
    return {
      indicated: 'no' as const,
      requiresWeight: false,
      summary: language === 'ms'
        ? 'Regimen Parkland tidak diperlukan. Teruskan resusitasi cecair atau cecair penyelenggaraan mengikut indikasi klinikal berdasarkan garis panduan yang berkenaan dan perkembangan klinikal pesakit.'
        : "Parkland regimen not required. Continue fluid resuscitation or maintenance as clinically indicated according to the applicable guideline and the patient's clinical progress.",
      total24hMl: null,
      first8hMl: null,
      next16hMl: null,
    };
  }
  if (!weightKg || weightKg <= 0) {
    return {
      indicated: 'yes' as const,
      requiresWeight: true,
      summary: language === 'ms'
        ? 'Regimen Parkland diindikasikan, tetapi berat pesakit diperlukan untuk mengira regimen. Tiada berat diandaikan.'
        : 'Parkland regimen is indicated, but patient weight is required to calculate the regimen. No weight is assumed.',
      total24hMl: null,
      first8hMl: null,
      next16hMl: null,
    };
  }
  const r = calculateResuscitation({ weightKg, tbsaPercent: normalizedTbsa!, formula: 'parkland' });
  if (!r) return { indicated: 'uncertain' as const, requiresWeight: false, summary: language === 'ms' ? 'Regimen tidak dapat dikira.' : 'Unable to calculate the regimen.', total24hMl: null, first8hMl: null, next16hMl: null };
  const summary = language === 'ms'
    ? `Parkland (4 mL x ${weightKg} kg x ${tbsa}% TBSA) = ${Math.round(r.total24h)} mL untuk 24 jam. ` +
      `8 jam pertama: ${Math.round(r.first8h)} mL (~${Math.round(r.rate8h)} mL/j). ` +
      `16 jam seterusnya: ${Math.round(r.next16h)} mL (~${Math.round(r.rate16h)} mL/j). ` +
      `Titrasi kepada pengeluaran urin ~${r.urineTarget} mL/j.`
    : `Parkland (4 mL x ${weightKg} kg x ${tbsa}% TBSA) = ${Math.round(r.total24h)} mL over 24h. ` +
      `First 8h: ${Math.round(r.first8h)} mL (~${Math.round(r.rate8h)} mL/h). ` +
      `Next 16h: ${Math.round(r.next16h)} mL (~${Math.round(r.rate16h)} mL/h). ` +
      `Titrate to urine output ~${r.urineTarget} mL/h.`;
  return { indicated: 'yes' as const, requiresWeight: false, summary, total24hMl: Math.round(r.total24h), first8hMl: Math.round(r.first8h), next16hMl: Math.round(r.next16h) };
}

/* --------------------------------------------------------------- orchestrator */

export async function runAnalysisPipeline(input: PipelineInput): Promise<BurnWoundAnalysis> {
  const { imageDataUrl, language, patient, refine, correlationId } = input;
  const ctx = contextBlock(patient);

  // Stage 1 — Visual observation (vision).
  const obsStage = await runStage(
    WOUND_VISUAL_OBSERVATION_PROMPT,
    [
      { type: 'text', text: `${ctx}\nDescribe what is visible in this image.` },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ],
    language,
    correlationId,
    'analyze-wound:observation',
    hasObservationSignal,
  );
  if (!obsStage.value) throw coreStageError(obsStage.category);
  const observationResult = visualObservationSchema.safeParse(obsStage.value);
  if (!observationResult.success) throw coreStageError('AI_SCHEMA_VALIDATION_FAILED');
  const observation: VisualObservation = observationResult.data;

  // Stage 2 — Clinical interpretation + quantification (vision, grounded in stage 1).
  const priorNote = refine
    ? `\nThis is a REFINE pass. Prior analysis summary: ${JSON.stringify(refine.priorAnalysis.interpretation).slice(0, 1500)}\nClinician answers to follow-up questions: ${refine.answers}`
    : '';
  const interpStage = await runStage(
    WOUND_CLINICAL_INTERPRETATION_PROMPT,
    [
      {
        type: 'text',
        text: `${ctx}\nObservations from the observation stage:\n${JSON.stringify(observation)}${priorNote}\nInterpret this wound.`,
      },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ],
    language,
    correlationId,
    'analyze-wound:interpretation',
    hasInterpretationSignal,
  );
  if (!interpStage.value) throw coreStageError(interpStage.category);
  const interpretationResult = interpretationSchema.safeParse(interpStage.value);
  if (!interpretationResult.success) throw coreStageError('AI_SCHEMA_VALIDATION_FAILED');
  const interpretation: Interpretation = interpretationResult.data;

  // Stage 3 — Management & referral (text-only).
  let mgmtStage: StageResult = { value: null, category: 'AI_SCHEMA_VALIDATION_FAILED' };
  try {
    mgmtStage = await runStage(
      WOUND_MANAGEMENT_PROMPT,
      `${ctx}\nClinical interpretation:\n${JSON.stringify(interpretation)}\nObservations:\n${JSON.stringify(observation)}\nProvide management and referral.`,
      language,
      correlationId,
      'analyze-wound:management',
      hasManagementSignal,
    );
  } catch {
    // Management is non-core; retain the validated classification and label it unavailable.
  }
  const managementResult = mgmtStage.value ? managementSchema.safeParse(mgmtStage.value) : null;
  const management: Management = managementResult?.success
    ? managementResult.data
    : unavailableManagement(language);

  // Stage 4 — Safety / consistency critic (text-only).
  const draft = { observation, interpretation, management };
  let criticStage: StageResult = { value: null, category: 'AI_SCHEMA_VALIDATION_FAILED' };
  try {
    criticStage = await runStage(
      WOUND_ANALYSIS_CRITIC_PROMPT,
      `Draft analysis to audit:\n${JSON.stringify(draft)}`,
      language,
      correlationId,
      'analyze-wound:critic',
      hasCriticSignal,
    );
  } catch {
    // Critic is non-core; pass=false makes the missing automated review explicit.
  }
  const criticResult = criticStage.value ? criticSchema.safeParse(criticStage.value) : null;
  const critic = criticResult?.success ? criticResult.data : unavailableCritic(language);

  return assemble({ observation, interpretation, management, critic, patient, language });
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
  language?: AppLanguage;
}): BurnWoundAnalysis {
  return assemble(args);
}

function assemble(args: {
  observation: VisualObservation;
  interpretation: Interpretation;
  management: Management;
  critic: { pass: boolean; issues: string[]; recommendedCorrections: string[] };
  patient?: PatientContext;
  language?: AppLanguage;
}): BurnWoundAnalysis {
  const { observation, patient } = args;
  const language = args.language ?? 'en';
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
  const parkland = computeParkland(
    interpretation.isBurn,
    interpretation.tbsaEstimate,
    patient?.ageGroup,
    patient?.weightKg,
    language,
  );

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
  if (parkland.indicated === 'uncertain') {
    missing.push(language === 'ms'
      ? 'Kategori pesakit dewasa atau kanak-kanak — diperlukan untuk memilih ambang resusitasi cecair.'
      : 'Adult or child patient category — required to select the fluid-resuscitation threshold.');
  }
  if (parkland.indicated === 'yes' && !patient?.weightKg) {
    missing.push(language === 'ms'
      ? 'Berat pesakit — diperlukan untuk mengira resusitasi cecair.'
      : 'Patient weight — required to calculate fluid resuscitation.');
  }
  if (!observation.scalePresent) missing.push('A size reference (ruler/coin) — needed to measure real dimensions.');
  if (interpretation.isBurn && !patient?.mechanism) missing.push('Burn mechanism (scald/flame/chemical/electrical) and time since injury.');
  if (!patient?.freeText) missing.push('Relevant history: comorbidities (e.g. diabetes), pain, sensation, tetanus status.');
  missing.push(...(interpretation.tbsaLimitations ?? []));

  const followUpQuestions: string[] = [];
  if (parkland.indicated === 'uncertain') {
    followUpQuestions.push(language === 'ms'
      ? 'Adakah pesakit dewasa atau kanak-kanak?'
      : 'Is the patient an adult or child?');
  }
  if (parkland.indicated === 'yes' && !patient?.weightKg) {
    followUpQuestions.push(language === 'ms' ? 'Berapakah berat pesakit (kg)?' : 'What is the patient\'s weight (kg)?');
  }
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
