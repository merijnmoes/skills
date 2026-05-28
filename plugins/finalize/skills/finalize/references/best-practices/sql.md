# SQL best-practices

Applies to the changed SQL queries and indexes in `/finalize` Phase 1 (the diff, not the whole schema). Engine-agnostic (MySQL, PostgreSQL, SQL Server, Oracle). Project conventions in CLAUDE.md always override these rules.

## Implementation guidelines

### Methodology
- Optimize in order: identify the slow query → read its execution plan (`EXPLAIN` / `EXPLAIN ANALYZE`) → change the query or indexes → re-test → monitor.
- Confirm every improvement against realistic data volumes, not a handful of toy rows — plans flip once tables are large, so a "faster" query on 10 rows means nothing.

### Query structure
- Never `SELECT *` — list only the columns you need. It cuts I/O and lets covering indexes satisfy the query without touching the table.
- Prefer `INNER JOIN` over `LEFT JOIN` when the semantics allow — an outer join the planner can't reduce blocks join reordering and forces extra rows.
- Push filters into the `JOIN`/`WHERE` as early as possible so rows are eliminated before they're joined or aggregated.
- Don't wrap an indexed column in a function in `WHERE` (`WHERE UPPER(name) = ...`, `WHERE DATE(ts) = ...`) — it makes the predicate non-sargable and disables the index. Rewrite the predicate instead (range bounds, computed/expression index, or store the derived value).

### Index strategy
- Index columns that are frequently filtered or joined on.
- Order composite-index columns by usage: equality/most-selective and leftmost-used columns first, so the index serves the widest set of queries.
- Use covering / `INCLUDE` indexes so the query is answered from the index alone, avoiding a table lookup per row.
- Use partial/filtered indexes when queries only ever touch a selective subset (e.g. `WHERE status = 'active'`) — smaller index, cheaper to maintain.
- Don't over-index. Every index must be written and kept in sync on each insert/update/delete, so unused indexes are pure write cost.

### Query patterns
- Eliminate N+1 query loops — batch with a single `JOIN`, an `IN (...)` set, or eager-loading instead of one query per row.
- Use keyset/cursor pagination (`WHERE id > :last ORDER BY id LIMIT n`) instead of large `OFFSET`, which scans and discards every skipped row.
- Use conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) instead of firing multiple `COUNT` queries over the same table.
- Use window functions instead of correlated subqueries — the engine computes them in one pass rather than re-running the inner query per row.
- Prefer `UNION ALL` over a complex multi-branch `OR` when branches are disjoint; `OR` across different columns often defeats index use, and `UNION ALL` skips the dedupe sort.
- Batch inserts into a single multi-row statement rather than one round-trip per row.
- Use temp tables to stage intermediate results in complex multi-step work so the planner has fresh stats and you avoid recomputing.
- Always use prepared/parameterized statements — they enable plan reuse and prevent SQL injection.

### Verifying performance
- Read the execution plan and confirm indexes are used (no unexpected full scans, no large filter-discard steps).
- Monitor query time over time, not just once — regressions show up as data grows.
- Alert on slow queries so regressions surface in production before users do.

## Anti-patterns
- `SELECT *` — extra I/O and defeats covering indexes.
- N+1 query loops — one round-trip per row; batch or join instead.
- Functions on indexed columns in `WHERE` — non-sargable, index ignored.
- Large `OFFSET` pagination — scans and throws away every skipped row.
- Multiple `COUNT` round-trips for related tallies — use conditional aggregation.
- Over-indexing — unused indexes only add write overhead.
- String-concatenated (non-parameterized) queries — injection risk and no plan reuse.

## Quick checklist
- [ ] Execution plan checked (`EXPLAIN`/`EXPLAIN ANALYZE`) against realistic data
- [ ] No `SELECT *`; only needed columns listed
- [ ] `INNER JOIN` used where semantics allow; filters pushed down early
- [ ] No functions wrapping indexed columns in `WHERE`
- [ ] New/changed filter & join columns are indexed; composite order is correct
- [ ] No N+1 loops (batched/joined/eager-loaded)
- [ ] Keyset/cursor pagination instead of large `OFFSET`
- [ ] Window functions / conditional aggregation over correlated subqueries and repeat `COUNT`s
- [ ] Queries are parameterized, not string-concatenated
- [ ] No redundant/unused indexes added
