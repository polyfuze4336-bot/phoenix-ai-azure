# Authentication — demo isolation for the Azure parity release

Phoenix AI's first Azure parity release preserves the original mock login exactly.
This document records what that means, why it is safe **only** for a demo, and how to
protect the demo environment.

> **Not for production healthcare use.** The demo login is a faithful reproduction of a
> client-side mock. It does not provide real identity, access control, auditability, or
> session integrity, and must not gate real patient data.

## What ships in the parity release

- **Feature flag `AUTH_MODE`** (see `.env.example`, `lib/auth/auth-config.ts`):
  - `demo` (default) — server-verified demo credentials plus the original quick-login cards.
  - `entra` — **optional** Microsoft Entra ID sign-in for HCP users (see below). Opt-in and
    not enabled by default for the parity release.
- **Authentication abstraction** (`lib/auth/`): a provider-neutral contract
  (`AuthProvider`) with a `DemoAuthProvider` and an `EntraAuthProvider` placeholder, so a
  real identity provider can be added later without touching the login UI or route guard.
- **Demo credentials moved server-side** (`lib/auth/demo-users.ts`): passwords no longer
  appear in browser source. The login page renders only a **non-secret** directory (names,
  roles, emails) for the quick-login cards and posts to `POST /api/auth/login`, which verifies
  credentials on the server. Quick-login issues a demo session without placing a password in
  the browser.
- **Preserved experience**: the visual login, the three quick-login cards, the `/hcp-login`
  and `/hcp` routes, and the `sessionStorage` `hcp_auth` session all behave as before.

## Why `sessionStorage` auth is not production-grade

The session identity is stored in `sessionStorage` and the route guard is a client-side
check (`app/hcp/_components/hcp-layout-client.tsx`). This is acceptable for a demo but is
**not** suitable for production healthcare usage because:

- **No server-side session integrity** — `sessionStorage` is fully readable and writable by
  any script in the page; a user can forge `hcp_auth` and bypass the guard.
- **No httpOnly / secure cookie** — the session is exposed to XSS and cannot be invalidated
  server-side.
- **No real credential store** — demo passwords are fictional, shared, and static.
- **No authorization, MFA, lockout, audit trail, or session expiry.**
- **No protection of the API routes** — the AI and health endpoints are not access-controlled
  at the application layer.

A production build must replace this with real identity (Microsoft Entra ID) issuing
server-validated, httpOnly session cookies, with authorization and auditing — and must never
store PHI behind a client-side guard.

## Protecting the demo environment

Because the app-level control is demo-only, protect the deployed demo at the **platform**
level. Use whichever is appropriate:

1. **App Service Authentication (Easy Auth) with Microsoft Entra ID** — require Entra sign-in
   in front of the whole site; no application code required. Preferred for internal demos.
2. **App Service access restrictions** — allow-list specific IP ranges / a corporate network,
   or restrict to a private endpoint.
3. **A lightweight gate** — e.g. a short-lived shared link or basic platform auth for a
   time-boxed external demo.

These controls sit in front of the demo login and do not change the in-app experience.

## Optional Microsoft Entra ID authentication (`AUTH_MODE=entra`)

Setting `AUTH_MODE=entra` replaces the demo login action with a real **Microsoft Entra ID**
(OpenID Connect) sign-in for the Healthcare Professional portal. The community portal stays
publicly accessible. This mode is **opt-in**: it activates only when `AUTH_MODE=entra` **and**
the Entra app registration is configured; otherwise the app falls back to demo behaviour.

### How it works

- **Redirect-based sign-in.** The login page preserves its Phoenix AI appearance but the
  sign-in action redirects to Entra ID via `GET /api/auth/entra/login`. The flow uses OpenID
  Connect **authorization code + PKCE** with `state` and `nonce` (short-lived httpOnly cookies)
  to protect against CSRF and replay.
- **Server-validated session.** On callback (`GET /api/auth/entra/callback`) the server
  exchanges the code for tokens, verifies the ID token against the tenant JWKS (issuer +
  audience + nonce), maps claims to a clinical role, and mints a **signed httpOnly session
  cookie** (`hcp_session`, HS256 via `jose`, signed with `SESSION_SECRET`). The browser never
  sees the raw identity tokens.
