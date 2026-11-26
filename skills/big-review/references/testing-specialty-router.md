# Testing specialty router

Load this when generic `testing.md` is not enough for the changed risk surface
and `big-review` needs a stack-specific testing handoff rather than more generic
test-quality advice.

## Suggested handoffs

- **Playwright specialty** — route to `testing-playwright.md` when
  browser-E2E flows, artifact capture, or flake diagnosis matter.
- **JS/TS test references** — when frontend/runtime-heavy diffs need
  framework-specific advice on async rendering, DOM/runtime harnesses, or
  module-boundary mocking beyond what `testing.md` covers.
- **Pytest specialty** — route to `testing-pytest.md` when fixture scoping,
  parametrization, async behavior, or Python-specific isolation matter.
- **Other repo-specific references** — when the project already has stronger
  house guidance for a stack and `big-review` only needs to hand off cleanly.
