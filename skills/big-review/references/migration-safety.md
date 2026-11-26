# Migration safety

Phase 4 and Phase 6 support for `big-review`, conditional. Apply when the diff changes schemas, migrations, data backfills, persistence formats, or rollout-sensitive data transforms.

## What to check

- **Reversibility** — the migration can be rolled back, or the irreversibility is explicit and justified.
- **Old/new compatibility** — old app code can tolerate the new schema during rollout, and new code can tolerate partially migrated data where required.
- **Lock and rewrite risk** — large table rewrites, blocking locks, or expensive index builds are understood and acceptable for the deployment context.
- **Backfill safety** — retry behavior, batching, partial progress, and idempotency are considered.
- **Data integrity** — precision, timezone, encoding, nullability, defaults, and enum/state transitions preserve meaning.
- **Operational plan** — sequencing is clear when the change needs multi-step rollout, flagging, or operator action.

## Concrete prompts

- What happens if deployment rolls forward app code before the backfill finishes?
- What happens if the migration stops halfway through?
- Can this run twice safely?
- Which existing rows, nulls, enum values, or malformed historical data break this path?

## Common safe patterns

- Use expand-contract for renames and removals: add the new column/table first, dual-read or dual-write as needed, backfill, cut traffic over, then drop the old shape in a later deploy.
- Create indexes `CONCURRENTLY` where the engine supports it, especially on large PostgreSQL tables where a blocking build would stall writes; on PostgreSQL this cannot run inside a transaction block, and many migration runners wrap migrations in transactions by default.
- Backfill in batches with explicit ordering, checkpoints, and idempotent predicates so retries resume safely instead of rewriting the whole table.
- Keep both old and new data shapes readable during staggered rollout: old code must tolerate extra columns/tables, and new code must tolerate partially migrated rows.

## Common dangerous shortcuts

- Direct rename/drop in one deployment when old and new app versions may run at the same time.
- Full-table backfill in one transaction on a large dataset, especially when it holds locks for a long time or amplifies replica lag.
- Adding a `NOT NULL`, default, or validating constraint without checking historical rows, backfill order, or whether the engine rewrites the table.

## Common blockers

- Destructive schema change with no compatibility or rollback story.
- Backfill/update script that is not safe to retry.
- New constraint/default silently corrupts or truncates existing data.

## Mutability

- Mutability mode: `report-first`

## Output

Fold findings into the Phase-4 punch list and re-check them in Phase 6 if any DB-changing code was exercised.
