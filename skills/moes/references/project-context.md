# Project context

Used in `moes` Phase 0, then carried into Phases 1, 4, 6, 7, and 8. This is the repo-specific layer: architecture boundaries, team conventions, domain rules, tooling norms, and release/documentation expectations that generic best practices cannot know.

The goal is a small **project context capsule** that makes later checks sharper. Do not turn this into a whole-repo archaeology project. Read enough to understand the rules that apply to the diff, then stop.

## What to produce

Write down a compact capsule with:

- **Project instructions** — relevant rules from `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, or equivalent.
- **Architecture boundaries** — maintained layers/modules/packages, dependency direction, forbidden shortcut imports, framework/data types that should not cross boundaries.
- **Established patterns** — how similar features, helpers, errors, tests, APIs, components, jobs, migrations, or docs are already shaped.
- **Domain rules** — product/business invariants, calculations, workflow states, tenant/privacy constraints, data-shape rules, compatibility promises, or reviewer expectations unique to this repo.
- **Tooling and quality gates** — formatter, linter, type checker, test commands, coverage conventions, CI assumptions, generated-code rules.
- **Docs and release conventions** — changelog policy, README/API docs style, env/example files, migration/rollout notes, PR conventions.
- **Unknowns** — missing or ambiguous project guidance that could affect the verdict.

Keep it short: usually 6-12 bullets. Prefer concrete rules over broad descriptions.

## Bounded read order

Read only what exists and is relevant to the diff:

1. Root and nearest instruction files: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.cursor/rules/*`.
2. Domain glossary first: `CONTEXT.md` (plus `CONTEXT-MAP.md` when the repo has
   multiple contexts) and `docs/adr/*` in the touched area. Respect ADRs unless
   a verified trigger justifies reopening one. Challenge glossary conflicts
   immediately ("glossary defines X as A, but the diff/user means B — which is
   it?"), sharpen fuzzy terms with concrete edge-case scenarios, and
   cross-check stated behavior against the code ("you said partial cancellation
   is possible, but the code cancels entire orders — which is right?").
3. Tooling config: package/build manifests, formatter/linter/typecheck config, test runner config, CI workflows, codegen config.
4. Adjacent code and tests around the changed files.
5. Existing implementations of similar behavior elsewhere in the repo.
6. Recent git history for similar changes when a convention is unclear.

Do not read third-party/framework source, generated files, `node_modules`, vendored code, or large docs unrelated to the changed surface.

## Pattern reuse gate

Before accepting new code, new abstractions, or new behavior in the diff, answer:

1. **Search** — How is this already done here? Search the whole repo, the same module, and adjacent tests. Use at least three keyword variants: the domain concept, the technical operation, and the expected helper/pattern name.
2. **Identify** — What helper, type, service, component, command, error pattern, test style, or module boundary already exists?
3. **Decide** — Follow the existing pattern, consciously diverge because it is harmful or inapplicable, or note that the change establishes a new precedent.

Consistency beats local preference. If the existing pattern is mediocre but not harmful, follow it. If diverging is necessary, surface that as a deliberate decision in the final report.

## Architecture and domain checks

Ask these against the diff:

- Does the changed code live in the module/layer the project expects for this concern?
- Does it introduce a dependency direction the repo usually avoids?
- Does it leak persistence, transport, framework, or generated types across a boundary the repo keeps clean?
- Does it duplicate a canonical helper, domain calculation, validation rule, state transition, or component pattern?
- Does it respect the repo's domain invariants, including product-specific calculations, workflow states, tenant boundaries, rollout compatibility, or data retention rules?
- Does it follow the repo's test style and verification expectations for this kind of risk?

When project context conflicts with generic best practices, project context wins unless it would create a verified correctness, security, or legal/compliance problem. Report the conflict instead of silently overriding it.

## Durable learning

If `moes` discovers a useful project rule that is not documented, do not silently write it into standing instructions during the pipeline. Note it in the retro and ask whether to save it to `CLAUDE.md` / `AGENTS.md` or another project doc. The user owns durable project policy. `CONTEXT.md` is glossary-only (no implementation details), created lazily when the first term resolves. Offer an ADR only when all three hold: hard to reverse, surprising without context, and the result of a real trade-off — otherwise skip it.

## Quick checklist

- [ ] Relevant project instruction files read.
- [ ] Architecture boundaries and dependency rules captured.
- [ ] Similar prior art searched with multiple keyword variants.
- [ ] Domain-specific invariants captured when the diff touches product logic.
- [ ] Tooling/test/doc conventions captured.
- [ ] Unknown or missing project guidance recorded instead of guessed.
- [ ] Later phases use this capsule, not only generic best-practice references.
