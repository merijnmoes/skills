# Simplify

Phase 2 of `big-review` (improve clarity, remove accidental complexity). Make the changed code easier to read **without changing what it does**. Applies to the changed code in the diff, not the whole repo. Many diffs are already simple — say so and move on rather than manufacturing churn. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Where this phase sits
Phase 2 is the middle rung of the three improve phases — between language idioms and structural change. Keep to your own rung:
- **Language idioms belong to Phase 1** (`best-practices/*`). "Use `const`", "prefer the `function` keyword", "type the return" are per-language rules, not general clarity.
- **Structural change belongs to Phase 3** (`refactoring.md`). Extracting a function, moving behavior to another module, de-duplicating shared *knowledge*, introducing a type — those reshape the code across boundaries and need the test suite as a safety net.
- **Phase 2 is local clarity**: single-location rewrites whose equivalence you can *see*.

## The discipline (the equivalence test)
Phase 2 has **no test gate** — and that is only safe because every change here is one whose behavior preservation is *visible on inspection*. That gives you the dividing line:

> If you can see at a glance that the rewrite is equivalent, it is a Phase 2 simplify. If you'd need to run the tests to convince yourself behavior held, it is a Phase 3 refactor — kick it there, don't do it here.

- Smallest change that clarifies. Don't rewrite working code wholesale.
- One concern at a time, so each edit stays obviously equivalent.
- Don't trade nesting for cleverness — see the ethos below.

## Clarity ethos
- **Clarity over brevity.** Fewer characters is not the goal; fewer things to hold in your head is. Reject "clever" code that trades reader time for line count.
- **No dense one-liners.** Nested ternaries, chained side effects, and packed comprehensions that need a second read are *less* simple, not more.
- **Names carry intent.** A precise name removes the need for a comment and for the reader to reconstruct meaning from usage.

## Targeted cleanup cues
Use these cues to scrutinize the changed code, not as a style checklist. Confirm the behavior and local conventions before editing.

- **Unnecessary comments** — remove comments that merely restate code or are inconsistent with local style. Keep explanations of why, invariants, non-obvious constraints, and public contracts.
- **Redundant defensive code** — check whether a guard, fallback, or `try`/`catch` duplicates a guarantee already established on a trusted path. Remove it only when that guarantee and unchanged observable error behavior are clear; retain validation and error handling for untrusted inputs.
- **Type escapes** — question a cast to `any` when it only silences a type error. Prefer a small correction using existing types; do not hide the error or redesign a type boundary in this phase.
- **Needless nesting** — use the arrow-shaped nesting check above; flatten with an early exit only when the equivalent control flow is obvious.
- **Local consistency** — compare the changed code with the surrounding file and project conventions. An unusual pattern is not automatically wrong, and personal style preferences are not findings.

These are inspection prompts, not permission for broad cleanup. Preserve behavior in this phase; if the fix needs tests to establish equivalence, route it to Phase 3. A proven bug must follow Big Review's normal finding and fix gates rather than being treated as a style cleanup.

## Local-simplification catalog
Each: what it is → the fix. Act only when the result is plainly equivalent and plainly clearer.

- **Arrow-shaped nesting** — conditionals indented several levels → invert the condition and `return`/`continue` early to flatten the happy path. *(If flattening the body would require extracting a function, that's Phase 3 — leave it.)*
- **Redundant `else`** — an `else` after a branch that already `return`s/`throw`s/`break`s → drop the `else`, de-indent the body.
- **Dead code** — unreachable branches, unused variables, parameters, or imports → delete; version control remembers.
- **Magic literal** — an unexplained number/string carrying meaning → name it as a constant.
- **Needless temp** — a one-use intermediate that doesn't name anything useful → inline it. *(Keep the temp when its name explains an opaque expression — that's clarity, not clutter.)*
- **Convoluted boolean** — double negation, `=== true`, redundant conditions, or a condition begging for De Morgan → simplify to the plainest equivalent.
- **Nested ternary** — a ternary inside a ternary → an `if`/`else`, a lookup table, or a `switch`.
- **Loop restating a stdlib op** — a manual accumulate/find/transform loop → the standard `map`/`filter`/`reduce`/`sum`/`any`/`some` — **only when it reads clearer**, never to show off.
- **Vague local name** — `data`, `tmp`, `x`, a misleading name → rename to what it holds.
- **Comment restating the code** — a comment that narrates *what* the next line does → delete it; keep only comments that explain *why*.

## Rationalizations to reject
- **"Shorter means simpler."** Fewer characters are not the goal. If the new
  form increases reading cost, it is a regression.
- **"While I'm here, I should clean up nearby code too."** Stay in the diff.
  Unrelated cleanup is scope creep wearing a tidy face.
- **"This feels equivalent."** If equivalence is not obvious on inspection, it
  does not belong in the no-test-gate phase.

## When NOT to simplify (scope restraint)
- **Equivalence not obvious? It's not Phase 2.** Anything you can't verify by reading is a Phase 3 refactor or out of scope — don't risk a silent behavior change under the no-test-gate phase.
- **Don't over-compress.** If a "simplification" makes the next reader pause, you've gone backwards. Stop at clear.
- **Stay in the diff.** Don't rename or rework untouched code that merely sits near the change — that's scope creep and a classic regression source.
- **Conventions win.** When a clarity rule conflicts with established project style, follow the project and note it.
- **"Already simple" is a real outcome.** Reporting that the changed code needs no simplification is more useful than inventing edits.
