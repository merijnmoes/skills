# PHP best-practices

Applies to the changed PHP code in `/finalize` Phase 1 (the diff, not the whole repo). Project conventions in CLAUDE.md always override these rules.

## Implementation guidelines

### Style & structure
- Follow PSR-12: 4-space indent, opening brace on the same line for control structures. Run PHP CS Fixer to enforce it.
- Use PSR-4 autoloading — namespaces map to directories, one class per file.
- Name with PascalCase classes, camelCase methods/variables, UPPER_SNAKE_CASE constants.
- Keep classes single-responsibility and under ~200 lines — large classes are a signal to extract collaborators.
- Inject dependencies through the constructor type-hinted against interfaces, not concretes — keeps units testable and decoupled.
- Favor composition over inheritance; use interfaces to decouple callers from implementations.
- Use guard clauses to flatten nesting; extract shared behavior into focused traits; keep helpers inside a namespace, never global.

### Language features (PHP 8+)
- Put `declare(strict_types=1);` at the top of every file — opts into type coercion errors instead of silent casts.
- Add scalar type hints and return types on every function and method.
- Use strict comparison `===`/`!==` everywhere; never `==` — loose comparison has surprising coercion rules.
- Prefer `match` over `switch` for value mapping, with a `default => throw` so unhandled cases fail loudly.
- Use `readonly` properties (and `readonly` classes in 8.2+), constructor property promotion, named arguments, and union/intersection types where they clarify intent.
- Use **enums** (8.1 backed enums) for fixed sets of values instead of class constants or magic strings — they give type safety, exhaustive `match`, and methods on the value, and ORMs can cast columns straight to them.
- Use the **nullsafe operator** `?->` to short-circuit a chain on null instead of nested `if`/`isset` ladders.
- Use the `never` return type for functions that always throw or exit, so the analyzer knows control never returns.
- Prefer first-class callable syntax (`$fn = strlen(...)`) over string callables — refactor-safe and IDE-navigable.

### Tooling & static analysis
- Run a static analyzer — **PHPStan** or **Psalm** — and treat it as a gate. Aim high on new code (PHPStan level `max`/8); for legacy, generate a baseline and ratchet the level up rather than lowering it. Static analysis catches null/type/dead-code bugs PHP's runtime typing won't.
- Express what the analyzer can't infer with PHPDoc generics — `array<int, User>`, array shapes, `@template` — since PHP has no native generics; a bare `array`/`mixed` blinds it.
- Use **Rector** for safe automated upgrades and repetitive refactors (e.g. raising the PHP version target) instead of hand-editing en masse.
- Pick **one** formatter and stick to it — PHP CS Fixer or `phpcs`/`phpcbf` (Laravel: Pint). Two formatters that disagree just thrash the diff.
- Wire these into Composer scripts (`composer analyse`, `composer test`, `composer lint`) and CI so they run on every change, not ad hoc.

### Error handling
- Throw exceptions instead of returning `false`/`null` on failure — errors shouldn't be silently swallowed by callers.
- Have custom exceptions extend `RuntimeException` (runtime conditions) or `LogicException` (programmer errors).
- Use multi-catch union types for related handling; catch `Throwable` only at the top level.
- Register global `set_exception_handler` / `set_error_handler` so nothing escapes unlogged.
- Use `finally` for cleanup that must run regardless of outcome.
- Log through a PSR-3 `LoggerInterface`, not `error_log`/`echo`.
- In production set `display_errors=Off` and `log_errors=On` — never leak stack traces to users.

### Security
- Use PDO prepared statements with bound parameters; never concatenate user input into SQL.
- Hash passwords with `password_hash()` (ARGON2ID or BCRYPT), verify with `password_verify`, and rehash when `password_needs_rehash` returns true.
- Escape output with `htmlspecialchars`/`htmlentities`, or rely on Twig/Blade auto-escaping, to prevent XSS.
- Require CSRF tokens on all state-changing requests.
- Validate input with `filter_var` plus whitelisting — reject by default rather than sanitizing in place.
- Restrict file uploads by MIME type and extension, and store them outside the public web root.
- Set session cookies `httponly`, `secure`, and `samesite`.
- Send security headers: CSP, X-Frame-Options, X-Content-Type-Options.

### Performance
- Stream large datasets with generators (`yield`) instead of building huge in-memory arrays — memory stays flat regardless of row count.
- Enable **opcache** in production (consider preloading) — without it PHP recompiles every file on every request.
- Optimize the autoloader for production: `composer install --no-dev --optimize-autoloader` (or `composer dump-autoload -o`) so class lookups are a flat map, not a filesystem scan.
- Cache expensive computation/queries behind a PSR-6/PSR-16 cache; don't recompute the same result every request.
- Avoid N+1 queries and unbounded result sets — batch/eager-load and paginate (query/index tuning is in `sql.md`; ORM specifics in `postgresql.md` / `laravel.md`).

### Testing
- Test PHP with **PHPUnit** or **Pest**; use data providers for table-driven cases, and test doubles (PHPUnit mocks/Mockery) only at real boundaries. See `../testing.md` for the cross-cutting test-quality rules (behavior over implementation, determinism, no over-mocking).

## Anti-patterns
- Monolithic / god classes — impossible to test or reason about.
- Magic numbers — name them as constants.
- Deep nesting — invert conditions with guard clauses.
- `echo` from service/business code — return data and let the boundary render it.
- `@` error suppression — hides failures you'll never diagnose.
- Empty catch blocks — at minimum log and rethrow.
- Exceptions for normal control flow — they're for exceptional conditions.
- Loose `==` comparison — coercion bugs.
- `switch` for value mapping — use `match`.
- Untyped functions — no type hints, no return type.
- Raw SQL string concatenation — SQL injection.
- Magic strings / class constants where a backed **enum** fits — no type safety, no exhaustiveness.
- No static analyzer in CI — type/null bugs reach runtime.
- Building large arrays in memory instead of `yield`-ing — avoidable memory blowups.
- Two formatters fighting over the same files.

## Quick checklist
- [ ] `declare(strict_types=1);` at top of every changed file
- [ ] All functions/methods have parameter and return types
- [ ] Strict `===` used; no loose `==`
- [ ] Failures throw exceptions, not return `false`/`null`
- [ ] No empty catch blocks or `@` suppression
- [ ] SQL uses PDO prepared statements (no concatenation)
- [ ] Passwords hashed via `password_hash`/`password_verify`
- [ ] Output escaped (or templating auto-escape relied on)
- [ ] Input validated and whitelisted; uploads restricted and stored outside web root
- [ ] PSR-12 clean (one formatter), one class per file, classes under ~200 lines
- [ ] Static analyzer (PHPStan/Psalm) passes at the project's level
- [ ] Enums used for fixed value sets (not magic strings/constants)
- [ ] opcache + optimized autoloader in production; large data streamed via `yield`
- [ ] Tests use PHPUnit/Pest with data providers (see `../testing.md`)
