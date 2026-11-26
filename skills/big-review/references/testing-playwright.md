# Playwright Testing Specialty

Use when generic `testing.md` is not enough and the changed risk is a browser
user journey covered by Playwright in this project. Keep this focused on
Playwright-specific review tactics, not generic test-quality advice already
covered elsewhere.

## What to review

- User-centric coverage: the test mirrors the meaningful journey from the QA
  intent draft or pinned intent rather than implementation structure.
- Locator discipline: prefer role, label, text, placeholder, and stable test-id
  locators over brittle CSS/XPath chains.
- Waiting discipline: use Playwright auto-waiting, web-first assertions, and
  explicit observable conditions instead of sleeps.
- Isolation: tests can run alone, in parallel where the project supports it,
  and without relying on state from previous tests.
- Assertions: verify observable outcomes, URL/state/persistence/API effects,
  and useful negative/recovery behavior.
- Page Objects/helpers: use them when they clarify repeated flows or expensive
  setup; do not force them when direct tests are clearer.
- Artifact capture: traces, screenshots, video, and failure output are
  configured or captured well enough to debug CI/environment failures.
- Flake diagnosis: use `repeat-each`, retries, traces, or focused reruns to
  investigate nondeterminism, not to hide it.

## Verification discipline

- `--list` is discovery only: it proves the runner found specs, not that they
  pass. Never log it as verification evidence — run the suite and record the
  observed pass/fail result per `verify.md`.
- When the target is reachable, run the suite yourself instead of asking the
  user; when a shell timeout aborts a progressing run, retry once with a larger
  timeout before sharding or marking `infra`.

## Keep the scope tight

Stay on the changed browser journey, the stability risks it introduces, and the
minimum stack-specific tactics needed to verify it well. Route back to
`testing.md` for generic guidance on assertions, isolation, and choosing the
cheapest test that matches the risk.
