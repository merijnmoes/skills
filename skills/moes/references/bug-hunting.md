# Focused bug hunting

Used primarily in `moes` Phase 4, then carried into Phases 6 and 7. The
goal is to find **real bugs the checklists may miss** without turning `moes`
into an open-ended research project. Start from the actual diff and generate a
**small number of high-value bug hypotheses** plus the cheapest probes that
could falsify them. This is a risk-led complement to `code-review.md`,
`testing.md`, and `validation-gate.md` — not a replacement for them.

Its job is to answer **"what could really be wrong, and what probe would expose
it?"** It does **not** classify the whole change up front (`risk-mapping.md`),
it does **not** execute the final verification plan (`verify.md`), and it does
**not** decide the verdict (`validation-gate.md`).

## Core stance

- The checklist is necessary, but **not exhaustive**.
- A quick sweep from `common-bugs-checklist.md` catches boring defects fast; the
  real value here is generating hypotheses that the checklist would never name.
- Coverage is evidence, not proof.
- A bug hypothesis is useful only if you can turn it into a **reachable
  scenario**, an invariant, or a deterministic reproduction.
- **No hypothesis without a loop.** Name one command first (test, curl, harness,
  focused flow) that already went red on *this* symptom at least once: red-capable
  (catches exactly the reported symptom, not "doesn't crash"), deterministic,
  seconds-fast, agent-runnable. Catching yourself theorizing before that command
  exists means stop: build the loop first.
- On green-lane diffs a light probe suffices, but always record it (loop or an
  explicit why-not per `SKILL.md` judgement-not-skipping) — silently skipping is
  forbidden. A doubtful case becomes an `Investigate` note, never a direct
  `blocking` finding (trigger test in `findings-lifecycle.md` still gates).
- Prefer the **smallest probe that can falsify your confidence**:
  unit/integration test, a focused harness, a repeated command, or a single
  browser flow.
- Do **not** install new dependencies or build a large new test framework inside
  `moes`.

## 1. Generate bug hypotheses from the diff

Generate 3–5 ranked, falsifiable hypotheses before testing any of them
(single-hypothesis anchoring is the failure mode). Format each as: "If X is the
cause, then changing Y makes the bug disappear / changing Z makes it worse."
Without a prediction it is a vibe: sharpen or discard. Cap at 3–5: completeness
without noise.

Look for the places where bugs usually hide:

- **Boundaries** — empty, max-size, malformed, duplicate, unicode, locale,
  timezone/DST, negative/zero, first/last item.
- **State transitions** — create/update/delete, pending -> success/failure,
  login/logout, draft/published, enabled/disabled.
- **Temporal behavior** — retries, timeouts, debounce, batching, cache expiry,
  cron/scheduler logic, "eventually consistent" reads.
- **Concurrency & reentrancy** — double-submit, duplicate webhook delivery,
  two workers racing, stale read-modify-write, repeated clicks.
- **Persistence & serialization** — round-trips, migrations, precision loss,
  missing defaults, backward compatibility with existing data.
- **Trust boundaries** — auth, tenant isolation, role changes, untrusted input,
  redirects, uploads, outbound requests.
- **Derived state** — cache invalidation, denormalized counters, search indexes,
  analytics events, read models, materialized views.
- **Quantitative breakdowns** — any total shown with lines/percentages: total
  from a different source than the lines; normalization or fallback hiding a
  data problem; rounded values that no longer sum to the total; a percentage
  shown for a rounded-to-zero value; a visible category permanently at zero;
  per-record clamping/capping/sign-normalization before aggregation (floor,
  ceiling, max/min) that moves buckets, subtotals, and headline apart — probe
  with positive, negative, and compensating contributions across multiple
  records, never single-record cases alone;
  a mock that bypasses the real aggregation or renderer so the production path
  never runs.
- **Integration seams** — third-party APIs, queues, jobs, DB transactions,
  filesystem, message brokers, browser/server contracts.

If the diff is trivial or purely documentary, say so and skip this reference
with a one-line note.

## 2. Write the invariant before the probe

Don't just ask "what input should I try?" Ask **what must never become false**.
Examples:

- an acknowledged write must still exist later;
- a retry must not double-apply the side effect;
- unauthorized users must never observe another tenant's data;
- offsets, counters, versions, or timestamps must stay monotonic where the
  design requires it;
- serialize -> parse -> serialize should preserve the intended value;
- totals, balances, quotas, and counts should conserve or change by the exact
  amount expected.
- a shown total should come from the same canonical source as its breakdown;
  defensive normalization that makes the UI look safe while the underlying
  invariant is broken is a defect, not a fix — prove the invariant first.

Good invariants turn vague suspicion into crisp tests and sharper reviews.

Also ask whether the changed surface carries **property-style** expectations:

- round-trip or encode/decode symmetry;
- retry safety / idempotency;
- monotonic ordering, version, counter, or timestamp behavior;
- conservation of totals, balances, quotas, or counts;
- cross-version or cross-implementation equivalence where two paths are
  supposed to agree.

