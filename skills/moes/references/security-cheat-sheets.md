# Security cheat-sheet router

Phase 4 support for `moes`. This file turns broad security review into targeted, surface-aware checks. It is not a separate verdict lane by itself; it tells you which narrower references to load so the audit is complete without becoming noisy.

All routes chosen here stay under `security-review.md` ownership. Keep them in
the specialty lane registry for traceability, but normalize their findings
under the shared security lane in the `Finding Set`.

## How to use

Start with `security-review.md` as the always-on floor. Then load the focused references below when the diff touches their surface:

- `api-security-review.md`
  Load when the diff adds or changes HTTP endpoints, RPC methods, webhooks, controllers, route handlers, request/response schemas, or API clients.
- `agent-security-review.md`
  Load when the diff calls an LLM, builds agent behavior, handles prompts/context, exposes tools, stores embeddings, or executes model output.
- `auth-session-review.md`
  Load when the diff touches login, signup, logout, password reset, MFA, session/cookie/token handling, roles/permissions, or identity-provider integration.
- `input-upload-output-review.md`
  Load when the diff accepts untrusted input, parses files, renders rich output, builds URLs/queries/commands, or handles uploads/downloads. Pair with the cross-cutting deep dives below when their trigger fires.
- `sql-injection-prevention.md`
  Load when the diff builds SQL text, uses ORM raw paths (`whereRaw`, `RawSQL`, `extra()`, `$queryRaw`, `text()`), or interpolates identifiers / sort / filter into queries.
- `xss-prevention.md`
  Load when the diff renders HTML/templates/markdown, uses an escaping escape-hatch (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, `|safe`, `html_safe`), builds URLs/redirects from input, or embeds JSON in HTML.
- `n-plus-one-queries.md`
  Load when the diff loops over rows with a query inside, touches ORM relations/serializers/GraphQL resolvers, or adds list endpoints without eager-loading evidence. Performance + load-correctness companion.
- `error-handling-principles.md`
  Load alongside `error-handling-review.md` when the diff needs the cross-language pattern catalog (retry keys/backoff, compensation, specific-catch, degrade/diagnose shapes) rather than just lane verdicts.
- `async-concurrency-patterns.md`
  Load alongside `bug-hunting.md` / `error-handling-review.md` when the diff adds async/await, threads, workers, queues, channels, locks, or shared mutable state.
- `infra-security-review.md`
  Load under `security-review.md` when the diff changes Docker, Kubernetes,
  Terraform, cloud config, deploy manifests, container/runtime security
  settings, or other infra-sensitive runtime configuration.
- `workflow-security.md`
  Load when the diff changes `.github/workflows/**`, CI/CD config, release automation, build scripts, deploy scripts, or secrets usage in automation.
- `gha-exploit-review.md`
  Load under `security-review.md` alongside `workflow-security.md` when the
  diff changes GitHub Actions, local composite actions, or workflow-loaded
  config/scripts and the review needs an external-attacker exploit-path check.
- `repo-hygiene.md`
  Load when the diff changes dependency manifests, lockfiles, release config, repo policy files, action pinning, or supply-chain-sensitive project config.
- `observability-review.md`
  Load when the diff changes logging, tracing, alerts, audit logs, error reporting, or sensitive state transitions that must be observable.
- `migration-safety.md`
  Load when the diff changes DB schemas, migrations, backfills, data transforms, or anything that mutates persistent data at rollout time.
- `configuration-review.md`
  Load when the diff changes env vars, feature flags, defaults, deployment config, debug modes, or production-vs-dev behavior.

## Escalation routing

- `threat-model-escalation.md`
  Load under `security-review.md` when a red-lane trust boundary changes or a
  high-impact security finding needs compact trust-boundary, asset,
  attacker-goal, and abuse-path framing for the changed surface.
- `security-requirements.md`
  Load under `security-review.md` when an escalated threat or surviving
  security finding needs explicit requirements, acceptance criteria, or
  `Fix` / `Plan` / `Investigate` / `Decide` classification support before
  Phase 7.

## Trigger heuristics

Use filename and behavior clues together:
- API surfaces: `routes`, `controllers`, `handlers`, `openapi`, `schema`, `api`, `webhook`
- Auth/session: `auth`, `login`, `session`, `token`, `cookie`, `oauth`, `saml`, `mfa`, `acl`, `rbac`
- Input/output: upload handlers, HTML rendering, redirect helpers, file parsing, template rendering, shell/SQL builders
- Workflow/repo: `.github/workflows`, release scripts, package manager config,
  action references, policy files
- Infrastructure: `Dockerfile`, `docker-compose`, `helm`, `kustomize`,
  `terraform`, `tfvars`, `cloudbuild`, `eks`, `gke`, `ecs`, ingress/service
  manifests, IAM/policy config
- GitHub Actions exploit path: `.github/workflows`, `.github/actions`,
  scripts invoked from workflows, templated workflow config, cache/artifact
  setup
- Migration/data: `migrations`, `prisma`, `typeorm`, `schema.sql`, `alembic`, backfill scripts, ETL jobs
- Config/flags: `.env.example`, deployment manifests, feature flag config, runtime settings
- Observability: logger setup, tracing middleware, audit events, Sentry/Datadog/OpenTelemetry hooks

## Discipline

- Load only the references that match the diff surface.
- Prefer `infra-security-review.md` for container/build/config artifacts such
  as `Dockerfile` unless the diff also changes CI/CD trust, workflow
  execution, or release automation.
- If a surface clearly does not apply, note `N/A` and move on.
- Findings from these focused refs still must pass `findings-lifecycle.md` before blocking.
