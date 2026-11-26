# Design-system review

Phase 4 (with Phase 7 verdict input) support for `big-review`, conditional. Apply when the diff touches UI and the project shows design-system signals — explicit (`design-system/` contracts, a root `DESIGN.md`, token catalogs, Storybook) or inferred (shared `components/ui/*` imported in multiple places, token CSS/variables, a Tailwind scale, `cva` / `tailwind-variants` maps). If no signals exist, mark the lane `N/A` with a one-line why-not. Never require a design system into existence during final hardening.

This is the audit companion to `best-practices/tailwind.md` (Phase 1 hygiene) and `best-practices/css.md`. Those own mechanical style; this lane owns *conformance*: did the diff compose from the system's public capabilities, or fork around them.

## What to check

- **Discovery before new variant** — did the diff reuse the existing component, token, or pattern, or introduce a parallel one (a second button, a second spacing scale, a second modal)? Cite the existing capability by path. A genuinely missing capability is a `Plan` handoff to system work, not a silent duplicate.
- **Composition through public APIs** — the diff uses the selected component's props, slots, variants, and composition rules as its contract requires (required labels, error associations, region order, grouping). A mismatch between implementation and contract is a defect; the contract is never weakened to hide it.
- **Eligibility** — new product use of a `hidden` / `deprecated` / unmanaged component inside the diff is a finding. Preserving existing deprecated calls outside the diff is fine; only new adoption inside the diff blocks or escalates.
- **Exceptions with reasons** — local deviations (override classes, escape-hatch props, design-lint suppressions) must carry a stated reason, stay local to the consumer, and not become a copied pattern. A reason-free bypass is a finding; a reasoned, bounded exception is reported, not blocked.
- **Token roles, not values** — consumer choices must use the token's role and theme correctly. Equal rendered values do not justify substituting roles.
- **Contrast regressions only** — inherited or prescribed combinations (a component used as intended, a token pairing taken from a design reference) are out of scope. Check only contrast the diff itself introduced or altered; never "fix" prescribed colors autonomously.

## Concrete prompts

- Which existing system capability should this diff have reused, and what path proves it exists?
- Does the new composition satisfy every consumer obligation in the component's contract?
- Is any newly adopted component hidden, deprecated, or unmanaged — and was that adoption inside this diff?
- Does each local deviation carry a reason, stay local, and avoid becoming a second variant?
- Did the diff change background, opacity, or token roles in a way that alters contrast?

## Common blockers

- A parallel component or token scale duplicating an existing system capability.
- New adoption of a deprecated / hidden / unmanaged component inside the diff.
- Contract obligations ignored (missing labels, error associations, region order).
- Reason-free bypasses of the system that invite copy-paste divergence.

## Non-goals (hand off, don't build)

Contract authoring, index generation, admission or migration decisions, token-architecture redesign, and component-internals or business-logic repair are out of scope for `big-review`. Record them as `Plan` / `Decide` gaps. `big-review` reviews the composition; system work belongs to the build workflow.

## Ownership split

- **Q1** (`codebase-fit.md`) owns local reuse and dead code; **Q3** owns naming and convention drift; **Q2** (`design-quality.md`) owns depth — including the `@apply`-vs-component call. The architecture lane owns cross-module shape plus the Map.
- This lane owns *system* conformance only: reuse of system capabilities, composition through public APIs, eligibility, reasoned exceptions, and token-role correctness. Report each issue once under the clearest owner instead of duplicating it.

## Mutability

- Mutability mode: `report-first`
- `small-fix-allowed` only for trivial localized misuse with a concrete trigger and Phase-6 verification (wrong variant name, wrong token role, missing reason on an otherwise valid exception). Anything architectural — new variants, contract changes, migration, redesign — stays a `Plan` / `Decide` finding, never an auto-fix.

## Missing context

Infer the system from code when formal contracts are absent (shared component paths, token definitions, Storybook stories, repeated imports). Do not invent contracts, rules, or component promises. If what the system intends cannot be established from the repo, name the missing fact and cap confidence instead of guessing.

## Output

Normalize findings into the shared `Finding Set` per `references/findings-lifecycle.md`. Every `N/A` or `deferred by environment` state carries a one-line why-not naming the checked signal.
