/**
 * Parsing + fallback for the streamed wound-analysis JSON results.
 *
 * Each function tries to `JSON.parse` the accumulated model output and, on
 * failure, returns the SAME fallback object the source routes used. The
 * community parser preserves the original app's two DIFFERENT fallbacks for the
 * `[DONE]` path vs the end-of-stream path (see `StructuredResultPhase`).
 */

import { StructuredResultPhase } from '../streaming/sse';

/** HCP wound analysis: parse or fall back to the source app's default result.
 *  The fallback is identical for both completion phases (as in the original). */
export function parseHcpWoundAnalysis(buffer: string): unknown {
  try {
    return JSON.parse(buffer);
  } catch {
    return {
      fitzpatrickType: 'N/A',
      fitzpatrickNote: 'N/A',
      woundCategory: 'N/A',
      woundType: 'Analysis completed',
      burnDegree: 'N/A',
      severity: 'See details',
      characteristics: buffer,
      tissueComposition: 'N/A',
      exudate: 'N/A',
      woundEdges: 'N/A',
      confidence: 'N/A',
      tbsaEstimate: '0',
      tbsaRange: 'N/A',
      tbsaBodyRegions: 'N/A',
      tbsaMethod: 'N/A',
      isBurn: false,
      parklandFluid: 'N/A',
      firstAid: 'Consult healthcare professional',
      woundCare: 'Follow clinical protocols',
      dressing: 'As advised by HCP',
      referral: 'If needed',
      followUp: 'As scheduled',
    };
  }
}

/** Community wound analysis: parse or fall back. The source app used slightly
 *  different fallback wording depending on whether the `[DONE]` sentinel was
 *  reached (`'done'`) or the stream simply ended (`'end'`) — both preserved. */
export function parseCommunityWoundAnalysis(
  buffer: string,
  phase: StructuredResultPhase,
): unknown {
  try {
    return JSON.parse(buffer);
  } catch {
    if (phase === 'done') {
      return {
        description: buffer,
        recommendation: 'Please see a doctor for proper assessment.',
        firstAidTips: 'Keep the wound clean and covered.',
      };
    }
    return {
      description: buffer,
      recommendation: 'Please see a doctor.',
      firstAidTips: 'Keep clean and covered.',
    };
  }
}
