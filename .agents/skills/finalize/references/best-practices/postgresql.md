# PostgreSQL (ORM) best-practices

Applies to the changed entities, migrations, and DB access in `/finalize` Phase 1 (the diff, not the whole schema). Targets PostgreSQL behind an ORM (TypeORM or Prisma, common in NestJS-style apps). Project conventions in CLAUDE.md always override these rules. For generic query/index tuning see `sql.md`; this file adds the Postgres + ORM specifics.

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

## Anti-patterns
- `synchronize: true` in production — can silently drop data.
- N+1 queries — use query builders or eager/`include` relations instead of one query per parent row.
- Heavy joins inside RLS policies — they run on every query; keep RLS predicates simple and push complexity to a query or view layer.
- Unindexed RLS predicate columns — every access becomes a scan.
- Unpaginated list queries — unbounded result sets.
- Multi-step writes without a transaction — partial failures corrupt state.
- Hand-written schema migrations that drift from the entities.

## Quick checklist
- [ ] No `synchronize: true` on any production path
- [ ] Migration generated from entity/schema changes, not hand-edited drift
- [ ] Destructive/zero-downtime changes use Expand–Contract
- [ ] RLS policies added as raw SQL in the migration
- [ ] RLS predicate columns are indexed
- [ ] Frequently-filtered columns have `@Index` / `@@index` in code
- [ ] DB access goes through the repository/service layer, not inline raw queries
- [ ] Relations modeled via relation properties, not duplicated FK id columns
- [ ] List endpoints are paginated
- [ ] Multi-step mutations run inside a transaction
- [ ] No N+1 access patterns (eager/`include` or query builder used)
