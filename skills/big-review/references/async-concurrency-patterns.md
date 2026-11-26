# Async & concurrency patterns

Phase 1 / Phase 4 companion to `bug-hunting.md` (races) and `error-handling-review.md` (retry). Load when the diff adds `async/await`, threads, workers, queues, channels, locks, `Promise.all`, `asyncio.gather`, goroutines, or shared mutable state.

## Rules

1. **Await what you start; join what you spawn.** Fire-and-forget without ownership (unawaited promise, unjoined thread/goroutine, unscoped `go func`) leaks work and swallows errors. Structured concurrency only.
2. **Overlap independent I/O, serialize dependent writes.** `Promise.all` / `asyncio.gather` for independent fetches; never parallelize two writers to the same row without ordering/locking.
3. **No blocking calls on async paths.** Sync I/O / sleep / CPU-heavy loops on the event loop stall everything — offload to executor/worker or make it async.
4. **Shared state needs one owner or one lock.** Check-then-act (`if (!cache.has(k)) cache.set(k, await load())`) races under concurrency — use singleflight/mutex/atomic compare-and-set/transaction.
5. **Cancellation and timeouts are required on every wait.** Every `await` on external I/O gets a timeout; every worker honors cancellation; every channel/queue has a bounded size or an explicit unbounded justification.
6. **Ordering and delivery are explicit.** Duplicate/out-of-order/crash-restart behavior stated for queues, webhooks, consumers — at-least-once + idempotent handler, or exactly-once proof.

## Examples

```ts
// ❌ fire-and-forget, error swallowed
items.forEach(i => process(i));
// ✅ owned concurrency with cap
await pMap(items, process, { concurrency: 5 });
```

```python
# ❌ check-then-act race
if key not in cache: cache[key] = await load(key)
# ✅ singleflight / lock
async with locks[key]: 
    if key not in cache: cache[key] = await load(key)
```

```go
// ❌ unscoped goroutine, no cancellation
go process(order)
// ✅ context-bound
g.Go(func() error { return process(ctx, order) })
```

## Detection notes

- Grep for `go func|Promise\.all|gather\(|asyncio|thread|mutex|lock|channel|queue|setTimeout|setInterval` in the diff; map each spawn to its join/cancel/timeout.
- Race findings need the interleaving from `bug-hunting.md` (two operations + shared state + ordering that breaks). No shared state, no race — `N/A`.
