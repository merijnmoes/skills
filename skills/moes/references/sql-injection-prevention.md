# SQL injection prevention

Phase 4 support for `moes`, loaded via `security-cheat-sheets.md` when the diff builds SQL, touches ORM raw paths, migrations, or query helpers. Companion to `best-practices/sql.md` (performance) — this file is the injection half.

## Trigger

Load when the diff contains: string-built SQL, `raw(`, `execute(`, `query(`, `${}` / `%s` / `+` inside SQL strings, ORM `whereRaw` / `extra()` / `RawSQL`, dynamic identifiers (table/column/order-by from input), or migration SQL.

## Rules

1. **Data values are always parameterized.** Never concatenate input into SQL text — use placeholders (`$1`, `%s`, `?`, `:name`) with bound args. Applies to Python, Node, PHP, Go, Java alike.
2. **Identifiers need allow-listing, not escaping.** Table/column/`ORDER BY` direction cannot be bound as values. Validate against a fixed set (`{"name","created_at"}`, `ASC|DESC`) and reject anything else.
3. **ORM safety is not automatic.** These stay dangerous: Django `extra(where=[...])` / `RawSQL`, SQLAlchemy `text()` with f-strings, Prisma `$queryRaw` (use `$queryRaw` with template-tag binding, never string concat), TypeORM `query()` with interpolation, Eloquent `whereRaw` / `DB::raw` with input.
4. **Like/glob wildcards are input too.** Escape `%`/`_` in user-supplied `LIKE` patterns or match semantics change (`%` matches everything).

## Examples

```python
# ❌ Python — f-string into SQL
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")
# ✅
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```

```ts
// ❌ Node — template concat, incl. Prisma raw
db.query(`SELECT * FROM orders WHERE status = '${status}'`)
// ✅ parameterized
db.query(`SELECT * FROM orders WHERE status = $1`, [status])
```

```php
// ❌ PHP — whereRaw with input
User::whereRaw("email = '$email'")->get();
// ✅ binding
User::whereRaw("email = ?", [$email])->get();
```

Dynamic identifier allow-list (any language):

```ts
// ❌
db.query(`SELECT * FROM t ORDER BY ${sortCol} ${sortDir}`)
// ✅
const cols = new Set(["name", "created_at"]);
const dirs = new Set(["ASC", "DESC"]);
if (!cols.has(sortCol) || !dirs.has(sortDir)) throw new Error("bad sort");
db.query(`SELECT * FROM t ORDER BY ${sortCol} ${sortDir}`)
```

## Detection notes

- Grep for `execute|query|whereRaw|RawSQL|extra\(|\$queryRaw|ORDER BY` near changed lines; trace whether any interpolated piece reaches user/external input.
- Second-order counts: stored input later concatenated into SQL is still injection.
- Findings still must pass `findings-lifecycle.md` — quote the unparameterized line + the input path. Parameterized code with no identifier risk is `N/A`, not a finding.
