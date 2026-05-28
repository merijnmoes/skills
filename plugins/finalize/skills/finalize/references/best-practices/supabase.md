# Supabase (Postgres) best-practices

Loaded in `/finalize` Phase 1 for Supabase projects. **Layers on `postgresql.md` and `sql.md`** — those cover generic indexing, N+1, `EXPLAIN`, pagination, transactions, and migration discipline, which all still apply. This file adds only the Supabase-specific RLS / auth / roles / pooling layer. Project conventions in CLAUDE.md always win.

## Row-Level Security & auth
- Enable RLS on **every** table exposed through the API. An un-RLS'd table reachable by the `anon`/`authenticated` role is a public read/write hole — this is the most common Supabase security mistake.
- **Wrap auth/config calls in a subquery** so the planner evaluates them once per query (init-plan cache) instead of once per row: write `using ( (select auth.uid()) = user_id )`, not `using ( auth.uid() = user_id )`. On a large table this is an orders-of-magnitude difference.
- Scope each policy to the role it's for — `create policy ... to authenticated using (...)` — so it isn't evaluated for `anon` and vice-versa.
- **Index the columns referenced in RLS predicates** (e.g. `user_id`). RLS adds an implicit `WHERE` to every query against the table, so an unindexed predicate column turns every access into a scan (also flagged in `postgresql.md`).
- Keep policy predicates simple. Push complex authorization into a `SECURITY DEFINER` helper function rather than a heavy join inside the policy itself.

## SECURITY DEFINER functions
- For privileged or complex checks, use a `SECURITY DEFINER` function — but lock it down: set `search_path = ''` and fully-qualify every object (prevents search-path hijacking), keep it in a private schema, and `revoke execute on function ... from public, anon, authenticated`, granting only where actually needed.
- Default to `SECURITY INVOKER` (respects the caller's RLS); reach for `DEFINER` only when you deliberately need to bypass RLS, and treat each one as a security-sensitive surface.

## Roles & keys
- Know the role model: **`anon`** (unauthenticated), **`authenticated`** (logged-in user), **`service_role`** (bypasses RLS — server-side only).
- **Never ship the `service_role` key to the browser/client** — it bypasses RLS entirely. It belongs only in trusted server/edge environments. A `service_role` key in client code or committed to the repo is a hard stop (ties to `../dependency-audit.md` and the secret scan).
- Treat the `anon` key as public — security must come from RLS, not from the key being secret.

## Connection pooling
- Match the pooler mode to the workload: **transaction mode** (PgBouncer) for serverless/edge functions (many short-lived connections), **session mode** when you need session features.
- Prepared statements and `SET`/session state don't survive transaction-mode pooling — don't rely on them there.

## Migrations & schema
- Manage schema through Supabase migrations (versioned SQL), not ad-hoc dashboard edits, so environments stay reproducible (generic migration discipline — including expand-contract for destructive changes — is in `postgresql.md`).

## Anti-patterns
- A table exposed to the API without RLS enabled.
- `auth.uid()` unwrapped in a policy (per-row evaluation).
- The `service_role` key in client code or committed to the repo.
- Unindexed RLS predicate columns.
- `SECURITY DEFINER` without `search_path = ''` and locked-down execute grants.
- Relying on prepared statements / session state under transaction-mode pooling.

## Quick checklist
- [ ] RLS enabled on every API-exposed table
- [ ] RLS auth calls wrapped as `(select auth.uid())` and scoped `to authenticated`
- [ ] RLS predicate columns are indexed
- [ ] `SECURITY DEFINER` funcs set `search_path = ''`, live in a private schema, execute revoked from anon/public
- [ ] `service_role` key never client-side or committed; `anon` key treated as public
- [ ] Pooler mode matches usage (transaction for serverless; no prepared-statement reliance there)
- [ ] Schema changes go through migrations, not the dashboard
