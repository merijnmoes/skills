# Post-Deploy Monitoring

Phase 4, Phase 6, and Phase 7 support for `big-review`, conditional. Apply when the diff changes production-facing web behavior, release-critical flows, rollout-sensitive config, or a deployed environment is available for canary verification.

This lane owns compact runtime release verification after deploy or during canary observation. It does not replace `observability-review.md` for signal quality or `security-review.md` for security findings.

## Watch modes

- **Quick check** — one short canary-style pass after deploy to confirm the changed surface loads, responds, and does not immediately error.
- **Sustained watch** — stay with the changed flow long enough to catch delayed failures, retries, streaming disconnects, cache misses, or asset drift.
- **Compare mode** — compare staging and production, or pre-change and post-change environments, when rollout risk is about behavioral drift rather than total failure.

## What to watch

- **HTTP status** — changed pages and critical endpoints return the expected status, especially the primary user-facing route and health-like checks that matter for the change.
- **Console errors** — new uncaught runtime errors, hydration failures, or repeated warnings on the changed path.
- **Network failures and critical endpoints** — fetch/XHR/API failures, retries, timeouts, or unexpected payload differences on the flows touched by the diff.
- **Static asset delivery** — bundles, images, fonts, manifests, and other required static assets load cleanly and are not missing, stale, or misrouted.
- **SSE or streaming endpoints** — when relevant, the stream connects, stays open long enough to prove basic stability, and delivers expected events without repeated reconnect churn.
- **Performance signals** — LCP, CLS, INP, or obvious response/render regressions that would make the release feel degraded even if it technically works.

## Thresholds

- **Critical** — non-200 critical page, 5xx API health failure, broken static asset on the changed path, or a stream that cannot connect or immediately collapses.
- **Warning** — meaningful performance delta, new warnings, response-time drift, missing content, or visible instability that does not fully break the flow.
- **Info** — low-signal variance worth logging for follow-up but not strong enough to block on its own.

## Evidence and escalation

- Record at least one concrete canary observation: environment, route or flow checked, what was watched, and what was observed.
- Distinguish clearly between `not run because no environment`, `run and healthy`, and `run with warnings`.
- Escalate `critical` observations into the validation gate as blocking evidence.
- Carry `warning` observations forward with scope and likely impact; do not quietly round them down to success.
- Keep this lane focused on release behavior after deployment. If the issue is primarily about missing telemetry quality or exploitability, route to the observability or security lanes instead of duplicating their ownership here.