- **Session expiration.** The cookie carries a JWT `exp` claim (`AUTH_SESSION_TTL_MINUTES`,
  default 60). An expired or tampered cookie is treated as no session.
- **Server-enforced route protection (no client-only guard).** `middleware.ts` verifies the
  session cookie at the edge for every protected request:
  - HCP pages (`/hcp`, `/hcp/*`) → redirect to `/hcp-login?error=unauthorized` when unauthenticated.
  - HCP APIs (`/api/hcp-chat`, `/api/analyze-wound`) → `401 { code: "unauthorized" }`.
  - Community routes and APIs (`/community`, `/api/community-*`) remain public.
  Middleware only enforces when `AUTH_MODE=entra`; in demo mode it is a no-op so parity is
  preserved.
- **Logout.** `GET|POST /api/auth/logout` clears the session cookie and redirects to the Entra
  federated sign-out endpoint (falling back to `/hcp-login` when Entra is not configured).
- **Session probe.** `GET /api/auth/session` returns the server-verified identity (or `401`)
  and the active mode, used by the HCP layout to render the user menu.

### Role mapping (Doctor / Nurse / Administrator)

Roles are resolved server-side in `lib/auth/entra-config.ts`:

1. **App roles (preferred).** Define App Roles named exactly `Doctor`, `Nurse` and
   `Administrator` on the Entra app registration and assign users/groups. The token `roles`
   claim is mapped automatically — no extra configuration required.
2. **Group fallback.** If no app role is present, Entra security-group object-ids are mapped
   via `AZURE_ENTRA_GROUP_ADMIN`, `AZURE_ENTRA_GROUP_DOCTOR`, `AZURE_ENTRA_GROUP_NURSE`
   (comma-separated lists).

Role precedence is **Administrator > Doctor > Nurse**. A signed-in user with **no** mapped
clinical role is **Forbidden**: sign-in is refused and the login page shows a forbidden state
(`/hcp-login?error=forbidden`) rather than granting portal access.

### Unauthorised vs Forbidden states

- **Unauthorised** — no valid session (never signed in, cancelled, or expired). Protected
  pages redirect to the login page with an "session expired / sign in again" banner; protected
  APIs return `401`.
- **Forbidden** — successfully authenticated with Entra but lacking a clinical role. The login
  page shows an explicit "no clinical role" message; no session is issued.

### Configuration

Set these in `.env` locally and in Azure app settings / Key Vault in the cloud (all
server-only — never committed, never exposed to the browser):

| Variable | Purpose |
| --- | --- |
| `AUTH_MODE=entra` | Enable Entra sign-in. |
| `AZURE_ENTRA_TENANT_ID` | Directory (tenant) ID. |
| `AZURE_ENTRA_CLIENT_ID` | Application (client) ID. |
| `AZURE_ENTRA_CLIENT_SECRET` | Client secret. |
| `AZURE_ENTRA_REDIRECT_URI` | Must match the registered Web redirect URI, ending in `/api/auth/entra/callback`. |
| `AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI` | Optional post-sign-out return URL. |
| `AZURE_ENTRA_SCOPES` | Optional OIDC scopes (default `openid profile email`). |
| `AZURE_ENTRA_GROUP_ADMIN` / `_DOCTOR` / `_NURSE` | Optional group→role fallback. |
| `SESSION_SECRET` | ≥32-char secret signing the session cookie (required). |
| `AUTH_SESSION_TTL_MINUTES` | Optional session lifetime (default 60). |

Steps: register the app, add the Web redirect URI, create a client secret, define the three
App Roles (or capture group object-ids), populate the variables above, then set
`AUTH_MODE=entra`. No demo passwords or credentials are shipped in the browser bundle in this
mode.

## Alternative: platform-level Entra (no application code)

If application-level sign-in is not required, protect the deployed app at the **platform**
level instead of `AUTH_MODE=entra`. This needs no code here and remains a valid option:
implement or enable **App Service Authentication (Easy Auth) with Microsoft Entra ID** in
front of the whole site (see "Protecting the demo environment" above).
