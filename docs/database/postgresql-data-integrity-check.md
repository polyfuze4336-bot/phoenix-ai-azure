# PostgreSQL Data Integrity Check

- **Audit date:** 2026-08-16
- **Upgrade comparison:** NOT REQUIRED (no upgrade performed)
- **Read-only baseline:** PASS

The live baseline was captured without selecting clinical record content. Counts are operational
metadata only.

| Table | Exact row count |
| --- | ---: |
| `AnalysisRecord` | 11 |
| `Article` | 0 |
| `Case` | 0 |
| `ChatMessage` | 0 |
| `_prisma_migrations` | 2 |

## Schema Objects

| Object class | Result |
| --- | --- |
| Application schemas | `public` |
| Application tables | 5 |
| Indexes | 11 |
| Sequences | 0 |
| Triggers | 0 |
| User views | 0 |
| User routines | 0 |
| Extensions | `plpgsql 1.0` |
| Finished Prisma migrations | 2 of 2 |

`pg_stat_user_tables.n_live_tup` was also captured, but exact `COUNT(*)` values above are used as
the authoritative baseline because PostgreSQL statistics are approximate. No pre/post-upgrade
comparison or temporary restore was created: PostgreSQL 17.10 requires **NO CHANGE** under the
approved decision rule.