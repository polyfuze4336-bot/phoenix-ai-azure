/**
 * Correlation-ID helpers shared by the API routes.
 *
 * A single correlation ID threads a request across the browser, the Next.js API
 * route, the AI provider, PostgreSQL and Blob Storage so a clinician-facing
 * action can be traced end-to-end in App Insights WITHOUT ever carrying content.
 *
 * The browser sends `x-correlation-id` on its fetches (see lib/telemetry/client).
 * Routes read it if present (and well-formed) or mint a fresh one.
 */

import { newCorrelationId } from '@/lib/ai/telemetry';

export const CORRELATION_HEADER = 'x-correlation-id';

/** Accept only compact, safe correlation tokens from the client (defensive). */
const VALID_CORRELATION_ID = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Return the incoming correlation ID when the client supplied a well-formed one,
 * otherwise generate a new server-side ID. Never trusts arbitrary header content.
 */
export function getOrCreateCorrelationId(headers: Headers): string {
  const incoming = headers.get(CORRELATION_HEADER)?.trim();
  if (incoming && VALID_CORRELATION_ID.test(incoming)) return incoming;
  return newCorrelationId();
}
