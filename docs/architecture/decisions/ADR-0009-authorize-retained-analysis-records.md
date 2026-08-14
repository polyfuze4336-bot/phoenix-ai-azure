# ADR-0009: Authorize access to retained analysis records

- **Status:** Accepted
- **Date:** 2026-08-14
- **Decision owners:** Phoenix AI migration team
- **Related change:** `CHANGE-20260814-v2-analysis-language-safety.md`

## Context

The original HCP analysis client can retain an assessment and its image for history. Demo
authentication is client-side only and therefore cannot provide a trustworthy server identity.
Allowing analysis-history APIs to accept that client identity would expose clinical records across
users and would not meet the application's patient-data handling obligations.

## Decision

Retained analysis create, list and detail APIs require a valid server-signed Entra HCP session.
Records are scoped to the verified session email, and submitted clinician identity fields are not
trusted for authorization. In demo authentication mode, analysis itself remains available but
history persistence and retrieval are unavailable.

## Consequences

- Patient images and assessment records cannot be retained or read through client-only demo auth.
- Entra-authenticated clinicians can access only their own retained records.
- Analysis remains functional if best-effort history saving is unavailable.
- A future organization-wide clinical-record access model requires a separately governed RBAC
  decision.
