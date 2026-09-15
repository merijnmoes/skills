# Refactor assessment

Phase 3 of `moes` (fix structural problems) and the structural-regression lane of Phase 4 (flag them, read-only). Assess the changed code for structural problems and, in Phase 3, fix ONLY those that genuinely improve it. Many changes need no refactor at all — don't manufacture work to look thorough. Applies to the changed code in the diff, not the whole repo. The Phase-0 project context capsule and standing project instructions always override these generic rules.

For smaller cross-language design smells that may or may not rise to the level
of a refactor, also see `universal-quality.md`.

Local clarity fixes — flattening with guard clauses, deleting dead code, naming magic numbers, renaming a local — belong to **Phase 2** (`simplify.md`), whose equivalence is visible on inspection. This phase is for *structural* change whose behavior preservation needs the test suite to prove it.

## Architecture vocabulary

Use these terms exactly when naming structural findings — don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point:

- **Module** — anything with an interface and an implementation: function,
  class, package, subsystem, or slice. *Avoid*: unit, component, service.
- **Interface** — everything a caller must know to use a module correctly:
  types, invariants, ordering, error modes, required config, and performance
  expectations. *Avoid*: API, signature (too narrow — they refer only to the type-level surface).
- **Implementation** — the code inside a module. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.
- **Depth** — leverage at the interface. A **deep** module hides substantial
  behavior behind a small interface; a **shallow** module exposes an interface
  nearly as complex as its implementation.
- **Seam** — where a module's interface lives; a place behavior can vary
  without editing the caller. Where to put the seam is its own design decision, distinct from what goes behind it. *Avoid*: boundary (overloaded with DDD's bounded context).
- **Adapter** — a concrete implementation satisfying an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).
- **Leverage** — what callers get from depth: more behavior per interface fact
  they must learn.
- **Locality** — what maintainers get from depth: change, bugs, knowledge, and
  verification concentrate in one module.

Relationships:

- A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

Rejected framings:

- **Depth as ratio of implementation-lines to interface-lines**: rewards padding the implementation. Use depth-as-leverage instead.
- **"Interface" as the TypeScript `interface` keyword or a class's public methods**: too narrow — interface here includes every fact a caller must know.
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.

Prefer this vocabulary over vague claims like "cleaner architecture" or
"easier to maintain." If `CONTEXT.md` defines domain terms for the changed
surface, combine that vocabulary with these architecture terms.

## The discipline (non-negotiable)
Refactoring preserves behavior. It changes structure — never what the code does. The two are separate activities; mixing them hides bugs.
- A passing test suite is the safety net that proves behavior held. If there are no tests covering the code you want to restructure, you are *editing*, not refactoring — either add a characterization test that pins the current behavior first, or flag the gap and defer the change.
- Work in small steps. After each structural change the tests must still pass; if they go red, you broke behavior — back out and take a smaller step.
- In `moes` the pipeline does not write git. Do **not** create separate commits for refactors. Just keep the changes coherent and reversible so the overall diff stays reviewable.

## Priority model
Triage every candidate against this. Effort and risk are part of the decision, not just severity.
- **Critical — fix now**: knowledge duplication that will drift out of sync; a function doing several unrelated things; nesting so deep that only an extraction — not a Phase 2 guard clause — can resolve it. These actively cause bugs and block understanding.
- **High — fix if low-risk**: long parameter lists hiding a missing type; functions over ~30 lines doing too much; primitive obsession in a core domain type. Worth doing when the fix is safe and local; defer if it would sprawl.
- **Nice — only if trivial**: cosmetic structural tidy-ups directly in the changed lines.
- **Skip**: code that is already clean; any cosmetic churn in code the change didn't touch; pure local-clarity nits — those are Phase 2's (`simplify.md`).

## DRY means knowledge, not code
DRY is about a single source of truth for a piece of *knowledge*, not about eliminating similar-looking text.
- Abstract only when the same *business concept* lives in both places and would have to change in both at once. That shared concept is the thing worth naming once.
- Two fragments that merely look alike but represent *different* concepts must stay separate. Merging them couples things that should evolve independently — and when one needs to change, you'll either fork the abstraction back apart or distort it with flags. A premature abstraction is worse than the duplication it replaced. When unsure, prefer the duplication and wait for the third occurrence to reveal the real pattern.

## Rationalizations to reject
- **"I can imagine a cleaner architecture."** `moes` is not a license to
  pursue every architectural idea that occurs to you.
- **"This duplication looks similar enough."** Similar text is not shared
  knowledge. Only abstract when the underlying concept really needs one home.
