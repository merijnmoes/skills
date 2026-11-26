# Pytest Testing Specialty

Use when generic `testing.md` is not enough and the changed risk depends on
pytest fixtures, async behavior, parametrization, or isolation-heavy Python
tests. Keep this reference concise and specific to pytest-shaped review risks.

## What to review

- Fixture scope and cleanup discipline so tests do not leak state across cases
  or hide order dependence behind module- or session-level setup.
- Parametrization for boundary coverage when the same invariant should hold
  across multiple input shapes, failure modes, or edge values.
- `pytest.raises` and clear exception assertions that pin the intended failure,
  not just that some error happened.
- Async and time-control patterns without sleeps, including explicit scheduling,
  fake clocks, and deterministic event-loop handling where the stack supports
  it.
- Mocks only at true boundaries, with owned code exercised through real objects
  or lightweight fakes wherever practical.

## Keep the scope tight

Stay on the changed Python test surface and the pytest-specific tactics that
make it trustworthy. Route back to `testing.md` for generic guidance on test
behavior, determinism, and test-type selection.
