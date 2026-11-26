# Big Review delegation

Delegation hands a bounded piece of review work to a fresh-context worker. Use it
only when isolation or parallelism clearly beats doing the work inline. The
worker must never inherit this session's context; construct exactly what it
needs. This file states the contract on both sides. Use available host-specific
execution guidance as a supplement, not a replacement for this contract.

Big Review owns *what* is delegated and *what a healthy result looks like*. The
harness owns *how* a worker is spawned and whether execution can be
parallel or backgrounded. Never hard-code one harness's delegation mechanism
here; fall back to inline/sequential execution when a mechanism is unavailable
or unreliable.

## The contract every delegated task states

Give the worker an explicit task parcel:

- **Objective** — one clear outcome, phrased so a weaker model cannot drift.
- **Role** — `research`, `review`, `implementation`, or `qa`; each is
  read-only or write-scoped as described below.
- **Scope and relevant files** — the concrete paths to investigate or edit.
- **Allowed and forbidden actions** — e.g. `forbidden: mutate the
  implementation`, `forbidden: touch files outside the listed scope`.
- **Expected output** — the shape of the report to return.
- **Acceptance criteria** — how the parent judges the task done.
- **Do not delegate further** — the worker must not spawn its own workers
  (see the depth rule below).

Every important conclusion must carry file/symbol evidence. Do not hand a
worker a vague task like "investigate authentication"; give it the scope, the
questions to answer, and the required output shape.

For read-only review work, load `worker-templates/review.md`, fill its
task-parcel block, and hand the filled sheet to the worker. For a QA assignment,
use `verify.md` and state its check, scope, and evidence requirements in the
task parcel. Do not author a generic review prompt from scratch when the review
template exists.

## Worker roles

- **Research** — read-only investigation. May inspect, search, analyze. Must
  not modify the implementation.
- **Review** — read-only critical review. May inspect changes, identify risks,
  challenge assumptions, report findings. Must not silently modify code.
- **Implementation** — write within the explicit scope. Implements, runs
  relevant tests, reports changes and evidence.
- **QA** — verification focus. Runs tests/checks, inspects behavior, reports
  failures and evidence. Does not change the implementation to make tests pass.

## Depth rule (no recursive delegation by default)

The orchestrator is depth 0 and its workers are depth 1. **A worker must not
spawn additional workers.** Recursive delegation (depth 2+) is prohibited unless
a specific phase explicitly opts in. A worker that needs help must return its
partial result to the parent instead of delegating onward.

## Wave pattern for parallel review

When a phase fans out to several workers at once, the parent runs one wave:
build a single shared context packet (scope, diff, and the evidence slices
every worker needs), dispatch all workers with that packet, then consolidate.
Workers in a wave never see each other's output. Every worker returns a
coverage receipt — a `Covered:` line naming what it read — so the parent can
prove every assigned area was actually reviewed. A worker with no receipt is
re-run or recorded as unexercised; it is never silently counted as covered.

Workers that must mutate code to measure something (mutants, repro edits) run
in their own throwaway worktree or scratch dir beside the main tree, and the
parent is told which paths differ while they run, so one worker's experiment is
never visible to the others reading the shared tree.

## Failure states and the parent's recovery reflex

Never assume that a delegated result will arrive. Treat a worker's outcome as
one of: `done`, `failed`, `timed out`, `cancelled`, or `not returned`. If the
harness cannot enforce a timeout, do not fake one — instead make the workflow
resilient to the worker failing to return.

When a worker does not deliver a usable result, the parent follows this reflex
in order, and must never wait indefinitely:

1. **Retry once** with a tightened task parcel (fix what made it fail or hang).
2. **Inline fallback** — perform the task yourself in the parent using the same
   contract and evidence bar. This is the default recovery and is almost always
   the right answer: the work delegated is work the parent could also do.
3. **Continue degraded** — proceed on the partial result, record what is
   missing or uncertain in the review artifacts, and flag it in the report.
4. **Pause** — if the missing result is blocking and cannot be recovered
   inline, stop and ask the user rather than guessing.

Report the `reason`, `attempts`, and `partial_result` of any failure so the
recovery decision is evidence-backed.
