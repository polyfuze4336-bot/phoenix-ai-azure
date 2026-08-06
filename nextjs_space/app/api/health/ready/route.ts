/**
 * Readiness probe — `/api/health/ready`.
 *
 * Reports whether the app can serve traffic by verifying only its ESSENTIAL
 * dependencies: the application runtime, the Azure AI endpoint *configuration*
 * (never a model call), PostgreSQL when enabled, and Blob Storage when enabled.
 * Returns 200 when ready and 503 when an essential dependency is degraded, so it can
 * drive a deployment gate or an orchestrator readiness check.
 *
 * Server-only, Node runtime, never cached.
 */

import { getReadiness } from '@/lib/health/readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const readiness = await getReadiness();
  return new Response(JSON.stringify(readiness), {
    status: readiness.ok ? 200 : 503,
    headers: { 'content-type': 'application/json' },
  });
}
