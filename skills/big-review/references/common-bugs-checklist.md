# Common bugs checklist

Fast quick-scan for recurring defect classes that are easy to miss in a long
review. Use this in `big-review` Phase 4 before or alongside `code-review.md`,
then let `bug-hunting.md` generate the deeper, risk-led probes. Do not turn
this into duplicate reporting: if an issue is already captured more precisely in
another lane, keep the sharper finding and skip the duplicate.

## How to use it

- Spend 30-90 seconds doing a boring-defects sweep.
- Mark only issues that are plausibly reachable in the changed diff.
- When a check fires, name the concrete trigger, not just the category.

## Universal checks

### Logic and control flow
- [ ] Off-by-one or wrong-bound loops.
- [ ] Inverted boolean or wrong comparison operator.
- [ ] Missing case/branch for an added enum/state/variant.
- [ ] Guard/default path treats `0`, `""`, or `false` as absent.

### Resource and lifecycle
- [ ] Missing cleanup for listeners, subscriptions, timers, file handles,
      DB sessions, sockets, or temp files.
- [ ] Cleanup only happens on the happy path, not on errors/cancellation.

### Error handling
- [ ] Exception/error is swallowed, downgraded, or logged without preserving
      enough context.
- [ ] Partial failure can leave state inconsistent.
- [ ] Failure path falls open instead of closed.

### Data and state
- [ ] Shared object/collection mutated in place when callers assume immutability.
- [ ] Cache, denormalized field, or derived counter can drift stale.
- [ ] Parse/serialize or write/read round-trip loses precision, timezone,
      optional fields, or compatibility with existing data.

### Concurrency and ordering
- [ ] Duplicate submit/retry/replay can double-apply a side effect.
- [ ] Check-then-act race on shared state, file existence, balance, quota, etc.
- [ ] Async ordering allows slower stale work to overwrite newer intent.

## JavaScript / TypeScript

- [ ] Missing `await`, floating promise, or unhandled rejection.
- [ ] `any`/unchecked cast/default hides an unclear contract.
- [ ] Closure captures stale value inside callback/effect loop.
- [ ] Array/object mutated while iterating or while shared elsewhere.

## React

- [ ] Hook called conditionally or inside nested helper/callback.
- [ ] Effect used for derived state instead of render-time computation.
- [ ] Effect async work missing cleanup/staleness guard.
- [ ] Dynamic list uses unstable key or array index.
- [ ] Mutation/optimistic flow updates UI without rollback/error path.
- [ ] Client-only hook/browser API leaks into server-rendered boundary.

## Python / web backends

- [ ] Mutable default argument or shared mutable class/module state.
- [ ] Blocking I/O inside async request path.
- [ ] Authenticated user is assumed authorized without ownership/tenant check.
- [ ] Request schema, response schema, and persistence model are blurred.

## Django / FastAPI / API surfaces

- [ ] N+1 query shape introduced on list/detail serialization.
- [ ] Unbounded list endpoint: no pagination, no cap, or no field filtering.
- [ ] Framework default security control was bypassed or disabled.
- [ ] Resource lookup is not scoped to the caller before mutation/read.

## SQL / persistence

- [ ] Query built by interpolation instead of parameters.
- [ ] Missing transaction for related writes.
- [ ] `SELECT *`, table scan, or no `LIMIT` on large/unbounded read path.
- [ ] `NULL`/timezone/collation semantics assumed incorrectly.

## CSS / UI

- [ ] `transition: all` or layout-triggering animation on interactive path.
- [ ] Fixed size clips realistic content or translated strings.
- [ ] `!important` or giant selector used to fight the cascade.
- [ ] Visual states drift from actual disabled/error/focus behavior.

## Tests

- [ ] Test proves mocks were called, not behavior.
- [ ] Failure/permission/edge path missing for changed surface.
- [ ] Test relies on wall-clock sleep, order dependence, or shared state.
- [ ] Bug fix landed without a regression test or a clear reason why not.

## Quick checklist

- [ ] Ran a short boring-defects sweep before deeper review.
- [ ] Kept only reachable checks relevant to the diff.
- [ ] Escalated findings with a concrete trigger, not just a category name.
- [ ] Avoided duplicate findings when another lane explains the issue better.
