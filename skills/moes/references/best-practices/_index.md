# Best-practices router

Phase 1 of `moes` loads only the best-practices files relevant to what changed. Match the languages/frameworks detected in Phase 0 (from changed file extensions and manifests) to the files below, then read just those. Loading everything would waste context — progressive disclosure keeps the pass focused.

## Routing table

| If the diff includes… | Load |
|---|---|
| Any backend / business-logic change (any language) | `general-oop.md` + `clean-coding.md` |
| `.js`, `.jsx`, `.mjs`, `.cjs` | `javascript.md` |
| `.ts`, `.tsx`, `.mts`, `.cts` | `typescript.md` + `javascript.md` (TS is JS — the patterns & perf rules apply) |
| React project (`react` in deps, `.jsx`/`.tsx`, hooks, client components) | `react.md` + `typescript.md`/`javascript.md` as applicable |
| `.py`, `pyproject.toml`, `requirements.txt` | `python.md` |
| FastAPI project (`fastapi` in deps, `FastAPI()` app, routers, Pydantic API schemas) | `fastapi.md` + `python.md` |
| Django / DRF project (`django` / `djangorestframework` in deps, models/views/serializers/viewsets/settings) | `django.md` + `python.md` |
| `.php`, `composer.json` | `php.md` |
| Laravel project (`laravel/framework` in `composer.json`, an `artisan` file, `app/Http/...`) | `laravel.md` + `php.md` |
| `.vue`, or Vue in `package.json` deps | `vue.md` + `typescript.md` + `javascript.md` |
| `.css`, `.scss`, `.sass`, `.less`, CSS modules, substantial component/template style blocks | `css.md` (+ `frontend-a11y-i18n.md` for user-facing UI) |
| `.sql`, raw queries, query builders (any engine) | `sql.md` |
| PostgreSQL entities/migrations, TypeORM/Prisma, RLS | `postgresql.md` (+ `sql.md` for query tuning) |
| `.rs`, `Cargo.toml` | `rust.md` (+ `../async-concurrency-patterns.md` for async/concurrency shapes) |
| `.go`, `go.mod` | `go.md` (+ `../async-concurrency-patterns.md` for concurrency shapes) |
| Python async/concurrency change (`async def`, `await`, `gather`, workers, queues) | `python.md` (+ `../async-concurrency-patterns.md` + `../error-handling-principles.md` for retry/compensation) |
| Supabase project (`@supabase/supabase-js` in deps, a `supabase/` dir, or `auth.uid()`/`auth.*` in SQL/migrations) | `supabase.md` (+ `postgresql.md` + `sql.md`) |
| Any UI / markup change (HTML, JSX/TSX, `.vue`, `.svelte`, templates, components, CSS) | `frontend-a11y-i18n.md` (no dedicated `svelte.md` yet — for `.svelte` apply component principles from `vue.md` + `frontend-a11y-i18n.md` plus surrounding-code conventions) |

## Notes

- **`general-oop.md` and `clean-coding.md` are the backend baseline** for any backend change regardless of language — load both alongside the language-specific file.
- **`../universal-quality.md` is the cross-language smell companion** for Phase 1. Use it for abstraction leaks, flag bloat, stringly typed behavior, redundant writes, and similar issues that are not owned by one language guide.
- **Framework refs layer on the language refs.** `react.md` does not replace `javascript.md`/`typescript.md`; `fastapi.md` and `django.md` do not replace `python.md`.
- **A UI change is also a language change.** A `.vue`/`.tsx`/template edit loads both its language file (e.g. `typescript.md`) and `frontend-a11y-i18n.md` — accessibility and i18n are quality dimensions of any user-facing change.
- **Style diffs can have logic-level quality issues too.** Load `css.md` for maintainability, cascade, responsiveness, and motion discipline; keep `frontend-a11y-i18n.md` for accessibility and localization concerns.
- **`python.md` points to `python-details.md`** for concrete tooling config (ruff/mypy/pytest) and worked code examples — read that only when you need the exact syntax.
- A change can match several rows (e.g. a NestJS endpoint touching `.ts` + a Prisma migration → `general-oop.md` + `clean-coding.md` + `typescript.md` + `postgresql.md`). Load all that apply.
- If the diff's language isn't covered here, and it is a backend/business-logic change, apply `general-oop.md` and `clean-coding.md` plus the change's surrounding-code conventions, and note that no language-specific reference exists yet.
- **The Phase-0 project context capsule and standing project instructions always win** over these generic rules. When they conflict, follow the project and note the deviation rather than overriding silently.
