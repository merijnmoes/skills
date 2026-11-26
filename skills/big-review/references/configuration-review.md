# Configuration review

Phase 4, Phase 5, and Phase 7 support for `big-review`, conditional. Apply when the diff changes env vars, feature flags, defaults, deployment config, debug settings, or production-vs-dev behavior.

## What to check

- **Safe defaults** — production-facing defaults are secure and conservative; debug/dev shortcuts are not accidentally enabled by default.
- **Environment separation** — dev/test-only config does not leak into production paths.
- **Required config clarity** — new env vars, flags, or secrets are documented and validated clearly enough that misconfiguration is unlikely.
- **Feature-flag safety** — default states, fallback paths, and stale flag behavior are explicit.
- **Fail-safe behavior** — missing or invalid config fails closed where security or integrity depends on it.
- **Secret handling** — config examples and docs do not embed real secrets or encourage unsafe storage.

## Concrete prompts

- If the new config is missing in production, what exactly happens?
- What value is used by default, and is it safe?
- Can an operator mis-set this and silently weaken security or correctness?
- Is the new flag/env var reflected in docs and examples accurately?

## Common blockers

- Debug, permissive CORS, mock auth, or insecure transport enabled by default.
- Missing config silently downgrades security or writes to the wrong target.
- New secret/env var required but undocumented or ambiguously named.

## Deployment/runtime hooks

- When config changes alter container or runtime behavior, route through
  `docker-deployment.md` so rollout and operability assumptions are reviewed
  explicitly.
- Note when changed defaults, feature flags, static assets, or transport behavior would benefit from `post-deploy-monitoring.md` after deploy or during canary.
- Call out rollout-sensitive config where local checks are not enough to prove runtime safety.
- Distinguish `not run because no environment` from `run and healthy`; lack of a deployed check is an evidence gap, not a silent pass.

## Output

Use this both for audit findings and for doc-update checks when configuration changed.
