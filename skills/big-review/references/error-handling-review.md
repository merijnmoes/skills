# Error-handling review

Phase 4 and Phase 6 support for `big-review`, conditional. Apply when the diff
changes retries, jobs, async flows, side effects, recovery logic, or
user-visible failure paths.

This lane is for resilience and degradation behavior around the changed flow. It
is not a generic bug-hunting pass; keep the review anchored to failure modes,
recovery, and operator visibility introduced or changed by the diff.

## What to check

- **Retry safety and idempotency** — retries do not duplicate side effects,
  corrupt state, or turn transient failures into repeated damage.
- **Partial-failure cleanup or compensation** — multi-step flows either roll
  back safely, compensate explicitly, or leave behind state that is clearly
  bounded and recoverable.
- **Graceful degradation** — when dependencies, background work, or partial data
  fail, the changed surface degrades predictably instead of crashing or hanging
  silently.
- **User-visible error quality** — user-facing failures are actionable,
  appropriately scoped, and do not leak internal details while still helping
  the user recover.
- **Operator-visible diagnostics and replay behavior** — operators can tell what
  failed, why, and whether the work can be retried, replayed, quarantined, or
  dead-lettered; poison-message handling is explicit where queues or jobs apply.

## Concrete prompts

- If this request, job, or callback runs twice, what duplicate side effect is
  prevented and how?
- If step three fails after step two already committed, what cleanup or
  compensation happens next?
- What does the user see when an upstream dependency, timeout, or background
  task fails?
- What signal would an operator use to replay, quarantine, or investigate a
  poisoned message or permanently failing job?

## Common blockers

- Retry loop on a non-idempotent side effect with no dedupe key, guard, or
  compensating logic.
- Partial writes, orphaned resources, or stuck in-between states with no cleanup
  path.
- Generic "something went wrong" UX with no recovery guidance on a newly changed
  failure path.
- Background failure visible nowhere except a swallowed exception or vague log
  line.
- Queue/job flow that retries forever or drops poison messages without an
  operator-visible trail.

## Mutability

- Mutability mode: `report-first`

## Output

Fold resilience findings into the Phase-4 punch list. Use verification notes
only for evidence gathered about the changed failure and recovery paths in
Phase 6.
