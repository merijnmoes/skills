# Universal quality anti-patterns

Cross-language design and implementation smells that often survive lints but
still make a diff harder to trust. Use in `moes` during Phase 1 when a
local improvement is clearly safe, and again in Phase 4 as a compact review aid
beside `codebase-fit.md` and `refactoring.md`. The Phase-0 project context
capsule and standing project instructions always override these generic rules.

## 1. Reuse before reinvention

- Search for existing helpers, adapters, constants, DTOs, query builders, and
  test utilities before accepting a new local implementation.
- A new abstraction must beat "reuse what already exists here" on clarity and
  maintenance, not just local elegance.

Red flags:
- same concept solved twice with slightly different names;
- a new helper duplicates a shared module plus one tweak;
- a dependency is added for something the stack already provides.

## 2. Parameter and flag bloat

- A growing parameter list often means a hidden concept wants a type/object.
- Boolean flags that change behavior usually mean two modes are being forced
  through one function.

Red flags:
- 4+ positional parameters that travel together;
- `do_x(..., true, false, true)`;
- `enable_*`, `is_admin_mode`, `include_hidden` style branching flags.

Prefer:
- options/value objects for cohesive configuration;
- separate functions/strategies when the boolean changes behavior materially.

## 3. Abstraction leaks

- Do not expose transport, ORM, framework, or raw upstream response shapes past
  a boundary the codebase usually keeps clean.
- Shared components and services should consume stable domain-friendly shapes,
  not whatever a lower layer happened to return.

Red flags:
- UI renders `api.data.results[0]` directly;
- domain/service layer accepts framework request objects;
- callers must know persistence-field quirks to use a helper.

## 4. Stringly typed behavior

- Important workflow states, event names, roles, modes, and action kinds should
  not be spread as ad hoc strings when the language/project has a stronger home.

Red flags:
- same string literal repeated across files;
- typo-prone event names and status values;
- branching on unvalidated free-form strings from callers.

Prefer enums, unions, named constants, or domain types where the project style
supports them.

## 5. Nested conditionals and disguised state machines

- Deep branching often hides either missing guard clauses or a state machine that
  should be modeled more explicitly.
- A diff that adds "just one more branch" to already dense code is a review
  hazard even when the logic is technically correct.

Red flags:
- nested `if`/ternary chains 3+ levels deep;
- one function branching on mode, role, status, and feature flag together;
- repeated condition bundles copied across files.

## 6. Near-duplicate variants

- Copy/paste with field-name or type-name substitutions is often duplicated
  knowledge waiting to drift.
- Do not merge fragments just because they look alike; merge only when they are
  the same concept that should evolve together.

Red flags:
- two formatters, validators, or query builders differing in one field;
- repeated update logic for parallel resources;
- parallel tests with near-identical setup and assertions.

## 7. Redundant or no-op state changes

- Writes and state updates should happen because something changed, not just
  because a code path ran.
- Unconditional writes create churn, cache invalidation, audit noise, and race
  surface with no behavioral gain.

Red flags:
- updating a record every loop iteration regardless of change;
- setting local/component state to the same derived value on every render;
- emitting duplicate events on retry/replay.

## 8. Check-then-act races

- Split "check" and "mutate" logic is suspicious on shared or external state.
- Prefer atomic operations, transactions, or explicit retry/locking patterns
  where the project already has them.

Red flags:
- existence check followed by create/delete;
- read balance/quota/counter, then mutate later;
- permission/resource checks performed before a second unscoped fetch.

## 9. Over-broad reads and writes

- Pull only the data and side effects the code path actually needs.
- Broad queries, `SELECT *`, giant payloads, and whole-object writes create
  performance, correctness, and accidental-coupling risks.

Red flags:
- fetching every row to use one field;
- loading all related objects for a list endpoint with no cap;
- overwriting whole records when a narrow patch is safer.

## 10. Shallow wrappers and speculative seams

- A wrapper that mostly forwards calls is indirection without shelter.
- A seam added for an imagined second implementation is usually cost without
  present value.

Red flags:
- interface with one implementation and no boundary pressure;
- helper whose body is one call plus renamed args;
- new layer that makes the call graph longer but does not hide complexity.

## Quick checklist

- [ ] Reused prior art instead of creating a parallel helper/pattern.
- [ ] Parameter count and behavior flags still describe one coherent concept.
- [ ] No framework/transport/persistence leak across a maintained boundary.
- [ ] Important states/events are not left as typo-prone string soup.
- [ ] Branching depth did not quietly turn one function into a state machine.
- [ ] Similar-looking code was merged only when it was the same knowledge.
- [ ] State writes are intentional, not unconditional churn.
- [ ] Check-then-act hazards were either removed or explicitly safeguarded.
- [ ] Reads/writes are scoped to what the path really needs.
- [ ] New wrappers/seams hide real complexity rather than add ceremony.

## Appendix: Fowler smell baseline (fallback only)

Use when the repo documents no coding standards (`CODING_STANDARDS.md` / `CONTRIBUTING.md` missing or silent). Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.