- **"I'll add flexibility now for later."** Speculative seams, wrappers, and
  ports are cost today for a future that may never arrive.

## When NOT to refactor
- **Don't refactor purely to enable testing.** If code is hard to test, the design is telling you something — fix the design (inject the dependency, split the responsibility), don't bolt on seams just to reach private state. A deep module may still have **internal seams** (private to its implementation, used by its own tests) alongside the **external seam** at its interface — that is fine. What is not fine is exposing internal seams through the external interface or adding test-only hooks past it.
- **Don't add speculative flexibility** for imagined future needs (YAGNI). Generality you don't need today is cost you pay today.
- **Don't bundle unrelated cleanup** into a feature change. It bloats the diff, muddies review, and entangles a revert. Note it and leave it.
- **Restructuring the feature's own placement is not "unrelated cleanup."** Moving *this diff's* logic to the module/seam/layer where it belongs is feature work, not cleanup: flag it always, fix it in Phase 3 where localized and test-gated, and where it changes the diff's shape carry it as NEEDS REVISION with a placement sketch (cluster rule below) instead of broadly restructuring inside hardening. Only restructuring *untouched neighbors* is out of scope.
- **Don't refactor untested code** without first establishing a safety net (see the discipline above).
- **Don't turn `moes` into repo-wide architecture review.** If the changed
  code reveals a broader deepening opportunity outside the diff, record it as a
  `Plan` or `Investigate` finding only when it materially affects the changed
  work. Do not fix it inside final hardening.

## Code-smell catalog
Each: what it is → the fix.
- **Long method** — does too much to hold in your head → extract the cohesive pieces into named methods.
- **Duplicated knowledge** — the same business rule expressed in two places → extract the shared concept to one home (only if it *is* one concept; see DRY above).
- **God class** — one type owning many responsibilities → split by responsibility into focused collaborators.
- **Long parameter list** — params that travel together as a hidden concept → introduce a parameter object / value object.
- **Feature envy** — a method that reaches into another object's data more than its own → move the method to the data it uses.
- **Primitive obsession** — meaning/validation carried in bare strings/numbers → introduce a domain type that owns it.
- **Inappropriate intimacy** — two classes entangled in each other's internals → reduce coupling via a clear interface or by relocating behavior.

## Module depth & the deletion test
Three heuristics for judging whether an abstraction earns its place — and whether a change should add one:
- **Prefer deep modules.** A module earns its keep by hiding real complexity behind a small interface. A *shallow* module — whose interface is about as large as its implementation — is mostly indirection: it adds a hop without hiding anything. When a change introduces a wrapper or layer, check it actually hides complexity rather than just forwarding calls.
- **The deletion test.** Imagine deleting the abstraction. If the complexity simply vanishes, it was a pass-through — inline it. If the complexity reappears, duplicated across several callers, it was doing real work — keep it. This separates indirection-worth-removing from duplication-worth-abstracting without guessing.
- **One adapter is a hypothetical seam; two are a real one.** Don't introduce an interface/port for an *imagined* second implementation — that's speculative flexibility (YAGNI, see above). Add the seam when the second real implementation actually arrives; until then the concrete dependency reads clearer.
- **The interface is the test surface.** If useful tests must reach past the
  interface into implementation details, the module may be the wrong shape.
  Treat that as a deepening signal, not a reason to add test-only hooks.

## Structural regression (diff-scoped) — the Phase 4 lane
Separate from "is there a pre-existing smell worth fixing" (above), ask the sharper question: **did *this change* leave the structure worse than it found it?** A diff can be locally correct and still degrade the codebase. Flag these as findings:

- **Ad-hoc branching tangled into an unrelated flow** — a feature-specific `if`/special-case bolted onto a general code path that didn't need to know about this feature. The logic belongs in its own abstraction, not woven through a shared path.
- **Feature logic leaking into a general-purpose module** — a generic utility/helper/base class that now contains knowledge of a specific feature or caller. General code should not depend on its specific consumers.
- **File bloat from the change** — the change pushed a file well past a coherent size (a rough flag: crossing ~1,000 lines, or growing a file that was already too large) instead of extracting the new behavior into a focused unit. Judge it against where the file *should* have split, not an absolute line count.
- **Canonical helper duplicated** — the change reimplements something the repo already has one home for, instead of reusing it (ties to `codebase-fit.md`). A second near-copy is a future divergence bug.
- **Boundary leak** — persistence/transport/framework types crossing a layer the project keeps clean, or a shortcut import across a maintained module boundary (ties to `best-practices/general-oop.md` and `codebase-fit.md`).
- **Magic obscuring simple structure** — clever indirection, reflection, or over-generalization the change introduced where a direct, plain implementation would read clearer.
- **Type-boundary cleanliness regression** — the change adds a cast, `any`/`unknown`, unnecessary optionality, or a silent fallback (`?? default`, a swallowed branch) that papers over an unclear invariant instead of making the boundary explicit. Flag when the obscured contract makes the code harder to reason about — the language idioms in `best-practices/typescript.md`/`python.md` catch the lint-level cases; this lane is for the *design* smell where the fallback hides what the real invariant should be (ties to `best-practices/general-oop.md`).

