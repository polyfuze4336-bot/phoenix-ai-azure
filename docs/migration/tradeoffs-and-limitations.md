# Part 18 — Trade-offs and Limitations

> Honest record of what the migration did **not** achieve, the constraints it operates under, and
> the risks a reader should understand before drawing conclusions. This document deliberately
> avoids overstated claims; see [documentation-validation-report.md](documentation-validation-report.md).

## 1. Not clinically validated

Phoenix AI remains a demonstration/assessment tool. The migration preserved its behaviour and
added an Azure operational foundation, but **no clinical validation, regulatory review, or
patient-safety assurance** was performed. It must not be relied on for real clinical
decision-making.

## 2. Authentication is demo-grade by default

- The default `AUTH_MODE=demo` uses a small fixed directory of **fictional** users. It is a
  faithful replacement of the original mock login, **not** enterprise authentication.
- Microsoft Entra ID (OIDC) is available but **opt-in** and requires an app registration; it is
  not enabled in the demo deployment.

## 3. Partial persistence

- The database and Blob layers are provisioned, migrated, and seeded, but most visible screens
  still render the original demo/mock content to preserve parity.
- Only the post-parity HCP history feature (`AnalysisRecord`) actually reads/writes data.
- No user-uploaded clinical images are persisted; images remain ephemeral base64. See
  [persistence-gap-assessment.md](persistence-gap-assessment.md).

## 4. Single region, single instance

- The app runs in one region (`southeastasia`) on a single App Service plan (P1v3). There is no
  multi-region failover or documented disaster-recovery configuration in this environment.
- The region was chosen because MCAPS sandbox quota blocked the intended `eastus2`.

## 5. Sandbox Key Vault constraint

- MCAPS policy forces Key Vault public network access **off**. As a result, `DATABASE_URL` is
  supplied as a **direct App Service app setting** rather than a Key Vault reference in this
  deployment. Key Vault holds other material but is not the source for this value here.

## 6. AI model resource is external to the app RG

- The Foundry/OpenAI resource (`aif-yfjw6y`) lives in a separate resource group
  (`rg-aisgemini-dev`, `eastus2`). Cross-region model calls add latency and a cross-RG dependency.

## 7. Testing scope

- Automated tests cover parity, calculations, API contracts, and visual fidelity. They do **not**
  include load testing, penetration testing, accessibility auditing, or clinical accuracy
  evaluation of AI output.
- Two visual baselines differ due to Recharts animation jitter (accepted, non-blocking).

## 8. Cost and scale not tuned

- Resource sizes (P1v3, PostgreSQL tier) were chosen for a working demo, not tuned for cost or
  concurrency. No autoscale or capacity planning was performed.

## 9. Data residency & privacy

- Telemetry is privacy-safe by design (excludes clinical content), but a full data-protection /
  residency review was not part of this migration.

## 10. Summary risk posture

| Dimension | Status |
| --- | --- |
| Visual/behavioural parity | Achieved (hash-verified logo, 141/143 visual) |
| Azure operational foundation | Established (IaC, telemetry, health, CI/CD) |
| Clinical readiness | Not addressed (out of scope) |
| Enterprise auth | Available but opt-in |
| Full persistence | Partial |
| Resilience/DR | Single region, not configured |
| Secret management | Constrained by sandbox policy |

These limitations should be resolved before any use beyond demonstration.
