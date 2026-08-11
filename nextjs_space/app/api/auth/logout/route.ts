/**
 * Phoenix AI — sign-out (SERVER-ONLY, Node runtime).
 *
 * Clears the signed HCP session cookie. In Entra mode it also redirects to the
 * Entra federated logout endpoint so the platform session is ended; in demo mode
 * (or when Entra is not configured) it redirects to the login page. Accepts GET
 * (nav) and POST (programmatic) so the client logout button works in both modes.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEntraMode } from '@/lib/auth/auth-config';
import { isEntraConfigured } from '@/lib/auth/entra-config';
import { buildLogoutUrl } from '@/lib/auth/entra-flow';
import { SESSION_COOKIE } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function performLogout(req: NextRequest): NextResponse {
  let target: string;
  if (isEntraMode() && isEntraConfigured()) {
    try {
      target = buildLogoutUrl();
    } catch {
      target = new URL('/hcp-login', req.url).toString();
    }
  } else {
    target = new URL('/hcp-login', req.url).toString();
  }

  const res = NextResponse.redirect(target);
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest): Promise<Response> {
  return performLogout(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return performLogout(req);
}