## 3. Propose the smallest high-value probe

Choose one or more, depending on the risk:

- **Table-driven edge sweep** — enumerate boundary and invalid inputs in a
  focused unit/integration test.
- **Regression test** — if a bug was fixed or suspected, encode the exact
  reproducer so it stays dead.
- **Model/oracle comparison** — compare a complex path against a simpler trusted
  implementation, fixture, or hand-worked expectation.
- **Metamorphic/property-style probe** — assert a relation across many inputs
  without needing a special framework; e.g. round-trip, monotonicity,
  idempotency, commutativity where appropriate.
- **Repeat/replay probe** — run the same scenario many times, or with fixed
  seeds/fixtures, to shake out timing/order bugs while keeping failures
  reproducible.
- **Differential probe** — compare old/new paths, two implementations, or two
  equivalent code paths when the main risk is behavioral drift rather than an
  outright crash.
- **Restart/retry/failure probe** — rerun across reconnects, page reloads,
  process restarts, temporary network loss, or dependency errors if the project
  already has harnesses/fakes to do so.
- **Focused browser flow** — for web/UI changes, exercise the highest-value user
  journey and one meaningful negative path.

The aim is not "more tests." The aim is **the right candidate probe for the
specific risk**. `verify.md` decides which of these probes are actually executed
in Phase 6.

## 4. Make the probe deterministic

The most valuable bug-finding setups turn weird failures into replayable ones.
You can borrow that discipline even in an ordinary `moes` run:

- freeze or inject the clock when the project already supports it;
- seed randomness and record the seed;
- use fixed fixtures and explicit waits, never `sleep`-and-hope;
- keep the command/path to reproduce the failure short and exact;
- when a scenario is timing-sensitive, reduce moving parts until the bug is
  still present but easier to replay.

When you find a bug, capture the **minimal reproducer** first; only then widen
the fix. Minimize to load-bearing: strip the repro one element at a time until
every remaining element is load-bearing — that becomes the regression test.

## 5. Playwright guidance

If **Playwright is already configured in the repo or otherwise already
available**, it is often the best probe for UI/system flows:

- cover the highest-value journey end-to-end, not the whole product;
- add at least one negative or regression path when the diff touches auth,
  validation, navigation, async loading, or persistence;
- assert on semantics and user-visible outcomes, not incidental DOM trivia;
- prefer stable selectors/roles over brittle CSS chains;
- use Playwright's waiting model, tracing, network controls, and storage state
  only if they are already part of the project's setup.

Do not add Playwright to a repo that doesn't already use it just because the
skill mentions it.

## 6. Deterministic bug-finding habits

You probably won't have deterministic simulation tooling in an ordinary
`moes` run. You can still borrow the parts that matter:

- **Control what you can** — time, randomness, fixtures, dependency responses.
- **Don't chase 1% flakes** — raise the reproduction rate (loop 100×, stress,
  parallelize, narrow timing windows, inject sleeps) until the bug is debuggable.
- **Perf: measure first, fix second** — establish a baseline (timing harness,
  profiler, query plan), then bisect; logs are usually the wrong tool for
  performance regressions.
- **Assert continuously** — bake invariants into tests/harnesses instead of
  checking only at the end.
- **Probe weird states on purpose** — retries during partial success, stale
  cache after mutation, duplicate delivery, process restart, offline/online,
  expired auth, mixed old/new data shapes.
- **Favor replayability over breadth** — one bug you can deterministically
  reproduce and keep dead beats ten flaky "stress tests."
- **Measure test yield** — if a large test explores nothing new, improve the
  workload or assertions instead of just running it longer.

For distributed, async, or stateful systems, these habits often find bugs that
plain happy-path tests and checklist reviews miss.

## Output shape

High-value bug hypotheses should feed the shared `finding set` artifact defined
in `findings-lifecycle.md` as candidate findings.

Keep the bug-hunting-specific nuance here: name the violated invariant, the
concrete trigger or probe, the likely surface and impact, and how the
hypothesis currently lands in the shared set: still `candidate`, verified and
open, or `dropped`.
A concurrency hazard — race, TOCTOU, double-run or non-idempotent retry, tenant leak — may carry blocking status without a demonstrated trigger when it names the interleaving or double-run scenario sketched, the shared state or operation involved, and the cheaper safeguard (lock, transaction, idempotency key, ownership check).
Purely theoretical hazards with no reachable shape still drop.
Such findings keep `Plan` or `Investigate` action; only the status may block.

## 7. Turn discoveries into durable safety

When you find a real bug:

1. capture the trigger precisely;
2. minimize it to the smallest useful reproducer;
3. add or improve a regression test when that is practical in-repo;
4. only then fix the production code;
5. rerun the focused probe and the broader suite.

If you cannot add a durable regression in this pass, call that out explicitly in
the final report as residual risk.
