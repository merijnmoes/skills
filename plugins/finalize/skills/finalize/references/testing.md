# Test quality

Assess and improve the tests that changed in this diff. Good coverage of bad
tests is false confidence — a green suite that asserts the wrong things, or
breaks on every refactor, costs more than it protects. This reference applies to
the **changed/new tests** in the diff, not the whole suite. Project conventions
in CLAUDE.md / the existing test style always win; where they differ, follow
them and say so.

## Test behavior, not implementation

Assert on the public contract and observable outcomes — return values, emitted
events, persisted state, responses — not on private internals or how many times
an internal method was called. Tests coupled to implementation break on every
refactor even when behavior is unchanged, which defeats the whole point: tests
are supposed to be the safety net that lets you refactor freely.

Cover the failure and error paths and the edge cases — empty, null/none, zero,
boundary values, malformed/invalid input, duplicates — not just the happy path.
That is where real bugs live; the happy path usually works by construction.

## Structure & naming

One logical concept per test, so a failure points at exactly one cause. Shape
each test as Arrange–Act–Assert (given/when/then): set up, do the one thing,
assert. Give descriptive names that state scenario + expected outcome
(`returns_401_when_token_expired`, not `test_auth_2`). A failing test's name
alone should tell you what broke without opening the body.

## Determinism (no flaky tests)

A flaky test is worse than no test: it trains people to ignore red, and a real
failure then hides in the noise. Remove every source of nondeterminism:

- Inject or freeze the clock instead of reading wall-time; seed any randomness.
- Never depend on test execution order or shared mutable state between tests.
- Don't hit the real network or live external services.
- Replace `sleep`-and-hope with explicit waits, polling-with-timeout, or fakes
  that complete synchronously.

Each test must be independent and isolated: fresh fixtures per test, clean up
what it creates, and pass when run alone or in any order.

## Mocking discipline

Mock only at real boundaries you don't control — network, external services,
filesystem/I/O, time, randomness. Don't mock types you own, and don't over-mock.
Over-mocking tests the mocks instead of the code: it stays green even when the
real integration is broken, because every collaborator was replaced by a
stand-in that can't disagree. Prefer real objects or lightweight fakes where
they're cheap. For paths where mock/real divergence would hide bugs (queries,
serialization, migrations), use an integration test against the real thing —
e.g. a real test database — rather than asserting on a mock's recorded calls.

## Coverage: a guide, not a goal

Coverage shows what code was *exercised*, not what was *verified*. A test that
runs a function but asserts nothing scores 100% coverage and gives zero safety.
Use coverage to find untested branches and edge cases worth a real assertion —
then write a meaningful behavioral test for them. Never add vacuous tests, or
weaken assertions, just to move the number past a threshold.

## The test pyramid

Favor many fast, isolated unit tests; fewer integration tests; a few slow
end-to-end tests. Unit tests must stay fast so the whole suite runs on every
change — a suite too slow to run is a suite that doesn't get run. Reserve broad,
slow, brittle end-to-end tests for the high-value flows that genuinely need
them; don't reach for E2E what a unit test could pin precisely.

## Anti-patterns

- Asserting on implementation details or internal call counts.
- Over-mocking — mocking types you own, or stubbing so much the real code never
  runs.
- Shared mutable state or order dependence between tests.
- Nondeterminism: real clock, unseeded random, real network, order reliance.
- `sleep`-based waits instead of explicit synchronization.
- Tests that assert nothing, or that swallow/ignore exceptions.
- Logic (loops, conditionals) in test bodies that can itself be buggy — use
  parametrized / table-driven cases instead.
- Giant snapshot blobs nobody reviews — they catch any change, verify none.
- Tests written purely to raise the coverage number.
- Testing third-party/framework code, or trivial getters/setters with no logic.

## Quick checklist

- [ ] Asserts on observable behavior / public contract, not internals or call counts.
- [ ] AAA shape; one concept per test; name states scenario + outcome.
- [ ] Deterministic and isolated — no clock/random/network/order/shared-state reliance.
- [ ] No `sleep`-and-hope; explicit waits or fakes instead.
- [ ] Mocks only at real boundaries; not mocking types you own.
- [ ] Edge cases and failure/error paths covered, not only the happy path.
- [ ] No vacuous tests, no coverage-chasing, no logic in test bodies.
- [ ] Unit tests fast; slow E2E reserved for flows that earn it.
