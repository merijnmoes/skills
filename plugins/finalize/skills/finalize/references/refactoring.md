# Refactor assessment

Phase 3 of `/finalize`. Assess the changed code for structural problems and fix ONLY those that genuinely improve it. Many changes need no refactor at all — don't manufacture work to look thorough. Applies to the changed code in the diff, not the whole repo. Project conventions in CLAUDE.md always override these rules.

## The discipline (non-negotiable)
Refactoring preserves behavior. It changes structure — never what the code does. The two are separate activities; mixing them hides bugs.
- A passing test suite is the safety net that proves behavior held. If there are no tests covering the code you want to restructure, you are *editing*, not refactoring — either add a characterization test that pins the current behavior first, or flag the gap and defer the change.
- Work in small steps. After each structural change the tests must still pass; if they go red, you broke behavior — back out and take a smaller step.
- In `/finalize` the pipeline does not write git. Do **not** create separate commits for refactors. Just keep the changes coherent and reversible so the overall diff stays reviewable.

## Priority model
Triage every candidate against this. Effort and risk are part of the decision, not just severity.
- **Critical — fix now**: knowledge duplication that will drift out of sync; nesting deeper than ~3 levels; a function doing several unrelated things. These actively cause bugs and block understanding.
- **High — fix if low-risk**: magic numbers; unclear or misleading names; functions over ~30 lines. Worth doing when the fix is safe and local; defer if it would sprawl.
- **Nice — only if trivial**: minor naming nits, cosmetic tidy-ups directly in the changed lines.
- **Skip**: code that is already clean; any cosmetic churn in code the change didn't touch.

## DRY means knowledge, not code
DRY is about a single source of truth for a piece of *knowledge*, not about eliminating similar-looking text.
- Abstract only when the same *business concept* lives in both places and would have to change in both at once. That shared concept is the thing worth naming once.
- Two fragments that merely look alike but represent *different* concepts must stay separate. Merging them couples things that should evolve independently — and when one needs to change, you'll either fork the abstraction back apart or distort it with flags. A premature abstraction is worse than the duplication it replaced. When unsure, prefer the duplication and wait for the third occurrence to reveal the real pattern.

## When NOT to refactor
- **Don't refactor purely to enable testing.** If code is hard to test, the design is telling you something — fix the design (inject the dependency, split the responsibility), don't bolt on seams just to reach private state.
- **Don't add speculative flexibility** for imagined future needs (YAGNI). Generality you don't need today is cost you pay today.
- **Don't bundle unrelated cleanup** into a feature change. It bloats the diff, muddies review, and entangles a revert. Note it and leave it.
- **Don't refactor untested code** without first establishing a safety net (see the discipline above).

## Code-smell catalog
Each: what it is → the fix.
- **Long method** — does too much to hold in your head → extract the cohesive pieces into named methods.
- **Duplicated knowledge** — the same business rule expressed in two places → extract the shared concept to one home (only if it *is* one concept; see DRY above).
- **God class** — one type owning many responsibilities → split by responsibility into focused collaborators.
- **Long parameter list** — params that travel together as a hidden concept → introduce a parameter object / value object.
- **Feature envy** — a method that reaches into another object's data more than its own → move the method to the data it uses.
- **Primitive obsession** — meaning/validation carried in bare strings/numbers → introduce a domain type that owns it.
- **Magic numbers** — unexplained literals → replace with named constants.
- **Nested conditionals** — arrow-shaped indentation → guard clauses / early returns to flatten the happy path.
- **Dead code** — unreachable or unused branches, vars, params → delete it; version control remembers.
- **Inappropriate intimacy** — two classes entangled in each other's internals → reduce coupling via a clear interface or by relocating behavior.

## Module depth & the deletion test
Three heuristics for judging whether an abstraction earns its place — and whether a change should add one:
- **Prefer deep modules.** A module earns its keep by hiding real complexity behind a small interface. A *shallow* module — whose interface is about as large as its implementation — is mostly indirection: it adds a hop without hiding anything. When a change introduces a wrapper or layer, check it actually hides complexity rather than just forwarding calls.
- **The deletion test.** Imagine deleting the abstraction. If the complexity simply vanishes, it was a pass-through — inline it. If the complexity reappears, duplicated across several callers, it was doing real work — keep it. This separates indirection-worth-removing from duplication-worth-abstracting without guessing.
- **One adapter is a hypothetical seam; two are a real one.** Don't introduce an interface/port for an *imagined* second implementation — that's speculative flexibility (YAGNI, see above). Add the seam when the second real implementation actually arrives; until then the concrete dependency reads clearer.

## Assessment output
Produce a short assessment, not a wall of text. List each candidate with its **priority** (Critical/High/Nice/Skip), a **DECISION** (fix now / defer / skip), and a one-line reason. Then act only on the "fix now" items.

It is a valid — and common — outcome to conclude **"no refactor needed."** Say so plainly and move on. Reporting clean code honestly is more useful than inventing changes.
