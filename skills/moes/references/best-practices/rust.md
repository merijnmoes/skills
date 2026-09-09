# Rust best-practices

Applies to the changed Rust code in `moes` Phase 1 (the diff, not the whole crate). The Phase-0 project context capsule and standing project instructions always override these generic rules. For async/concurrency shapes see `../async-concurrency-patterns.md`.

## Implementation guidelines

### Ownership & borrowing
- Prefer borrowing (`&T` / `&mut T`) over cloning in hot paths; `clone()` on `Arc`/`Rc` is cheap, on `Vec`/`String` is not — clone only at ownership boundaries.
- Return owned values from constructors/builders; accept `impl AsRef<str>` / `impl Into<String>` at public APIs only when ergonomics demand it.

### Errors
- Libraries: `thiserror` for typed errors; applications: `anyhow` with `.context()` at the boundary. Never `unwrap()` / `expect()` outside tests and provably-safe init.
- Propagate with `?`; add context at the layer that knows the operation (`with_context(|| format!("load config {}", path.display()))`).

### Unsafe
- Every `unsafe` block needs a `// SAFETY:` comment stating the upheld invariant + a safe wrapper API. No raw-pointer arithmetic without bounds proof in the comment.

### Async
- Never block inside async (no `std::fs`, `std::thread::sleep`, CPU-heavy loops) — use `tokio::fs`, `sleep`, `spawn_blocking`.
- Every spawned task is owned: `JoinSet` / scoped tasks with cancellation via `tokio::select!` + shutdown signal. Unawaited `tokio::spawn` is a leak.

### Concurrency
- Prefer message-passing (`mpsc`, `oneshot`) over shared `Mutex`; keep lock scopes tiny, never hold across `.await`.
- `Send`/`Sync` bounds are part of the API — changing them is a breaking change.

## Anti-patterns
- `unwrap()`/`expect()` in non-test code; `unsafe` without `SAFETY` comment.
- `clone()` to silence the borrow checker in a loop.
- `Mutex` held across `.await`; blocking calls on async paths.
- Stringly-typed errors (`Box<dyn Error>` without context in app code).

## Quick checklist
- [ ] No `unwrap`/`expect` outside tests; errors carry context
- [ ] `unsafe` has `SAFETY` comment + safe wrapper
- [ ] No blocking calls in async; tasks joined/cancelled
- [ ] Locks never held across `.await`
