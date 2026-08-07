/**
 * Analysis metadata envelope — the traceability record attached to every
 * AI-assisted assessment.
 *
 * This is an ADDITIVE, non-sensitive object surfaced under `result.meta`. It lets a
 * clinician see exactly which model deployment, pipeline, prompt revision and schema
 * produced an assessment, how the image quality was banded, and where the assessment
 * sits in the human-review workflow.
 *
 * It deliberately contains NO secrets, NO image bytes, NO clinical free text and NO
 * system-prompt content. The model deployment *name* is configuration, not a secret.
 *
 * The builder is pure and framework-agnostic so it can be unit-tested and imported by
 * client components (for rendering) without pulling in server-only modules.
 */

import {
  ANALYSIS_PIPELINE_VERSION,
  ANALYSIS_SCHEMA_VERSION,
  STAGED_PROMPT_VERSIONS,
  type StagedPromptVersions,
} from '../prompts/versions';

/** Coarse, honest image-quality band derived from the visual-observation stage. */
export type ImageQualityBand = 'good' | 'limited' | 'insufficient' | 'unknown';

/** Human-oversight state. AI output is never "approved" — only a clinician reviews it. */
export type ReviewStatus = 'awaiting_review' | 'reviewed' | 'modified' | 'escalated';

export interface AnalysisMetadata {
  /** Correlates the assessment across UI, telemetry and (optionally) persistence. */
  analysisId: string;
  /** ISO-8601 generation timestamp. */
  generatedAt: string;
  /** Azure model deployment NAME (configuration, not a secret); 'default' when unset. */
  modelDeployment: string;
  /** Which pipeline produced this result. */
  pipelineMode: 'staged' | 'single';
  /** Version of the staged analysis pipeline. */
  pipelineVersion: string;
  /** Prompt revision stamps for the staged pipeline. */
  promptVersions: StagedPromptVersions;
  /** Structured output schema version. */
  schemaVersion: string;
  /** Coarse image-quality band the analysis was gated against. */
  imageQuality: ImageQualityBand;
  /** Model-reported overall confidence (self-report + image gating, not validated accuracy). */
  overallConfidence: string;
  /** Deterministic (non-AI) calculations applied, if any. */
  deterministicCalculations: string[];
  /** Where the assessment sits in the human-review workflow. */
  reviewStatus: ReviewStatus;
}

/** Minimal shape the builder reads from the structured analysis (all optional). */
export interface AnalysisMetadataInput {
  analysisId?: string;
  generatedAt?: string;
  modelDeployment?: string;
  pipelineMode?: 'staged' | 'single';
  imageQualityAdequate?: boolean | undefined;
  imageQualityIssues?: string[] | undefined;
  overallConfidence?: string | undefined;
  parklandIndicated?: boolean | undefined;
  tbsaComputed?: boolean | undefined;
  reviewStatus?: ReviewStatus;
}

function newAnalysisId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return `axr-${globalThis.crypto.randomUUID()}`;
    }
  } catch {
    /* fall through */
  }
  return `axr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Map the observation stage's adequacy/issues onto a coarse, honest band. */
export function deriveImageQualityBand(
  adequate: boolean | undefined,
  issues: string[] | undefined,
): ImageQualityBand {
  if (adequate === undefined) return 'unknown';
  if (!adequate) return (issues?.length ?? 0) >= 2 ? 'insufficient' : 'limited';
  return (issues?.length ?? 0) > 0 ? 'limited' : 'good';
}

/**
 * Build the metadata envelope. Pure: same input -> same output (aside from the
 * generated id/timestamp when not supplied).
 */
export function buildAnalysisMetadata(input: AnalysisMetadataInput = {}): AnalysisMetadata {
  const deterministic: string[] = [];
  if (input.parklandIndicated) deterministic.push('Parkland fluid estimate (weight-gated)');
  if (input.tbsaComputed) deterministic.push('Lund & Browder TBSA');

  return {
    analysisId: input.analysisId ?? newAnalysisId(),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    modelDeployment: input.modelDeployment?.trim() || 'default',
    pipelineMode: input.pipelineMode ?? 'staged',
    pipelineVersion: ANALYSIS_PIPELINE_VERSION,
    promptVersions: STAGED_PROMPT_VERSIONS,
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    imageQuality: deriveImageQualityBand(input.imageQualityAdequate, input.imageQualityIssues),
    overallConfidence: (input.overallConfidence ?? '').trim() || 'not reported',
    deterministicCalculations: deterministic,
    reviewStatus: input.reviewStatus ?? 'awaiting_review',
  };
}

/** Short, human-readable label for a review status (for compact status lines/badges). */
export function reviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case 'reviewed':
      return 'Clinician reviewed';
    case 'modified':
      return 'Modified by clinician';
    case 'escalated':
      return 'Escalated';
    case 'awaiting_review':
    default:
      return 'Clinical review pending';
  }
}
