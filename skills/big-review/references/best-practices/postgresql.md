# PostgreSQL (ORM) best-practices

Applies to the changed entities, migrations, and DB access in `big-review` Phase 1 (the diff, not the whole schema). Targets PostgreSQL behind an ORM (TypeORM or Prisma, common in NestJS-style apps) and layers on `sql.md` for generic query-shape discipline; this file stays focused on PostgreSQL-specific indexing, RLS, queueing, and operational review. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Implementation guidelines

### Patterns & architecture
- Isolate DB access behind the Repository pattern (`@InjectRepository()` / a `PrismaService`) so business logic doesn't embed raw queries — keeps services testable and the data layer swappable.
- Model relations with the ORM's relation properties (e.g. `@ManyToOne` / Prisma relation fields) rather than duplicating raw foreign-key id columns, so the schema and types stay the single source of truth.

### Migrations (strict)
- NEVER set `synchronize: true` in production. It auto-alters the schema to match entities and can silently drop columns or tables — and the data in them.
- Generate migrations from entity changes: edit the `*.entity.ts` (or Prisma schema), then run `migration:generate`. Hand-writing migrations invites drift between the schema the code expects and the schema that exists.
- For destructive or zero-downtime changes use Expand–Contract: Add the new column/table → backfill data → switch reads then writes to it → drop the old one in a later release. Never rename/drop-and-recreate in a single deploy that an old app version could still hit.
- Write Row-Level Security (RLS) policies as raw SQL via `queryRunner.query()` inside the migration — the generator can't detect policies from entities, so they won't appear unless you add them by hand.

### Performance & gotchas
- Pagination is mandatory on list endpoints (limit/offset or, preferably, cursor) — an unbounded list grows unbounded and eventually times out or OOMs.
- Define indexes in code (`@Index` / Prisma `@@index`) for frequently-filtered columns so they ship with the migration, not as manual prod tweaks.
- Columns used in RLS predicates MUST be indexed. RLS adds an implicit `WHERE` to every query against the table, so an unindexed predicate column turns every read into a scan.
- Wrap multi-step mutations in a transaction (`QueryRunner` / Prisma `$transaction`) so a partial failure rolls back instead of leaving half-written, inconsistent state.

### Index selection heuristics
- Prefer B-tree indexes for equality, range, ordering, and most join predicates; they are the default for a reason.
- Use partial indexes when the hot path targets a stable subset such as `deleted_at IS NULL` or `status = 'active'`; smaller indexes are cheaper to maintain and often more selective.
- Use covering indexes (`INCLUDE`) for read-heavy queries that project only a few extra columns beyond the filter/sort keys.
- Use GIN for containment and membership queries on JSONB, arrays, and full-text search; don't reach for it for ordinary scalar equality.
- Use BRIN on very large append-mostly tables, especially time-series/event data where physical row order roughly matches the filter column.

### Operational review prompts
- Are queue consumers using `FOR UPDATE SKIP LOCKED` where concurrent workers should claim work without blocking each other?
- Are `statement_timeout`, `lock_timeout`, and `idle_in_transaction_session_timeout` expectations explicit and consistent with the workload?
- Are slow-query, index-usage, and bloat signals visible through `pg_stat_statements` or an equivalent monitoring stack?
- Does the change create long transactions, large autovacuum debt, or index bloat risk that needs rollout guidance?

## Anti-patterns
- `synchronize: true` in production — can silently drop data.
- N+1 queries — use query builders or eager/`include` relations instead of one query per parent row.
- Heavy joins inside RLS policies — they run on every query; keep RLS predicates simple and push complexity to a query or view layer.
- Unindexed RLS predicate columns — every access becomes a scan.
- Unpaginated list queries — unbounded result sets.
- Multi-step writes without a transaction — partial failures corrupt state.
- Hand-written schema migrations that drift from the entities.
- Queue workers that `SELECT` then `UPDATE` the same job row without `SKIP LOCKED` or another safe claim pattern.
- Missing visibility into `pg_stat_statements`, timeouts, or bloat on workloads where performance regressions would be operationally expensive.

## Quick checklist
- [ ] No `synchronize: true` on any production path
- [ ] Migration generated from entity/schema changes, not hand-edited drift
- [ ] Destructive/zero-downtime changes use Expand–Contract
- [ ] RLS policies added as raw SQL in the migration
- [ ] RLS predicate columns are indexed
- [ ] Frequently-filtered columns have `@Index` / `@@index` in code
- [ ] Index type matches the query shape (B-tree vs partial vs covering vs GIN vs BRIN)
- [ ] DB access goes through the repository/service layer, not inline raw queries
- [ ] Relations modeled via relation properties, not duplicated FK id columns
- [ ] List endpoints are paginated
- [ ] Multi-step mutations run inside a transaction
- [ ] No N+1 access patterns (eager/`include` or query builder used)
- [ ] Queue consumers use `FOR UPDATE SKIP LOCKED` or another safe concurrent-claim pattern where applicable
- [ ] `pg_stat_statements` or equivalent monitoring covers slow queries and index/bloat regressions
- [ ] `statement_timeout`, `lock_timeout`, and `idle_in_transaction_session_timeout` expectations fit the workload
