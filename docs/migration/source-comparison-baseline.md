# Part 1 — Source-to-Azure Comparison Baseline

> Evidence-based comparison of the original Phoenix AI source (imported from Abacus.AI)
> against the current Azure-migrated codebase and the live Azure deployment.
> Every figure below is derived from git, the working tree, and the running Azure
> environment — not from memory, assumptions, or commit messages alone.

## 1. What is being compared

| Artefact | Reference | How it was captured |
| --- | --- | --- |
| Original source (Abacus.AI import) | git tag `abacus-source-baseline` = commit `d200b5a00cc61dc171ac29171d54c155335f4d35` | `git show <tag>:<path>` |
| Current Azure codebase | branch `migration/azure-port`, HEAD = `4c47623` (= `origin/migration/azure-port`) | `git diff`, `git show`, working tree |
| Live Azure deployment | `https://app-phoenixai-yun55ezsi4yoq.azurewebsites.net` | `az resource list`, live HTTP probes, App Insights |

Working tree at time of audit: **clean** (`git status --porcelain` empty).

## 2. Commit range

- **24 commits** between the baseline tag and HEAD.
- Merge-in feature: `4c47623` (merge of `feature/hcp-analysis-history`) is the current HEAD.
- Full commit list is reproduced in [file-change-summary.md](file-change-summary.md).

## 3. Aggregate diff (`git diff --stat abacus-source-baseline..HEAD`)

| Metric | Value |
| --- | --- |
| Files changed | **574** |
| Insertions | **+20,827** |
| Deletions | **−1,713** |
| Files added (A) | 545 |
| Files modified (M) | 27 |
| Files deleted (D) | 2 |
| Files renamed/copied | 0 |

Line breakdown by category (evidence: `git diff --numstat`):

| Category | Inserted lines |
| --- | --- |
| Code + docs (excluding versioned PNG baselines and `package-lock.json`) | **13,539** |
| `package-lock.json` | +4,478 / −882 |
| Remaining (versioned visual-baseline PNGs, binary assets) | balance of the 20,827 total |

The large file count (545 additions) is dominated by test/visual-baseline PNG fixtures and
generated lockfile churn; the hand-written change surface is far smaller and is enumerated in
Parts 3–5.

## 4. Branding parity anchor — the Phoenix AI logo

The original logo is the single most important parity anchor. It is **byte-identical** across
all three reference points:

| Reference | Git blob object ID | Size |
| --- | --- | --- |
| Baseline (`abacus-source-baseline`) | `370601eccff66267cac08573e90f1015680a7c31` | 346,691 bytes |
| HEAD (`4c47623`) | `370601eccff66267cac08573e90f1015680a7c31` | 346,691 bytes |
| Working tree | `370601eccff66267cac08573e90f1015680a7c31` | 346,691 bytes |

On-disk SHA-256 of `nextjs_space/public/logo.png`:
`dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`.

Identical blob IDs prove the logo has **not** been altered, replaced, regenerated, or
re-encoded during the migration.

## 5. Live deployment snapshot (evidence)

- Subscription: `ME-MngEnvMCAP682563-mkhalib-1` (`870b491d-74bb-4aa7-95ab-647f262444d5`),
  tenant `08cef5cb-15fe-4756-9dd1-598a659ff06a`.
- Resource group `rg-phoenixai-demo`, region **southeastasia**, **12** resources.
- Live route probes (HTTP 200): `/`, `/hcp-login`, `/community`, `/hcp/history`,
  `/api/health/live`, `/api/health/ready`.
- Readiness body (`/api/health/ready`):
  `runtime=ok`, `azure-ai=ok (auth=identity)`, `postgresql=ok (3 ms)`,
  `blob-storage=ok (container=clinical-uploads)`.
- App Insights (last 2 days): 298 requests, 6 custom events, **0** exceptions.

## 6. Method and guardrails

- No application code was changed while producing this documentation.
- Comparisons use `git show <ref>:<path>` for exact original content and the working tree /
  `az` CLI for current and live state.
- Change classifications used throughout Parts 2–24: **Retained unchanged**, **Retained with
  config change**, **Modified**, **Enhanced**, **Added**, **Replaced**, **Removed**,
  **Deprecated**, **Deferred**, **Partially implemented**, **Not applicable**.

## 7. Where to go next

- Full change inventory → [change-inventory.md](change-inventory.md)
- What was added → [additions.md](additions.md)
- What changed/was enhanced → [modifications-and-enhancements.md](modifications-and-enhancements.md)
- What was replaced → [replacements.md](replacements.md)
- What was removed → [removals.md](removals.md)
- What was retained → [retained-functionality.md](retained-functionality.md)
- Consolidated report → [phoenix-ai-azure-migration-report.md](phoenix-ai-azure-migration-report.md)
