/**
 * Phoenix AI — demo authentication endpoint (SERVER-ONLY).
 *
 * Verifies demo credentials server-side so passwords never live in browser
 * source. Two flows, both returning the same session shape the client persists:
 *   - manual:      POST { email, password }
 *   - quick-login: POST { email, quick: true }   (demo cards, no password)
 *
 * This is DEMO authentication, not enterprise identity. The environment is
 * expected to be protected at the platform level (App Service access
 * restrictions / Microsoft Entra Easy Auth). No credentials are ever logged.
 */
import type { NextRequest } from 'next/server';
import { AuthError, getAuthProvider } from '@/lib/auth/auth-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const record = (body ?? {}) as Record<string, unknown>;
  const email = typeof record.email === 'string' ? record.email : '';
  const password = typeof record.password === 'string' ? record.password : '';
  const quick = record.quick === true;

  try {
    const provider = getAuthProvider();
    const user = quick
      ? await provider.quickAuthenticate(email)
      : await provider.authenticate(email, password);
    return Response.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status });
    }
    // Never log credentials or bodies — only a generic marker.
    console.error('[Phoenix AI][auth] unexpected login error');
    return Response.json({ error: 'Authentication error', code: 'auth_error' }, { status: 500 });
  }
}
