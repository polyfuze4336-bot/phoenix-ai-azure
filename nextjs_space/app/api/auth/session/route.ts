/**
 * Phoenix AI — current session probe (SERVER-ONLY, Node runtime).
 *
 * Returns the server-verified session identity for the HCP layout to render the
 * user menu without trusting any client-held state. 401 when there is no valid
 * session. Reports the active auth mode so the client can adapt the login CTA.
 */
import { resolveAuthMode } from '@/lib/auth/auth-config';
import { getCurrentSession } from '@/lib/auth/current-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const mode = resolveAuthMode();
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ authenticated: false, mode }, { status: 401 });
  }
  return Response.json({
    authenticated: true,
    mode,
    user: { name: session.name, email: session.email, role: session.roleLabel, roleKey: session.roleKey },
  });
}
