/**
 * Version stamps for the staged clinical prompts, the analysis pipeline, and the
 * structured output schema.
 *
 * These constants make every AI-assisted assessment traceable to the exact prompt
 * and pipeline revision that produced it (see `lib/ai/analysis/metadata.ts`). They
 * are the single source of truth for prompt/pipeline versioning across the app and
 * are retained in the analysis metadata envelope for governed review and audit.
 *
 * Bump the relevant constant whenever the corresponding prompt text or pipeline
 * behaviour changes in a way a reviewer would want to distinguish. Never expose the
 * prompt TEXT to end users — only these version identifiers.
 */

/** Stage 1 — objective visual observation prompt. */
export const WOUND_VISUAL_OBSERVATION_PROMPT_VERSION = '2.2.0';

/** Stage 2 — clinical interpretation prompt (observation vs interpretation). */
export const WOUND_CLINICAL_INTERPRETATION_PROMPT_VERSION = '2.2.0';

/** Stage 3 — management + referral guidance prompt. */
export const WOUND_MANAGEMENT_PROMPT_VERSION = '2.2.0';

/** Stage 4 — consistency / safety critic prompt. */
export const WOUND_ANALYSIS_CRITIC_PROMPT_VERSION = '2.2.0';

/** Single-pass fallback HCP prompt (used only when `AI_ANALYSIS_PIPELINE=single`). */
export const HCP_WOUND_ANALYSIS_PROMPT_VERSION = '1.1.0';

/** HCP clinical chat system prompt. */
export const HCP_CHAT_PROMPT_VERSION = '1.1.0';

/** Community (public) analysis + chat prompts. */
export const COMMUNITY_WOUND_ANALYSIS_PROMPT_VERSION = '1.1.0';

/** The staged analysis pipeline (`lib/ai/analysis/pipeline.ts`) as a whole. */
export const ANALYSIS_PIPELINE_VERSION = '2.2.0';

/** The rich structured output schema (`lib/ai/schemas/burn-wound-analysis.ts`). */
export const ANALYSIS_SCHEMA_VERSION = '2.0';

/**
 * Aggregated prompt versions for the staged pipeline, recorded with each analysis.
 */
export const STAGED_PROMPT_VERSIONS = {
  visualObservation: WOUND_VISUAL_OBSERVATION_PROMPT_VERSION,
  clinicalInterpretation: WOUND_CLINICAL_INTERPRETATION_PROMPT_VERSION,
  management: WOUND_MANAGEMENT_PROMPT_VERSION,
  critic: WOUND_ANALYSIS_CRITIC_PROMPT_VERSION,
} as const;

export type StagedPromptVersions = typeof STAGED_PROMPT_VERSIONS;
