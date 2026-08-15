# Phoenix AI rollback assessment

**Assessment date:** 2026-08-15 (Malaysia time)

## Decision

Restore the Original Phoenix AI application from the deployment-tagged baseline
`7298f21ad0f9fd9557a8a3426e5ee0a433a4df64` (`azure-deployed-2026-08-10`) while
retaining the current Azure Container Apps infrastructure and recoverable Git history.

The restoration must not blindly restore the whole repository. The baseline already contains
the additive v2 source and defaults its feature flag to enabled. Only the Original application
surface should be restored and made reachable; v2 must not be reintroduced as part of this work.

## Evidence

| Item | Commit / evidence | Date and time | Finding |
|------|-------------------|---------------|---------|
| Current remote `main` and deployed revision | `f050416bb8bcc32972fd16994a39fd3555d84dac` | 2026-08-14 16:48:03 +08:00 | Azure Container Apps revision `ca-phoenixai-oaprp7dte7bw2--0000005` is healthy and serves the ACR image tagged with this SHA. |
| Local `main` before remote refresh | `bb795c76d9208ace019f940c99e735fd274e3415` | 2026-08-12 18:34:02 +08:00 | The local branch was clean but stale; `origin/main` had advanced to `f050416`. |
| Last commit before the 2026-08-14 change set | `cc20f7f2af8497d240c151b5a75b4cf39b5b4078` | 2026-08-13 13:38:42 +08:00 | Chronologically correct, but its Development deployment failed and therefore it is not the deployed stable baseline. |
| Commit actually deployed before the 2026-08-14 work | `5f065529cdbc6f5bd1f2651aed88a7692ef01f26` | 2026-08-13 00:13:34 +08:00 deployment completion | Demo deployment `5872833852` / workflow run `31615720068` succeeded. ACR retains the image at digest `sha256:84b78705341fad6eae1ad2141a7f6aac03547ff35b078bbd1442e3c8b450f437`. This commit is rejected as the restoration baseline because it had already deleted the required Original `/community/image-check` route. |
| Candidate stable repository baseline | `7298f21ad0f9fd9557a8a3426e5ee0a433a4df64` | 2026-08-10 18:31:29 +08:00 | Existing tag `azure-deployed-2026-08-10`; includes the Container Apps topology and required Original route `/community/image-check`. |
| Candidate application image commit | `a83bb80` | Image built 2026-08-10 17:57:49 +08:00 | ACR retains `retry4-20260810-a83bb80` at digest `sha256:fe5031beba308b7e477ccb28a1eeca2289b23bd1ca904b01772a33eee13584c3`; deployment proof records this as the healthy Original-route revision. |
| Relationship between candidate and deployed app | `a83bb80..7298f21` | 2026-08-10 | Application behavior is unchanged; only `nextjs_space/.dockerignore` and `nextjs_space/Dockerfile` were added for Container Apps packaging. |

No commits were made on 2026-08-15. The commits made on 2026-08-14 are `3b9c8d2`,
`1b5e53d`, and `f050416` plus their pull-request branch commits. The current deployed
commit is the final commit in that sequence. Although `5f065529` is the latest successful
pre-August-14 deployment, route compatibility disqualifies it from satisfying this rollback.

## Changes after the stable baseline

The range `7298f21..f050416` includes:

- promotion and later removal/alteration of application experiences, including removal of
  `/community/image-check` and the 2026-08-14 v2 default landing change;
- HCP data-protection text, Malaysia timestamp work, multi-image/TBSA analysis changes, and
  bilingual clinical-flow changes;
- GitHub OIDC deployment identity documentation and removal of Demo/Development reviewer gates;
- a PostgreSQL template change from the deployed version baseline to a currently supported
  greenfield version, which must not be treated as permission to upgrade the live PostgreSQL 16
  server;
- the ACR Dockerfile path correction that allowed `f050416` to deploy successfully;
- synchronized architecture and Responsible AI documentation for those changes.

## Useful fixes to reapply selectively

- GitHub OIDC authentication and the working ACR Dockerfile path.
- Reviewer-free Demo/Development deployment policy and direct-to-`main` prototype workflow.
- Concise confidentiality, clinical-support, and Malaysian PDPA reminders after language review.
- English/Bahasa Melayu response-language enforcement that applies to Original routes only.
- Proven image validation, retry, timeout, and stream-parsing improvements that reduce intermittent
  image-analysis failures without changing the Original response contract.
- A PostgreSQL lifecycle split that references the existing PostgreSQL 16 server during routine
  deployments and uses a supported version only for explicit greenfield provisioning.

## Rollback risks and controls

- **v2 exposure:** the tagged baseline contains v2 and enables it by default. The restoration must
  route `/` directly to the Original landing and must not publish the `/v2` surface.
- **Infrastructure drift:** reverting all files to the baseline would discard later OIDC and workflow
  corrections. Restore the application surface selectively and retain the current Container Apps
  deployment topology.
- **Database safety:** do not issue a PostgreSQL server update or major-version change. The live
  PostgreSQL 16 service and forward-only migrations must remain intact.
- **Data/schema compatibility:** no database reset, drop, destructive down migration, or clinical
  record deletion is permitted.
- **History preservation:** create and push `backup/pre-rollback-20260815` and
  `pre-rollback-20260815` at `f050416` before changing the application.
- **Route compatibility:** validate the requested Original routes. The deployment-tagged baseline
  contains `/community/image-check`; later commits removed it while retaining
  `/community/assessment`.
- **Branding:** verify `nextjs_space/public/logo.png` remains byte-identical to SHA-256
  `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241` and preserve all KKM/HKL assets.

## Restoration method

1. Create the safety branch and annotated tag at `f050416` and push both to GitHub.
2. Validate `7298f21` in an isolated worktree with install, build, typecheck, automated smoke tests,
   and Original-route browser checks.
3. Create a restoration branch from current `main`, restore the verified Original application files
   from `7298f21`, and exclude/remove v2 exposure.
4. Re-run focused and full validation before committing.
5. Commit as `revert: restore stable Phoenix AI original experience`, then make that commit the new
   `main` without deleting the backup branch, tag, or intervening commits.