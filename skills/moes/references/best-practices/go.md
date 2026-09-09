# Go best-practices

Applies to the changed Go code in `moes` Phase 1 (the diff, not the whole module). The Phase-0 project context capsule and standing project instructions always override these generic rules. For async/concurrency shapes see `../async-concurrency-patterns.md`.

## Implementation guidelines

### Errors
- Return `error` as the last value; wrap with `%w` at the layer adding context (`fmt.Errorf("save order %s: %w", id, err)`). Never discard with `_ =`.
- Sentinel errors via `var ErrX = errors.New(...)` + `errors.Is/As` at call sites; one app-level分类 per domain, not string matching.

### Concurrency
- Every `go func` is owned: `errgroup.Group`, `sync.WaitGroup` + cancellation via `context.Context`. Unscoped `go` without ctx is a leak.
- Propagate `ctx` as the first arg through I/O and workers; respect `ctx.Done()` in loops/selects.
- Channels: owner closes, bounded size or explicit justification; `select` with `default` only when drop is intended and logged.

### Interfaces & structure
- Accept interfaces, return structs. Small interfaces (`io.Reader`, one-method domain interfaces) at the consumer side.
- No global mutable state; pass deps via struct fields / constructors. `init()` only for registration, never for I/O.

### Resources
- Every `Open`/`Acquire` pairs with `defer Close/Release` on the same screen. No file/socket/row leaks on error paths.
- Timeouts on every external call (`http.Client{Timeout}`, `context.WithTimeout`); retries need backoff + idempotency key per `../error-handling-principles.md`.

## Anti-patterns
- `_ = doThing()` discarding errors; `panic` outside truly-unrecoverable init.
- Goroutine without context/ownership; channel without closer/size reasoning.
- `interface{}` / `any` where a concrete type or small interface fits.
- `time.Sleep` for coordination instead of channels/conditions.

## Quick checklist
- [ ] All errors handled/wrapped with `%w`; no `_ =` on fallible calls
- [ ] Goroutines owned + ctx-propagated + joined/cancelled
- [ ] Resources closed via `defer`; external calls have timeouts
- [ ] Interfaces small and consumer-side; no global mutable state
