/**
 * Phoenix AI — route protection middleware (Edge runtime).
 *
 * Enforces server-validated sessions for the HCP portal and HCP APIs, so there
 * is NO client-only route protection. Active ONLY when AUTH_MODE=entra; in demo
 * mode this middleware is a no-op and the original client-side demo guard is
 * preserved (parity for the initial release).
 *
 * The community portal and its APIs stay public. Session expiry is enforced by
 * the signed cookie's `exp` claim (an expired/invalid token is treated as no
 * session).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { resolveAuthMode } from '@/lib/auth/auth-config';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

// Protected HCP APIs (community APIs remain public).
const PROTECTED_API_PREFIXES = ['/api/hcp-chat', '/api/analyze-wound', '/api/hcp/analyses'];

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isProtectedPage(pathname: string): boolean {
  // The HCP portal, but never the login page itself.
  return pathname === '/hcp' || pathname.startsWith('/hcp/');
}

export async function middleware(req: NextRequest): Promise<Response> {
  // Only enforce server sessions in Entra mode; demo mode keeps its own guard.
  if (resolveAuthMode() !== 'entra') {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) {
    return NextResponse.next();
  }

  // Unauthenticated / expired session.
  if (isProtectedApi(pathname)) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'unauthorized' },
      { status: 401 },
    );
  }

  if (isProtectedPage(pathname)) {
    const loginUrl = new URL('/hcp-login', req.url);
    loginUrl.searchParams.set('error', 'unauthorized');
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hcp/:path*',
    '/hcp',
    '/api/hcp-chat/:path*',
    '/api/analyze-wound/:path*',
    '/api/hcp/analyses/:path*',
  ],
};
