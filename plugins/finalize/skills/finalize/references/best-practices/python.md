# Python best-practices

Applies to the changed Python code in `/finalize` Phase 1 (the diff, not the whole repo). Project conventions in CLAUDE.md always override these rules. For concrete tooling config (ruff/mypy/pytest) and worked code examples, see `python-details.md`.

Guiding philosophy (the Zen of Python, applied): explicit over implicit, simple over complex, readable over clever, and *errors should never pass silently*. Prefer functional/immutable over mutable, and `async`/`await` over callbacks.

## Implementation guidelines

### Style & tooling
- Follow PEP 8. Format and lint with **ruff** (it replaces black/isort/flake8); type-check with **mypy** (or pyright). Respect the project's existing `pyproject.toml` config rather than imposing new settings.
- Run mypy in `strict` mode on new code — it forces typed signatures and catches whole classes of bugs before runtime.
- Adopt a broad ruff ruleset (pyflakes, bugbear, comprehensions, pyupgrade, simplify, pathlib, naming…) — see `python-details.md` for a recommended config.

### Naming
- Use **positive** names — `is_enabled`, `is_visible` — not negatives like `is_disabled` that force double-negative reads (`if not is_disabled`).
- Descriptive names without abbreviations (`calculate_total_price`, not `calc_tot`). Code should read like prose.
- Use neutral, inclusive terminology: `allow_list`/`block_list` over `whitelist`/`blacklist`; `primary`/`secondary` (or `replica`) over `master`/`slave`.

### Typing
- Add type hints to all public signatures, including return types — boundary types should be explicit, not inferred.
- Use modern built-in generics (`list[str]`, `dict[str, int]`, `X | None`); avoid the legacy `typing.List`/`Optional[...]` forms on new code (3.10+).
- Use `TypeVar`/`Generic` for reusable containers, `Protocol` for structural typing (duck-typing with a checked shape), `Callable[..., R]` for higher-order functions, and type aliases to name recurring shapes.
- Never use `Any` to silence the checker — reach for `unknown`-style narrowing (`object` + `isinstance`), a precise type, or a `Protocol`.

### Validation at boundaries
- Parse untrusted input (HTTP bodies, config, external APIs) into validated models at the boundary — use **Pydantic** (`BaseModel` + field/`@validator` constraints) or, for lighter needs, `TypedDict`/`@dataclass`. Don't pass raw `dict`s through the codebase: callers lose autocomplete and the shape goes unchecked.

### Idioms
- Prefer EAFP (`try/except`) over LBYL where it reads clearer and avoids check-then-act races.
- Use comprehensions for simple transforms; fall back to explicit loops when a comprehension would hurt readability.
- Use f-strings for formatting — **except in logging calls** (see Logging).
- Use `pathlib.Path` over `os.path` string juggling, and context managers (`with`) for files/locks/connections so they release on every path.

### Errors & exceptions
- Catch **specific** exceptions, never bare `except:` — a bare catch swallows `KeyboardInterrupt`/`SystemExit` and hides real bugs.
- Define a small exception hierarchy with one app base (`class AppError(Exception)`) and meaningful subclasses (`ValidationError`, `NotFoundError`, …) so callers can catch by category.
- Raise meaningful exceptions instead of returning sentinel `None`/`False` that callers forget to check. **Fail fast** with actionable messages (say what was wrong and how to fix it). Never let errors pass silently.

### Logging
- Use the `logging` module, never `print`, for diagnostics.
- Use **lazy `%`-style args**, not f-strings, in log calls: `logger.debug("processing user %s", uid)` — the string is only formatted if that level is enabled. An f-string is built every time, even when the message is discarded.
- Attach structured context with `extra={...}` rather than baking values into the message.

### Async
- `async`/`await` over callbacks. Run independent awaits concurrently with `asyncio.gather(*tasks)` — awaiting them one-by-one in a loop serializes work that could overlap.
- Don't put blocking calls on an async path — they stall the event loop; offload to a thread/process executor.
- Use async context managers (`async with`) and async generators (`async for`) for async resources/streams. Add retry-with-backoff around flaky I/O. See `python-details.md`.

### Functions & data
- Never use mutable default arguments (`def f(x=[])`) — the default is created once and shared across calls; default to `None` and build inside.
- Prefer `@dataclass` (or Pydantic at boundaries) over ad-hoc tuples/dicts for records.
- Keep functions small and single-purpose; a name needing "and" is doing two things.

### Testing (pytest)
- Write atomic, self-contained tests; share setup via `fixtures` (and `conftest.py`).
- Use `@pytest.mark.parametrize` for table-driven cases instead of copy-pasting tests.
- Assert on errors with `pytest.raises(ValueError, match="...")`.
- Set `asyncio_mode = "auto"` so async tests need no per-test marker; use markers (`slow`, `integration`) to categorize; track coverage with `pytest-cov`.

### Project structure & packaging
- Use a `src/` layout with a single `pyproject.toml` for config; expose a `__main__.py` entry point where it makes sense.
- Develop in a virtualenv; pin/lock dependencies for reproducible installs.

### Performance
- Use `set`/`dict` for membership and lookups (O(1)) instead of scanning a `list` (O(n)).
- Use generators / streaming for large data instead of materializing whole files/lists into memory.
- Prefer comprehensions over manual append loops, and `dict.get(key, default)` over `hasattr`/try chains. (Measure before deeper optimization — see `../performance-profiling.md`.)

## Anti-patterns
- `Any` used to silence the type checker, or over-broad `# type: ignore` instead of fixing/scoping the error.
- Mutable default arguments — shared, surprising state across calls.
- Bare `except:` — hides errors and catches signals you shouldn't.
- f-strings inside `logger.*()` calls — formats even when the level is off.
- Returning `None`/`False` sentinels where an exception belongs — silent failure.
- Wildcard `from x import *` — pollutes the namespace and obscures origins.
- `print` debugging left in committed code — use `logging`.
- Module-level mutable global state — hard to test and reason about.
- Deeply nested conditionals — use guard clauses / early returns.
- Negative or abbreviated names; non-inclusive terms (whitelist/blacklist, master/slave).

## Quick checklist
- [ ] Public functions have argument and return type hints; mypy strict passes
- [ ] No `Any` to dodge the checker; `# type: ignore` scoped to a specific code
- [ ] Untrusted input validated at the boundary (Pydantic/dataclass/TypedDict), not raw dicts
- [ ] No mutable default arguments
- [ ] Specific exceptions caught (no bare `except:`); custom hierarchy with an app base; fail-fast messages
- [ ] `logging` with lazy `%`-args (no f-strings in log calls); no leftover `print`
- [ ] Independent awaits run via `asyncio.gather`; no blocking calls on async paths
- [ ] Resources handled via `with` / `async with`; structured data uses dataclass/Pydantic
- [ ] pytest: fixtures + parametrize + `pytest.raises(match=)`; `asyncio_mode=auto`; coverage tracked
- [ ] Positive, descriptive, inclusive names
- [ ] Sets/dicts for lookups; generators for large data; comprehensions over append loops
- [ ] No wildcard imports, no module-level mutable globals; deep nesting flattened
