/**
 * Phoenix AI — Entra ID sign-in start (SERVER-ONLY, Node runtime).
 *
 * Begins the OIDC authorization-code + PKCE flow: generates state/nonce/verifier,
 * stashes them in short-lived httpOnly cookies, and redirects the browser to
 * Microsoft Entra ID. Only active when AUTH_MODE=entra and Entra is configured.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEntraMode } from '@/lib/auth/auth-config';
import { isEntraConfigured } from '@/lib/auth/entra-config';
import { buildAuthorizationRequest } from '@/lib/auth/entra-flow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TX_COOKIE_MAX_AGE = 600; // 10 minutes to complete sign-in

export async function GET(req: NextRequest): Promise<Response> {
  if (!isEntraMode() || !isEntraConfigured()) {
    return NextResponse.redirect(new URL('/hcp-login?error=unavailable', req.url));
  }

  try {
    const { url, state, nonce, codeVerifier } = await buildAuthorizationRequest();
    const res = NextResponse.redirect(url);
    const cookieOptions = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: TX_COOKIE_MAX_AGE,
    };
    res.cookies.set('hcp_oauth_state', state, cookieOptions);
    res.cookies.set('hcp_oauth_nonce', nonce, cookieOptions);
    res.cookies.set('hcp_oauth_verifier', codeVerifier, cookieOptions);
    return res;
  } catch {
    console.error('[Phoenix AI][auth] failed to start Entra sign-in');
    return NextResponse.redirect(new URL('/hcp-login?error=unavailable', req.url));
  }
}
