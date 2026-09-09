# Evidence pack

Used in `moes` Phase 0 and then carried into every later phase. This is the
single compact artifact that explains what changed, why it matters, where the
risk is, and what evidence exists before deeper review begins.

## Required fields

- diff scope
- base branch and comparison point
- changed surfaces and subsystem clusters
- language and framework detection
- stack-context snapshot (single version profile shared by all later lanes — see below)
- project-context capsule
- pinned intent/spec source
- risk lane: `green` | `yellow` | `red`
- risk map
- runtime interaction sketch
- hotspots
- specialty lane candidates
- environment availability notes
- architecture-doc implications
- Architecture Map (state `pending` until the Phase 4 architecture lane attaches it; `N/A` with a registry receipt when the lane does not run — the Pack stays append-only after Phase 0, see `architecture-review.md` for the inventory)
- App Store / submission implications
- verifier inventory and initial results
- missing artifacts / unknowns

## Stack-context snapshot

Build once in Phase 0 so later lanes stop guessing versions independently.
Capture only what the diff's stacks need — no generic inventory:

- language + version (e.g. `python 3.12`, `node 22`, `php 8.3`, `go 1.23`)
- framework + major version (e.g. `django 5.x`, `fastapi 0.11x + pydantic v2`, `react 19`, `laravel 11`)
- module system / packaging as relevant (ESM vs CJS, `src/` layout, Vite/Rolldown, TS `strict`)
- ORM / data layer (e.g. `prisma 5`, `typeorm 0.3`, `sqlalchemy 2`, raw SQL)
- test runner semantics (e.g. `pytest asyncio_mode=auto`, `vitest 3 mock hoisting`, `phpunit 11`)
- declared vs resolved version when they differ (manifest says `^18`, lockfile says `18.19`)

Sources, in order: lockfiles / manifests (`package-lock.json`, `pyproject.toml` + `uv.lock`, `composer.lock`, `go.mod`), Docker base image tag, CI matrix, then code signals. If a version cannot be determined, write `unknown (assumed X for review, verify before version-gated claim)` — never assert a version-gated finding from memory. This snapshot is read-only input to Phases 1, 4, and 6; version-gated claims without a snapshot cite must cap confidence at Medium per `findings-lifecycle.md`.

## Risk lane calibration

Assign the `risk lane` in Phase 0 using this compact calibration:

- `green` — localized change, low blast radius, straightforward rollback
- `yellow` — meaningful behavior change or side effects that need focused probes
- `red` — high-blast-radius, security-sensitive, migration-sensitive, or hard-to-reverse change

Use `risk-mapping.md` for the deeper risk map, failure modes, trust boundaries,
and hotspots. The evidence pack carries the lane classification forward once it
is assigned.

## Runtime interaction sketch

This is the most important section for high-risk changes. Capture:

- entrypoints touched
- state transitions
- persistence boundaries
- cache interactions
- async/retry/concurrency points
- external service boundaries
- auth/trust boundaries
- rollout/config toggles

Write it as a compact ordered flow, for example:

- `POST /refund` reads payment state
- checks refundable status
- calls external provider
- writes refund record
- updates payment status
- emits event

## Hotspots

Mark any of these when present:

- auth / permission checks
- migrations / rollout-sensitive code
- concurrency / idempotency
- cache invalidation
- external side effects
- public API changes
- trust-boundary input handling
- performance-sensitive paths

## Specialty lane candidates

List only the specialty surfaces that later phases might need to register. Keep
this short and evidence-driven. Typical candidates include:

- UI / markup accessibility surfaces
- iOS metadata, purchase, privacy, or reviewer-facing submission surfaces
- Docker / Kubernetes / Terraform / cloud configuration
- `.github/workflows` or related automation
- red-lane trust-boundary changes
- public API or architecture boundary changes

For each candidate, note the likely target lane or escalation file if known.

## Environment availability notes

Record any environment limits that affect whether a specialty lane can run
normally in Phase 4 or Phase 6. This should explain future `deferred by
environment` lane states in one line each, rather than surprising the reader
later.

## Architecture-doc implications

If the diff changes a public API, architecture boundary, or another surface
that should update architecture-facing documentation, say so here even if the
later answer is "no doc update required." The point is to make the implication
explicit for Phase 4 and Phase 5 routing.

## App Store / submission implications

If the diff touches iOS purchase flows, privacy disclosures, metadata,
reviewer-facing setup, or other submission-sensitive surfaces, capture that
here so the App Store lane can be registered later. Otherwise write `none`.

## Output discipline

The evidence pack is not a dump of everything the agent saw. It is a compact
working artifact. If a detail will not change later review behavior, omit it.
