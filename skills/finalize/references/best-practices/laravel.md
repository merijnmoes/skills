# Laravel best-practices

Loaded in `/finalize` Phase 1 when the diff lives in a Laravel project. Layers on top of `php.md` — every generic PHP rule (PSR-12, `declare(strict_types=1)`, typing, prepared statements, password hashing) still applies; this file adds only the Laravel-specific guidance. Applies to the changed code in the diff, not the whole app. Project conventions in CLAUDE.md always override these rules.

## Architecture & layering
- Keep controllers thin — a controller method coordinates request → service → response, nothing more. Delegate business logic to a service class or a single-purpose action / invokable class so it's reusable and unit-testable in isolation.
- Keep logic out of Blade templates and out of models where it doesn't belong — models own persistence and relations, not workflow orchestration.
- Follow Laravel naming conventions so the framework's auto-resolution works: plural `snake_case` tables, singular `StudlyCase` models, `camelCase` relationship methods. Use `php artisan make:*` generators rather than hand-rolling files — they place and name things conventionally.

## Idiomatic simplifications
Reach for the framework's idioms instead of hand-rolled equivalents — they're shorter, conventional, and what the next Laravel dev expects. Apply these in the Phase 2 simplify spirit: only where they make the changed code clearer, never at the cost of readability.
- **Route model binding**: type-hint `User $user` in the route/controller and let Laravel resolve it (and 404) automatically, instead of `User::findOrFail($id)` in the body.
- **`findOrFail` / `firstOrFail`** over a manual fetch-then-`if (! $x) abort(404)`.
- **Collection pipelines** (`->map()->filter()->groupBy()->pluck()`) over manual `foreach`-and-accumulate loops.
- **Conditional query clauses** (`->when($filter, fn ($q) => $q->where(...))`) over wrapping `where()` in an `if`.
- Avoid nested ternaries — use `match` (also in `php.md`).

## Eloquent & the database
- **N+1 queries are the headline issue.** Eager-load relations with `with()` (query time) or `load()` (on a loaded model) instead of accessing them inside a loop. In dev, enable `Model::preventLazyLoading()` so lazy loads throw and surface N+1 early; use Laravel Debugbar or Telescope to watch query counts on changed endpoints.
- For large result sets use `chunk()` / `chunkById()`, `cursor()`, or lazy collections — never hydrate an unbounded table into memory at once.
- Select only the columns you need rather than `SELECT *`.
- Put reusable query constraints in query scopes instead of duplicating `where()` chains.
- Wrap multi-step writes in `DB::transaction()` so a partial failure rolls back instead of leaving inconsistent state.
- Guard mass assignment with `$fillable` (allowlist) or `$guarded` — never accept arbitrary request keys into `create()`/`update()`.
- Cast attributes via `$casts` (including native enum casts) rather than converting by hand in accessors.
- Index frequently-filtered columns in the migration that adds them (→ `sql.md` / `postgresql.md` for index strategy). Never edit the schema outside a migration — direct DDL drifts from what the code expects.

## Validation & requests
- Validate with a `FormRequest` class (`rules()` + `authorize()`), not inline `$request->validate()` in a fat controller — it keeps rules reusable and the controller thin.
- Consume `$request->validated()`, never raw `$request->input()` / `$request->all()`, so only validated data reaches your logic.
- Centralize authorization in the FormRequest's `authorize()` or in a policy — not ad-hoc `if` checks scattered through the action.

## Services, DI & the container
- Prefer constructor injection; bind interfaces to implementations in a service provider and depend on the abstraction. This is what makes the unit swappable and testable.
- Avoid reaching for facades, `app()`, or global helpers inside domain/service logic — they hide dependencies and force container bootstrapping in tests. Facades are fine at the edges (controllers, providers, console commands).
- Use single-action (invokable) controllers for complex endpoints to keep one class = one responsibility.

## Security
- Blade `{{ }}` auto-escapes output. Never render user-supplied data through `{!! !!}` — that's a direct XSS hole. Reserve `{!! !!}` for trusted, already-sanitized HTML.
- CSRF protection is automatic for web routes — keep `@csrf` in forms and don't disable the middleware casually.
- Authorize with Policies / Gates, not ad-hoc role checks.
- Hash with `Hash::make` / `Hash::check`; use signed URLs (`URL::signedRoute`) and route rate limiting (`throttle`) where appropriate.
- **Never call `env()` outside config files.** Once `php artisan config:cache` runs in production, `env()` returns `null` everywhere except config. Read configuration through `config()` and define the `env()` lookup once in a config file.
- Keep secrets in `.env`, never committed; reference them only via `config()`.

## Performance, caching & queues
- In production, build the framework caches: `config:cache`, `route:cache`, `view:cache`, and `event:cache`. (Generic PHP perf — opcache, optimized Composer autoloader — lives in `php.md`.)
- Cache expensive computations and queries with `Cache::remember`, backed by Redis where available.
- **Offload slow work to queued jobs** — email, exports, third-party API calls, image processing must not run synchronously in the request lifecycle. Dispatch a job and return fast.
- Eager-load to eliminate N+1 (see Eloquent above) — the single biggest request-time win.

## Tooling
- Format with **Laravel Pint** (the official PHP CS Fixer wrapper) — it encodes the framework's style preset.
- Run **Larastan** (PHPStan for Laravel) for static analysis; it understands magic methods, facades, and relations that vanilla PHPStan flags wrongly.
- Use `php artisan` generators to stay conventional.

## Testing
- Use Pest or PHPUnit with feature + unit tests.
- Build test data with model factories and the `RefreshDatabase` trait so each test starts from a known schema and state.
- Exercise endpoints through HTTP test helpers — `$this->get/post(...)`, then `assertStatus`, `assertJson`, etc.
- Fake boundaries instead of hitting real services: `Mail::fake()`, `Queue::fake()`, `Event::fake()`, `Http::fake()`.
- For cross-cutting test-quality rules (behavior over implementation, determinism, no over-mocking) see `../testing.md`.

## Anti-patterns
- Fat controllers carrying business logic instead of delegating to services/actions.
- N+1 queries / missing eager loading.
- Business logic or queries inside Blade templates.
- `env()` outside config files — returns `null` after `config:cache`.
- `{!! !!}` with user-supplied input — XSS.
- Mass assignment without `$fillable` / `$guarded`.
- Doing slow work synchronously in the request instead of queueing it.
- Querying inside loops.
- Skipping FormRequest and validating ad-hoc in the controller.
- Facades / `app()` buried in domain logic — untestable, hidden dependencies.

## Quick checklist
- [ ] Controllers thin; business logic in services/actions
- [ ] Relations eager-loaded; no N+1 on changed endpoints
- [ ] Input validated via FormRequest; `validated()` consumed, not raw input
- [ ] Multi-step writes wrapped in `DB::transaction()`
- [ ] Mass assignment guarded with `$fillable` / `$guarded`
- [ ] No `env()` outside config files
- [ ] `{!! !!}` used only with trusted/sanitized data
- [ ] Slow work dispatched to queued jobs
- [ ] Large result sets use `chunk`/`cursor`/lazy, not full hydration
- [ ] Authorization via policies/gates or FormRequest `authorize()`
- [ ] Production caches built (`config`/`route`/`view`/`event`)
- [ ] Pint and Larastan clean on the diff
- [ ] Tests use factories + `RefreshDatabase`; boundaries faked
