# Clean coding best-practices

Loaded in `big-review` Phase 1 for backend/business-logic changes alongside
`general-oop.md`. Applies to the changed code in the diff, not the whole repo.
The Phase-0 project context capsule and standing project instructions always
override these generic rules.

## Implementation guidelines

### Naming
- Prefer intention-revealing names. A reader should understand what a thing
  represents or does without reading its implementation first.
- Use consistent vocabulary for the same concept. If the codebase says
  `order`, don't alternate between `purchase`, `sale`, and `transaction`
  unless they truly mean different things.
- Prefer searchable, pronounceable names over short local cleverness.
- Avoid misleading abbreviations, overloaded terms, and names that hide side
  effects such as `get*` methods that mutate state.

### Functions & methods
- Keep functions focused on one job. If a function validates and transforms and
  persists, it likely needs to be split.
- Prefer explicit inputs and outputs over hidden reads and writes to shared
  state.
- Avoid flag arguments when practical. A boolean that switches behavior often
  means the function is doing more than one thing.
- Keep side effects obvious at the call site. A caller should not need to read
  the whole body to know whether data is persisted, events are emitted, or
  external systems are touched.

### Control flow
- Make the happy path easy to see. Handle invalid or edge cases early so the
  main behavior reads top-to-bottom.
- Flatten unnecessary nesting. Deep indentation often hides the real logic.
- When a conditional is hard to parse, extract a well-named helper or named
  predicate instead of leaving a dense inline expression.
- Prefer straightforward flow over clever compression; shorter is not better if
  it makes the behavior harder to read.

### Comments
- Use comments to explain why, constraints, tradeoffs, or non-obvious intent.
- Do not narrate what the code already says clearly.
- Remove or rewrite stale comments when the code changes; an outdated comment is
  worse than no comment.
- When an invariant is subtle, prefer making it explicit in code and use a
  comment only for the part the code cannot express well.

### Errors & boundaries
- Validate untrusted input at the boundary where it enters the system.
- Fail clearly and as close to the source of the problem as practical.
- Preserve useful context when returning or rethrowing errors; do not erase the
  operation, entity, or input that failed.
- Do not swallow important failures silently. If a failure is intentionally
  ignored, make that decision explicit and justified.

### Duplication & consistency
- Remove duplication of knowledge, not just duplicated text. Two branches that
  encode the same business rule in slightly different words are still
  duplication.
- Keep similar cases shaped similarly so readers can compare them quickly.
- Avoid introducing a second pattern for a job the codebase already solves one
  way unless the old way is clearly inadequate here.
- Prefer a small helper over copy-paste when the repeated logic will need to
  evolve together.

### A note on balance
Do not force every local smell into an abstraction. Inline code is often
clearer than a helper that exists only to satisfy a style rule. The goal is
clarity and maintainability in this diff, not ceremony.

## Quick checklist
- [ ] Names reveal intent and use the repo's established vocabulary
- [ ] Functions and methods have one clear purpose
- [ ] Side effects are visible rather than hidden behind innocent names
- [ ] The happy path is obvious; nesting is not doing the storytelling
- [ ] Comments explain why or constraints, not what the code already says
- [ ] Errors preserve useful context and are not swallowed silently
- [ ] Duplication of knowledge is reduced and similar cases are shaped similarly
- [ ] No new cleverness or abstraction was introduced without a clear payoff
