# Performance profiling

Phase 6 of `big-review`, applied to the changed code in the diff. **Conditional** — run only when the change touches a hot path or performance-sensitive code (see *When to run*). Measure against real-ish data; never optimize on a hunch. Stated targets in the Phase-0 project context capsule or the project's perf budget always win over the guidance here — if they conflict, say so and follow the project.

## When to run

Run when the changed code touches any of:

- A request/render path or anything with a stated latency/throughput budget.
- A loop over large or unbounded data, or DB access inside a loop.
- An algorithm change, or a startup/boot path.

If the change is on a cold path with no perf budget, **skip and say so**. Profiling cold code is wasted effort — most code is not hot, and time spent here is time not spent shipping.

If the changed surface needs framework-specific performance guidance, load
`performance-specialty-router.md` rather than stuffing ecosystem-specific detail
into this generic profiling reference.

## Method: measure first

1. **Baseline** — take a measurement before changing anything, so "faster" is provable, not felt.
2. **Realistic data** — reproduce with production-scale volumes. Perf characteristics flip at scale; a quadratic loop is invisible at n=10 and fatal at n=10000.
3. **Profile to find the ACTUAL bottleneck** — do not guess. Intuition about hot spots is frequently wrong, and you will optimize the wrong thing.
4. **Change the one hot spot** — fix the proven bottleneck, nothing else.
5. **Re-measure** — confirm a real improvement and check for regressions elsewhere (a local win can shift cost downstream).
6. **Stop at budget** — once you hit the target, stop. Further tuning buys complexity, not value.

## What to look for

- **Algorithmic complexity in hot loops** — O(n^2)/quadratic or repeated linear scans. Use a set/map for membership/lookup (O(1) vs O(n)).
- **N+1 and repeated work** — that could be batched, cached, or memoized.
- **Unnecessary allocations / large intermediate collections** — prefer streaming/generators for large data instead of materializing it all.
- **Synchronous or blocking I/O on a hot or async path** — it stalls everything behind it.
- **Oversized payloads and chatty external calls** — fewer, leaner round trips.
- **Missing pagination on unbounded result sets** — bounded queries don't blow up at scale.

## Concrete review cues

Use these only when the changed surface makes them relevant; this file is still
measure-first, not "flag every perf trope on sight."

### Frontend / UI cues

- **Core Web Vitals regressions** — if the change touches first-load content or
  interaction-heavy UI, ask whether it worsens LCP, INP, or CLS.
- **Large lists/tables** — look for rendering every row when pagination or
  virtualization is the established pattern.
- **Image and layout stability** — lazily loading the hero, omitting dimensions,
  or inserting dynamic content without reserved space often hurts first paint
  and layout shift.
- **Bundle and client-work inflation** — a heavy dependency, broad client-only
  boundary, or route that moved server work into the browser can be the real
  regression.
- **Animation cost** — `transition: all`, animating layout properties, giant
  blur/filter/shadow effects, or paint-heavy layers on scroll/hover.

### Backend / API cues

- **N+1 on serialization or list endpoints** — one query for parents, one per
  child, especially after adding related fields.
- **Unbounded endpoints** — no pagination/cap/field filtering on list or search
  responses.
- **Blocking work in async paths** — sync I/O or CPU-heavy work inside request
  loops, async handlers, or event processing.
- **Repeated loop-invariant work** — the same config read/query/parse repeated
  inside a loop or request path.
- **Oversized payloads** — returning whole objects where a few fields would do,
  or fan-out calls when one grouped query/request could answer the same need.

### Memory and lifecycle cues

- **Leaking subscriptions** — listeners, timers, WebSocket/EventSource handles,
  observers, workers, or caches that are created but not torn down.
- **Large retained objects** — closures or module/global caches holding far more
  data than the feature needs.

## Review triage

- **Usually blocking or fix-now**: clear N+1 on a hot endpoint, unbounded large
  list/read path, blocking I/O in async code, obvious layout-jank regression on
  a critical UI, missing cleanup causing a real leak.
- **Important but evidence-led**: bundle growth, cache strategy, response
  compression, virtualization threshold, or image format choices. Escalate these
  when the changed path is actually user-visible or load-bearing, not by habit.

## Tooling by ecosystem

Use a flamegraph wherever the tool offers one — it shows where time actually goes.

| Ecosystem  | Tools |
|------------|-------|
| Python     | `cProfile`, `py-spy`, `timeit`, `memory_profiler` |
| Node/JS    | `node --prof`, `clinic`, `0x`, Chrome DevTools performance panel |
| Databases  | `EXPLAIN ANALYZE` (see `best-practices/sql.md`) |
| Browser    | Lighthouse, DevTools |
| Go         | `pprof` |
| JVM        | async-profiler, JFR |

## Cautions

- **Premature optimization adds complexity and bugs for no measured gain.** Most code is not hot; default to leaving it simple.
- **Readability usually wins over micro-speed** unless the path is proven hot with evidence.
- **Comment non-obvious optimizations** — leave a short note with the measured reason. Otherwise it reads as needless complexity and the next reader "simplifies" it back.
- **Micro-benchmarks can mislead** — measure end-to-end where it matters, not in isolation.

## Quick checklist

- [ ] If the change is on a cold path with no budget, phase is **N/A** — stated and skipped.
- [ ] Baseline measured before changing anything.
- [ ] Reproduced with realistic data volumes.
- [ ] Profiled to find the actual bottleneck (not guessed).
- [ ] Changed the proven hot spot, re-measured, confirmed improvement and no regression.
- [ ] Stopped once the budget was met.
- [ ] Any non-obvious optimization carries a comment explaining the measured why.
- [ ] Project-specific perf targets from the context capsule followed where they differ from this guide.
- [ ] Relevant frontend/backend/lifecycle review cues were considered for the changed surface.
