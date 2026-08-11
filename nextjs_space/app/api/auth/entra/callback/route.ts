/**
 * Phoenix AI — Entra ID sign-in callback (SERVER-ONLY, Node runtime).
 *
 * Completes the OIDC flow: validates the returned state against the stored
 * cookie, exchanges the code for tokens, verifies the ID token + nonce, maps the
 * claims to an HCP role, mints a signed session cookie, and redirects to /hcp.
 *
 * Failure states redirect to the login page with an explicit reason:
 *   - unauthorised (bad state / token / cancelled) -> /hcp-login?error=unauthorized
 *   - forbidden (no clinical role)                  -> /hcp-login?error=forbidden
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEntraMode } from '@/lib/auth/auth-config';
import { isEntraConfigured } from '@/lib/auth/entra-config';
import { exchangeCodeForTokens, validateIdToken } from '@/lib/auth/entra-flow';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';
import { AuthError } from '@/lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TX_COOKIES = ['hcp_oauth_state', 'hcp_oauth_nonce', 'hcp_oauth_verifier'];

function clearTxCookies(res: NextResponse): void {
  for (const name of TX_COOKIES) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
}

function redirectWithError(req: NextRequest, error: 'unauthorized' | 'forbidden' | 'unavailable'): NextResponse {
  const res = NextResponse.redirect(new URL(`/hcp-login?error=${error}`, req.url));
  clearTxCookies(res);
  return res;
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!isEntraMode() || !isEntraConfigured()) {
    return redirectWithError(req, 'unavailable');
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError || !code || !returnedState) {
    return redirectWithError(req, 'unauthorized');
  }

  const storedState = req.cookies.get('hcp_oauth_state')?.value;
  const storedNonce = req.cookies.get('hcp_oauth_nonce')?.value;
  const codeVerifier = req.cookies.get('hcp_oauth_verifier')?.value;

  if (!storedState || storedState !== returnedState || !storedNonce || !codeVerifier) {
    return redirectWithError(req, 'unauthorized');
  }

  try {
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    const sessionUser = await validateIdToken(tokens.id_token as string, storedNonce);
    const token = await createSessionToken(sessionUser);

    const res = NextResponse.redirect(new URL('/hcp', req.url));
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    clearTxCookies(res);
    return res;
  } catch (err) {
    if (err instanceof AuthError && err.code === 'forbidden') {
      return redirectWithError(req, 'forbidden');
    }
    return redirectWithError(req, 'unauthorized');
  }
}
