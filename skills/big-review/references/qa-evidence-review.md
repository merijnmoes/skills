# QA evidence review

Phase 4, Phase 6, and Phase 7 support for `big-review`. Use this when a prior workflow
produced or should have produced QA intent, Playwright/API tests, exploratory
browser evidence, or a QA capability matrix.

`big-review` consumes QA evidence; it does not regenerate the QA plan from scratch.

## Inputs

- QA intent draft: accepted, revised, or agent-selected scenarios.
- Durable test changes: Playwright E2E, Playwright API, unit, integration, or
  other repo-native tests.
- QA capability matrix with `run`, `N/A`, `not configured`, and `deferred`
  states.
- Commands, screenshots, traces, videos, coverage summaries, CI artifacts,
  Lighthouse reports, k6 output, or environment-blocker notes.

## Review questions

- Did the QA intent draft cover the meaningful user and system risks from the
  pinned intent and risk map?
- Were durable tests added at the cheapest layer that can catch the risk?
- Are Playwright tests deterministic, isolated, semantic, and readable?
- Do browser tests cover golden paths plus relevant negative, recovery,
  permission, empty, invalid, stale-state, or persistence-visible outcomes?
- Do API tests validate response body, headers, error shape, and side effects,
  not just status codes?
- Are accessibility, visual, performance, coverage, and CI artifact capabilities
  correctly marked `run`, `N/A`, `not configured`, or `deferred`?
- Do skipped or blocked checks leave residual risk that should affect the
  verdict?
- Are artifacts sufficient for another reviewer to understand failures or
  confidence claims?

## Findings

Create a finding only when the gap affects this diff's ship-readiness.

Examples that can block:

- changed critical flow has no durable test and no justified cheaper coverage;
- E2E test is flaky by construction, relies on sleeps, or depends on shared
  state;
- API contract change only asserts status code while response shape or side
  effect is the risk;
- accessibility/performance capability is marked `N/A` even though the diff
  clearly changed that surface;
- QA evidence claims a pass but no command, flow, artifact, or observation was
  recorded.

Examples that usually should not block:

- optional Lighthouse, k6, or visual snapshot setup is absent for a cold-path
  backend change;
- Page Objects are absent from a small one-off Playwright spec that is clearer
  inline;
- coverage percentage did not increase when the changed behavior is already
  meaningfully asserted.

## Output

Normalize any surviving issue into the shared `Finding Set`:

- finding title;
- evidence source;
- reachable trigger or missing-evidence trigger;
- affected capability;
- recommended action: `Fix`, `Investigate`, `Plan`, or `Decide`;
- residual risk if not fixed now.
