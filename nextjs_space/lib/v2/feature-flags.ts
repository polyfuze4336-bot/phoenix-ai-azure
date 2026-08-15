/**
 * Phoenix AI v2.0 — feature flags.
 *
 * v2 is an ADDITIVE experience layered onto the preserved Original app (see
 * docs/architecture/decisions/ADR-0004-dual-experience-v2.md). These flags gate
 * the v2 surface so it can be rolled back instantly and data-safely.
 *
 * Flags are read from NEXT_PUBLIC_-prefixed env vars so a single source works in
 * both server and client components (Next.js inlines NEXT_PUBLIC_* at build time).
 * Every flag DEFAULTS TO ENABLED and is only turned off by the exact string
 * "false" — so with no configuration the full v2 experience is available, and
 * setting NEXT_PUBLIC_FEATURE_V2_ENABLED=false cleanly reverts to Original-only.
 */

export type FeatureFlagKey =
  | 'v2Enabled'
  | 'cases'
  | 'reports'
  | 'insights'
  | 'guidelineAi'
  | 'notifications'
  | 'commandPalette';

type FlagEnvValue = string | undefined;

/** A flag is ON unless its env var is explicitly the string "false". */
function readFlag(value: FlagEnvValue): boolean {
  return (value ?? '').trim().toLowerCase() !== 'false';
}

/**
 * Resolved flag map. Evaluated once per module load. Because these reference
 * `process.env.NEXT_PUBLIC_*` literally, Next.js can statically inline them for
 * client bundles.
 */
export const featureFlags: Record<FeatureFlagKey, boolean> = {
  v2Enabled: readFlag(process.env.NEXT_PUBLIC_FEATURE_V2_ENABLED),
  cases: readFlag(process.env.NEXT_PUBLIC_FEATURE_CASES),
  reports: readFlag(process.env.NEXT_PUBLIC_FEATURE_REPORTS),
  insights: readFlag(process.env.NEXT_PUBLIC_FEATURE_INSIGHTS),
  guidelineAi: readFlag(process.env.NEXT_PUBLIC_FEATURE_GUIDELINE_AI),
  notifications: readFlag(process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS),
  commandPalette: readFlag(process.env.NEXT_PUBLIC_FEATURE_COMMAND_PALETTE),
};

/** True when a given v2 capability is enabled. */
export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return featureFlags[key];
}

/** True when the whole v2 experience is enabled. */
export function isV2Enabled(): boolean {
  return featureFlags.v2Enabled;
}
