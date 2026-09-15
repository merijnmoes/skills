# Code review (correctness)

Independent correctness review of the **diff only**, dispatched to a
fresh-context subagent. You are checking that the change does what it should
and breaks nothing reachable — not style (Phases 1-2 own that) and not
structure (`refactoring.md` owns that). Start with a fast sweep from
`common-bugs-checklist.md` and `universal-quality.md` (including the Fowler smell baseline appendix when the repo documents no coding standards), then do the deeper pass
below. Read surrounding code only to understand the change; never review
untouched neighbors.

The correctness review is split into four procedural walks that are
complementary by how they walk the diff, not by bug taxonomy. A lane owns its
walk; do not re-walk another lane's territory:

- **C1 line-walk**: walk every hunk plus its enclosing function. Wrong
  conditions, off-by-one, missing `await`, edge cases, race conditions.
- **C2 removed-behavior**: walk every deleted or replaced line. Name the
  invariant it enforced and hunt for where the new code re-establishes it —
  including removed exports, whose replacement often lives in another file
  and quietly changed a default.
- **C3 cross-file tracer**: walk every changed symbol's callers (consumer direction) and every added field's read sites (producer direction), plus same-PR callee changes.
- **C4 language-pitfall**: pattern-match every hunk against the classic-footgun
  checklist for the diff's language (`==` coercion, falsy-value traps,
  loop-variable capture, mutable defaults, nil-map writes, SQL concatenation,
  DST arithmetic).

## Rationalizations to reject
- **"This pattern looks dangerous, so it must be a bug."** Pattern recognition
  is only a starting point. Findings need a concrete, reachable trigger.
- **"The code feels wrong."** Name the failing input, sequence, contract, or
  invariant. Vague unease is not a blocker.
- **"The docs probably say this API is wrong."** If a framework or library
  claim matters to the finding, verify it against current docs rather than
  guessing from memory.

## What to check

- **Logic & control flow** — off-by-one, inverted conditionals, wrong boolean operators, incorrect loop bounds, missing or duplicated `switch`/match cases.
- **Edge & boundary conditions** — empty / single / maximal inputs, zero and negative numbers, very large values, unicode/multibyte strings, timezone/DST and locale edges, first/last iteration.
- **Error & failure paths** — unhandled exceptions, errors swallowed silently, partial failure leaving inconsistent state, fail-open where it should fail-closed, missing rollback/cleanup on the error branch.
- **Null / undefined / optional** — unchecked dereferences, optional values assumed present, default-value gaps, `0`/`""`/`false` mistaken for "absent".
- **Concurrency & ordering** — race conditions, non-atomic read-modify-write, shared mutable state without synchronisation, async/await ordering bugs, assumptions about callback/event order.
- **Resource management** — leaked file handles, DB connections, sockets, timers, listeners or subscriptions; missing close/dispose on every path including errors.
- **API & contract misuse** — wrong argument order, ignored return values/error codes, misread library semantics, deprecated calls. When unsure an API is current and used as maintainers intend, check the docs (Context7 if available) rather than trusting memory.
- **State & data** — incorrect mutation of shared/aliased objects, stale caches, broken invariants, lost updates. Treat defensive normalization or fallback defaults as suspect until the underlying invariant is proven: prefer one canonical source for a total and its breakdown, and flag normalization that makes the UI look safe while hiding a data or wiring defect.
- **Type-boundary correctness** — unchecked casts, parse/serialize round-trip edges, numeric precision/overflow, implicit coercion.
- **Dead / unreachable code** introduced by the change.

## Output

Consolidate into the Phase-4 punch list. Before anything blocks, run it through `findings-lifecycle.md`: it needs a concrete, reachable trigger (a real input or sequence that reaches the bug), known false-positive classes are downgraded, any framework/library claim is checked against docs, and the finding gets the right action/status. Label each surviving finding with **severity** and **confidence**, and order by business impact.

Emit findings into the shared `Finding Set` artifact defined in
`findings-lifecycle.md` rather than as loose prose.

Keep the correctness-review-specific nuance here: every surviving finding still
needs a concrete, reachable trigger plus severity, confidence, and business
impact ordering.
