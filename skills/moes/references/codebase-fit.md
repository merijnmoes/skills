# Codebase fit & consistency

Used proactively in `moes` Phase 1 (match what exists *before* adding new code) and evaluatively in Phase 4 (does the change belong?). It works with the Phase-0 project context capsule from `project-context.md`. A change can be individually correct yet wrong for *this* codebase — it duplicates an existing helper, introduces a second way to do something the project already does one way, ignores an established pattern, or crosses a module boundary. Consistency is what keeps a codebase legible as it grows, so fit matters as much as local correctness. Project conventions and documented domain rules always win.

For a compact catalog of cross-language code smells that often accompany fit
problems, also see `universal-quality.md`.

## Find prior art first
- Before writing or approving anything new, look at how the project already solves this: existing utilities/helpers/services, a similar existing feature, the established pattern for this kind of work, the naming and error-handling style, how dependencies get wired. Grep for the concept and read a couple of neighbors.
- Use a real search, not a hunch: search the whole repo, the same module, and adjacent tests with at least three keyword variants (domain term, technical operation, likely helper/pattern name). If a convention is still unclear, check recent git history for similar changes.
- Reuse the existing abstraction instead of writing a parallel one. A second helper that does what an existing one already does is a maintenance tax and a future divergence bug.

## Match established patterns
- Follow the pattern the codebase already uses for this concern, even if you'd personally do it differently — consistency beats local optimality, because the next reader pattern-matches against the rest of the code.
- Mirror the surrounding naming, file/folder placement, layering, and error handling so the change reads like it was written by the same hand.
- If the established pattern is genuinely harmful and this change is a reasonable place to improve it, that is a *conscious* decision to raise with the user — not something to do silently, and never a half-migration that leaves two competing patterns side by side.
- If no pattern exists, say that the change is setting precedent and judge it more carefully against the architecture and domain rules captured in `project-context.md`.

## Respect boundaries & layering
- Put the code where the architecture says it belongs (the right layer/module/package for that concern); don't add a shortcut import across a boundary the project maintains.
- Don't leak persistence/transport/framework types across boundaries the project keeps clean (ties to `best-practices/general-oop.md`).
- Respect domain boundaries too: do not move product rules, calculations, workflow states, tenant/privacy checks, or rollout compatibility assumptions into a generic helper just because the code shape looks reusable.

## Don't reinvent or duplicate
- Confirm the change isn't reimplementing something already in the repo (a date helper, an HTTP wrapper, a validation rule, a constant, a DTO).
- Use the project's existing libraries and framework features before adding a new dependency for something already available (ties to `dependency-audit.md`).

## Consistency review (Phase 4)
This lane is about *fit* — does the change match how the repo already does things. Its sibling lane, **structural regression** (`refactoring.md`), is about *degradation* — did the change make the structure worse. They're complementary: duplication and boundary leaks show up in both, so flag such an issue once in whichever lane it fits most naturally rather than reporting it twice.

In the parallel fan-out this file serves two quality lanes with split
ownership. **Q1 reuse** owns duplication and prior art: existing helper to
call instead, dead code the diff leaves behind, merged-vs-duplicated
knowledge. **Q3 consistency** owns sibling-family guards, convention drift
against a cited local example, misleading names and comments, and needless
complexity. Altitude and abstraction-fit questions (bandaid vs right depth,
downstream compensation, single-use abstraction) belong to **Q2 altitude** in
`design-quality.md`, not here — do not re-walk them.
Q1 and Q3 run under the Red-team presumption in `design-quality.md`.

Assess and flag as findings:
- Does it read like it belongs — same conventions, structure, naming, and error handling as its neighbors?
- Does it introduce a second pattern for something the codebase already solves one way?
- Would a maintainer be surprised by where things live or how they're wired?
- Does it respect the architecture boundaries, domain invariants, test style, and docs/release conventions captured in the Phase-0 project context capsule?

## Feedback guarantee (no silent dropping)

Q1/Q3 lanes always leave a traceable fit verdict. A fit observation with
location, mechanism, and concrete maintenance cost enters the shared `Finding
Set` as `non-blocking` or `deferred` (`Plan`/`Decide`) even without a runtime
repro — the trigger test in `findings-lifecycle.md` gates `blocking` status
only. Only taste-only claims without a statable cost drop at the source, and
those drops surface by name in the dismissed ledger (max 5). Consolidation,
validation gate, and final report carry every surviving fit finding forward;
the lane receipt states the fit verdict explicitly (`no fit issues`, or N
findings with ids) so an empty report means "checked, clean", never "not
checked".

## Quick checklist
- [ ] Searched for prior art / existing utilities before adding new code
- [ ] Search covered whole repo, adjacent module/tests, and at least three keyword variants
- [ ] Reuses existing abstractions; no duplicate of existing functionality
- [ ] Matches established patterns, naming, placement, and error-handling style
- [ ] Code sits in the architecturally correct layer/module; boundaries respected
- [ ] Domain rules and project-specific invariants respected
- [ ] No second "way to do it" introduced (or the divergence is consciously flagged to the user)
- [ ] No new dependency for something the stack already provides
