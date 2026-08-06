/**
 * Liveness probe.
 *
 * Returns 200 as long as the Next.js server process is handling requests. It does
 * NOT touch the database, so it stays fast and cannot be knocked over by a slow or
 * unavailable datastore. Use `/api/health/db` for database readiness.
 *
 * Server-only, Node runtime, never cached.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const body = JSON.stringify({ status: 'ok', service: 'phoenix-ai', time: new Date().toISOString() });
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
}
