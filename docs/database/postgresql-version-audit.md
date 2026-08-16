# PostgreSQL Version Audit

- **Audit date:** 2026-08-16
- **Evidence:** Read-only GitHub OIDC audit run
  [31944207967](https://github.com/polyfuze4336-bot/phoenix-ai-azure/actions/runs/31944207967)
- **Audit identity:** Existing `github-phoenixai-deploy` workload identity
- **Mutation performed:** None

## Deployed Server

| Property | Actual value |
| --- | --- |
| Subscription | `BFG Solutions-JDNAINexus` |
| Subscription ID | `376a2984-f8d4-46e3-a1cb-90f58274d2dc` |
| Tenant ID | `3af31ffe-d912-43eb-97c8-07dfa638bc0f` |
| Resource group | `rg-phoenixai-bfgs-demo` |
| Server | `psql-phoenixai-oaprp7dte7bw2` |
| Region / availability zone | East US 2 / zone 1 |
| Azure state | Ready |
| PostgreSQL major version | 17 |
| PostgreSQL minor version | 17.10 |
| SKU | `Standard_B1ms` / Burstable |
| Storage | 32 GiB, autogrow enabled |
| Application database | `phoenix` (UTF8, `en_US.utf8`) |
| Database size at audit | 8062 kB |
| High availability | Disabled (`NotEnabled`) |
| Backup retention | 7 days |
| Earliest PITR restore time reported | `2026-08-09T15:11:50.036788+00:00` |
| Geo-redundant backup | Disabled |
| Public network access | Enabled |
| Active endpoint | `psql-phoenixai-oaprp7dte7bw2.postgres.database.azure.com:5432/phoenix` |

The deployed Container App `ca-phoenixai-oaprp7dte7bw2` uses the `database-url` secret reference.
Its active revision at audit time was `ca-phoenixai-oaprp7dte7bw2--14434ce-3-1`. The secret value was
not printed or stored in documentation.

## SQL Verification

Both required SQL checks ran against the endpoint used by the application:

```sql
SELECT version();
SHOW server_version;
```

They returned PostgreSQL `17.10` (`x86_64-pc-linux-gnu`, 64-bit). Installed extensions:

| Extension | Version |
| --- | --- |
| `plpgsql` | `1.0` |

## Decision

**PostgreSQL is already on an acceptable current major version. No upgrade required.**

Per the project decision rule, PostgreSQL 17 must not be upgraded or recreated. No PITR test server,
major-version precheck, in-place upgrade, application write freeze, or Bicep version change was
performed. Azure reports a usable PITR window, but a restore exercise is not required when no major
upgrade is attempted.

## Access Note

Local Azure CLI user authentication was blocked by tenant Conditional Access error `530035` because
the Windows device is unregistered. The audit therefore used the already-authorized GitHub OIDC
workload identity and explicitly failed unless Azure selected subscription
`376a2984-f8d4-46e3-a1cb-90f58274d2dc`. This did not weaken or bypass Conditional Access.