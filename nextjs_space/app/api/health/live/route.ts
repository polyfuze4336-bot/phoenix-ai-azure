/**
 * Liveness probe — `/api/health/live`.
 *
 * Returns 200 as long as the Next.js Node server is handling requests. It touches NO
 * external dependency (no database, no AI, no storage), so it stays fast and cannot be
 * knocked over by a slow datastore. Wire the App Service health check to this path.
 *
 * Server-only, Node runtime, never cached.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const body = JSON.stringify({
    status: 'alive',
    service: 'phoenix-ai',
    time: new Date().toISOString(),
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
}
