# Code review (correctness)

Independent correctness review of the **diff only**, dispatched to a fresh-context subagent. You are checking that the change does what it should and breaks nothing reachable — not style (Phases 1–2 own that) and not structure (`refactoring.md` owns that). Read surrounding code only to understand the change; never review untouched neighbors.

## What to check

- **Logic & control flow** — off-by-one, inverted conditionals, wrong boolean operators, incorrect loop bounds, missing or duplicated `switch`/match cases.
- **Edge & boundary conditions** — empty / single / maximal inputs, zero and negative numbers, very large values, unicode/multibyte strings, timezone/DST and locale edges, first/last iteration.
- **Error & failure paths** — unhandled exceptions, errors swallowed silently, partial failure leaving inconsistent state, fail-open where it should fail-closed, missing rollback/cleanup on the error branch.
- **Null / undefined / optional** — unchecked dereferences, optional values assumed present, default-value gaps, `0`/`""`/`false` mistaken for "absent".
- **Concurrency & ordering** — race conditions, non-atomic read-modify-write, shared mutable state without synchronisation, async/await ordering bugs, assumptions about callback/event order.
- **Resource management** — leaked file handles, DB connections, sockets, timers, listeners or subscriptions; missing close/dispose on every path including errors.
- **API & contract misuse** — wrong argument order, ignored return values/error codes, misread library semantics, deprecated calls. When unsure an API is current and used as maintainers intend, check the docs (Context7 if available) rather than trusting memory.
- **State & data** — incorrect mutation of shared/aliased objects, stale caches, broken invariants, lost updates.
- **Type-boundary correctness** — unchecked casts, parse/serialize round-trip edges, numeric precision/overflow, implicit coercion.
- **Dead / unreachable code** introduced by the change.

## Output

Consolidate into the Phase-4 punch list. Before anything blocks, run it through `finding-verification.md`: it needs a concrete, reachable trigger (a real input or sequence that reaches the bug), known false-positive classes are downgraded, and any framework/library claim is checked against docs. Label each surviving finding with **severity** and **confidence**, and order by business impact.
