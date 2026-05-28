# Best-practices router

Phase 1 of `/finalize` loads only the best-practices files relevant to what changed. Match the languages/frameworks detected in Phase 0 (from changed file extensions and manifests) to the files below, then read just those. Loading everything would waste context — progressive disclosure keeps the pass focused.

## Routing table

| If the diff includes… | Load |
|---|---|
| Any backend / business-logic change (any language) | `general-oop.md` |
| `.js`, `.jsx`, `.mjs`, `.cjs` | `javascript.md` |
| `.ts`, `.tsx`, `.mts`, `.cts` | `typescript.md` + `javascript.md` (TS is JS — the patterns & perf rules apply) |
| `.py`, `pyproject.toml`, `requirements.txt` | `python.md` |
| `.php`, `composer.json` | `php.md` |
| Laravel project (`laravel/framework` in `composer.json`, an `artisan` file, `app/Http/...`) | `laravel.md` + `php.md` |
| `.vue`, or Vue in `package.json` deps | `vue.md` + `typescript.md` + `javascript.md` |
| `.sql`, raw queries, query builders (any engine) | `sql.md` |
| PostgreSQL entities/migrations, TypeORM/Prisma, RLS | `postgresql.md` (+ `sql.md` for query tuning) |
| Any UI / markup change (HTML, JSX/TSX, `.vue`, `.svelte`, templates, components, CSS) | `frontend-a11y-i18n.md` |

## Notes

- **`general-oop.md` is the baseline** for any backend change regardless of language — load it alongside the language-specific file.
- **A UI change is also a language change.** A `.vue`/`.tsx`/template edit loads both its language file (e.g. `typescript.md`) and `frontend-a11y-i18n.md` — accessibility and i18n are quality dimensions of any user-facing change.
- **`python.md` points to `python-details.md`** for concrete tooling config (ruff/mypy/pytest) and worked code examples — read that only when you need the exact syntax.
- A change can match several rows (e.g. a NestJS endpoint touching `.ts` + a Prisma migration → `general-oop.md` + `typescript.md` + `postgresql.md`). Load all that apply.
- If the diff's language isn't covered here, apply `general-oop.md` plus the change's surrounding-code conventions, and note that no language-specific reference exists yet.
- **Project conventions (CLAUDE.md / existing style) always win** over these generic rules. When they conflict, follow the project and note the deviation rather than overriding silently.
