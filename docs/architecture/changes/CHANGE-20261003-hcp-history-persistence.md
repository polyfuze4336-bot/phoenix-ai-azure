# HCP history persistence — 2026-10-03

Impact: MEDIUM. Version: 8.6.0 → 8.7.0. ADR: none; existing PostgreSQL and private Blob
integration are reused, without a new resource or schema.

The verified Entra HCP history path validates the image, uploads it to the private
`clinical-uploads` container, then stores the opaque blob path and mode-tagged result in
`AnalysisRecord`. Database failure triggers best-effort blob cleanup; repeated saves with
the same generated analysis ID return the existing record. A failed save remains visible
to the clinician and may be retried. List/detail require a verified session and enforce
clinician ownership; administrators may inspect unclassified legacy rows. Detail resolves
a fresh short-lived read-only SAS if the image exists; missing images do not erase results.

Demo-mode sessions are client-only and cannot authorize access to retained clinical
images, so their analyses are not retained until Entra mode is configured. Existing
nullable assessment types are preserved; no migration or deletion occurs. No image
retention/deletion schedule is introduced pending organisational policy.
