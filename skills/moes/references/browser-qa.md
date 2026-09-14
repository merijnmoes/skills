# Browser QA

Phase 4 and Phase 6 support for `moes`, conditional. Apply this
`browser-qa.md` lane when the diff changes important runnable web UI,
multi-step browser flows, responsive layout behavior, or pre-release staging
behavior.

## Phases

### 1. Smoke

- load the target route;
- record console errors and network failures;
- capture desktop and mobile screenshots;
- note Web Vitals or obvious loading regressions when observable.

### 2. Interactions

- run the primary user journey;
- run one meaningful invalid/error path;
- check navigation, form state, and auth-gated behavior when relevant.

### 3. Visual

- inspect key breakpoints;
- flag overflow, clipping, layout shifts, missing states, and viewport-specific
  regressions;
- compare against an existing baseline if the project already has one.
- confirm responsive behavior explicitly per checked viewport instead of
  assuming desktop success transfers to mobile.

### 4. Accessibility

- lightweight browser spot-check only: keyboard pass on the changed flow;
- automated checker if available;
- focus order, labels, and error-state feedback on changed controls;
- complements `accessibility-review.md`; does not replace the dedicated
  accessibility lane.

## Output

Record:

- route or flow exercised;
- viewport(s) checked;
- direct observations;
- screenshots or artifact paths if captured;
- console/network/accessibility issues;
- QA capability matrix state for browser E2E, accessibility, visual smoke, and
  performance smoke when those capabilities are relevant;
- explicitly state when artifacts were not captured;
- explicitly state any checks that were not run and why;
- what could not be exercised in the environment.
- when there is no runnable target, mark browser and automated accessibility
  checks honestly as environment-blocked — never as passed by inspection.
