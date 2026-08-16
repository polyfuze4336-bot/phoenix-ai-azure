export type ReliabilityOutcomeKind = 'success' | 'failure' | 'timeout' | 'parsing_failure';

export interface ReliabilityOutcome {
  kind: ReliabilityOutcomeKind;
  latencyMs: number;
  category?: string;
  httpStatus?: number;
}

export interface ReliabilitySummary {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  parsingFailureCount: number;
  averageLatencyMs: number;
  successRatePct: number;
  targetPct: number;
  targetMet: boolean;
  failureCategories: Record<string, number>;
}

export function summarizeReliability(
  outcomes: ReliabilityOutcome[],
  targetPct = 95,
): ReliabilitySummary {
  const successCount = outcomes.filter((outcome) => outcome.kind === 'success').length;
  const timeoutCount = outcomes.filter((outcome) => outcome.kind === 'timeout').length;
  const parsingFailureCount = outcomes.filter((outcome) => outcome.kind === 'parsing_failure').length;
  const failureCategories: Record<string, number> = {};
  for (const outcome of outcomes) {
    if (outcome.kind === 'success') continue;
    const category = outcome.category ?? outcome.kind.toUpperCase();
    failureCategories[category] = (failureCategories[category] ?? 0) + 1;
  }
  const totalRuns = outcomes.length;
  const averageLatencyMs = totalRuns === 0
    ? 0
    : Math.round(outcomes.reduce((sum, outcome) => sum + outcome.latencyMs, 0) / totalRuns);
  const successRatePct = totalRuns === 0 ? 0 : Number(((successCount / totalRuns) * 100).toFixed(2));
  return {
    totalRuns,
    successCount,
    failureCount: totalRuns - successCount,
    timeoutCount,
    parsingFailureCount,
    averageLatencyMs,
    successRatePct,
    targetPct,
    targetMet: totalRuns > 0 && successRatePct >= targetPct,
    failureCategories,
  };
}