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
  - `entra` — a recognised but **not implemented** placeholder that fails loudly with guidance.
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

## Moving to `entra` later

`AUTH_MODE=entra` currently returns HTTP 501 with guidance. The recommended production path is
platform-level Entra (option 1 above), which needs no code here. If application-level Entra is
required later, implement `EntraAuthProvider` (`lib/auth/entra-provider.ts`) against the
existing `AuthProvider` contract and switch the flag — the login UI and route guard stay put.