**Cluster rule — patched in, not designed in.** When ≥2 signals from the list
above (or 1 signal plus a Q2 bandaid verdict) cluster in one diff, escalate them
as one coherent finding instead of scattered notes: title it "Feature X patched
in, not designed in" and carry the mechanism — knowledge scattered over N
places (count them), the next likely variant touching M files (count them), and
the cheaper alternative as a concrete placement sketch (which module/seam should
host this, and why). Severity follows the risk lane: yellow/red → `blocking`
(NEEDS REVISION until restructured or the user explicitly accepts the debt);
green → non-blocking `Plan` for later. Either way it stays visible — silently
dropping a cluster is forbidden (cf. judgement-not-skipping in `SKILL.md` and
downgrade-rather-than-delete in `findings-lifecycle.md`). A single isolated
signal keeps its normal per-signal handling; the cluster rule only fires on
accumulation.

**Single hard violation — one is enough to block.** On yellow/red diffs, a
single surviving hard violation also blocks (NEEDS REVISION) without waiting
for a cluster: canonical-helper duplicated, second competing pattern for
something the repo already solves one way, boundary leak across a maintained
seam/layer, or feature logic leaking into a general-purpose module. Each must
carry location, mechanism, concrete maintenance cost (who pays, on the next
likely variant), and a cheaper placement sketch — taste-only claims never
block. Green-lane singles stay non-blocking `Plan`.

**Scope restraint — read this so the lane doesn't overreach.** This is the *restrained* version of an aggressive structural review, deliberately scoped to fit `moes`:
- It is **diff-scoped**. Judge the structure the change touched or added. Do **not** flag (or rewrite) untouched code that merely happens to be near the diff — that is scope creep and a common way to introduce regressions.
- **Behavior preservation and minimality still govern.** The point is to catch *degradation the change caused*, not to mandate ambitious rewrites or treat "I can imagine a cleaner architecture" as a blocker. "Design over working code" is explicitly **not** the `moes` posture.
- A structural-regression finding **blocks only if it survives `findings-lifecycle.md`** — name the concrete maintenance hazard (the future bug, the path that's now hard to change safely), not an aesthetic preference. Clear, low-risk regressions can be fixed in Phase 3; the rest are flagged with severity and confidence and left for the user.
- **The feature's own placement is in scope; neighbors are not.** Judging whether *this change's* logic sits in the right module/seam/layer is the lane's core job (see the "not unrelated cleanup" bullet under When NOT to refactor). Rewriting untouched neighboring code to match is scope creep either way.
- **The bar is no *new* patchwork.** This diff must not leave the structure worse than it found it. Pre-existing mess the feature touches may be named as `surfaced` context at most — never as a requirement.

## Assessment output
Produce a short assessment, not a wall of text. List each candidate with its **priority** (Critical/High/Nice/Skip), a **DECISION** (fix now / defer / skip), and a one-line reason. Then act only on the "fix now" items.

When a candidate is broader than the current diff, phrase it as a scoped future
deepening opportunity:

- **Module / files** — where the friction appeared
- **Problem** — what shallow interface, seam leak, or locality loss the diff
  exposed
- **Dependency category** — in-process (pure computation, deepen freely) /
  local-substitutable (local stand-in exists, seam stays internal) /
  remote-owned (own service across network: port + production/test adapters) /
  true-external (third-party: injected port, mock adapter in tests)
- **Test strategy** — replace, don't layer: new tests at the deepened module's
  interface asserting observable outcomes; old shallow-module unit tests deleted
  once the interface tests exist
- **Why not now** — why it is broader than final hardening
- **Next action** — `Plan`, `Investigate`, or `Decide`

If the user later wants to pursue the deferred deepening, explore alternative
interfaces first (e.g. parallel sketches optimized for minimal interface vs
flexibility vs the common caller) and compare them on depth, locality, and
seam placement before committing — do not do this exploration inside `moes`.

It is a valid — and common — outcome to conclude **"no refactor needed."** Say so plainly and move on. Reporting clean code honestly is more useful than inventing changes.
