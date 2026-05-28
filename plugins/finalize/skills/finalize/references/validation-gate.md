# Validation gate

Phase 7 of `/finalize`. You are critically evaluating a completed code change before it is considered shippable. This is the final sign-off — apply real engineering scrutiny, not a rubber stamp.

## How to run the gate

- Explicitly check **every** item below and reason about each one briefly and clearly.
- Flag any issue you find. Do **not** assume correctness without verification — lean on the evidence gathered in Phase 6 (lint/type-check, test results, observed app behavior).
- Treat the change's diff against the base branch as the primary source of truth. Don't assume hidden files, unstated behavior, or repository context beyond what the diff and the gathered evidence show. If something is ambiguous because context is missing, flag it as a risk rather than guessing.
- This checklist is necessary but **not exhaustive** — after it, apply your own judgement and look for risks it doesn't name (the required final step below).

## Checklist

### 1. Functional correctness
- Behaves correctly for the intended use case.
- Core logic is correct, not merely syntactically valid.
- Edge cases handled: empty input, nulls, invalid states.
- No obvious logical errors or inconsistencies.

### 2. Tests & regression safety
- Existing tests still pass (or equivalent reasoning confirms no breakage).
- New functionality is covered by appropriate tests.
- No regression introduced in related components.
- Critical paths verified with concrete examples.

### 3. Code quality & maintainability
- Readable and follows project conventions.
- No unnecessary complexity or over-engineering.
- No duplicated logic that should be abstracted or reused.
- Interfaces and abstractions are clean and consistent.
- Changes are minimal and focused (no unrelated edits).

### 4. Integration safety
- Integrates cleanly with existing architecture.
- No broken contracts between modules or APIs.
- No unintended side effects in unrelated parts of the system.
- Build system / CI / tooling remains compatible.

### 5. Security & safety
- No injection vulnerabilities (SQL, shell, eval, template injection, etc.).
- No unsafe handling of untrusted input.
- No secrets exposed, logged, or hardcoded.
- File system and network access are safe and intentional.
- Any dependencies introduced are safe and justified.

### 6. Performance
- No unnecessary performance regressions.
- No inefficient loops, queries, or repeated work.
- Memory usage is reasonable and controlled.
- External calls are minimized and justified.

### 7. Failure handling & robustness
- Errors are handled explicitly and safely.
- System degrades gracefully when something fails.
- Partial failures do not corrupt state.
- The feature does not fail silently in critical cases.

### 8. Developer experience (DX)
- Code is understandable and easy to modify.
- Debugging the feature is straightforward.
- Error messages (if any) are actionable.
- The change does not make future development harder.

### 9. Observability & traceability
- Behavior is traceable through logs or structure.
- Key decisions or transformations are explainable.
- Failures can be debugged from available signals.
- Important state changes are visible or trackable.

### 10. Minimality of change
- The solution is the simplest correct approach.
- No unnecessary refactors included.
- No unrelated improvements bundled in.
- Diff is as small as reasonably possible.

### 11. Final sanity check
- If reviewing this in production, you would approve it.
- No "this might break later" concerns left unaddressed.
- The feature is safe to ship or merge as-is.

## Required final step

After the checklist, you must also:
- Identify any risks, gaps, or failure modes **not** covered above.
- Consider architecture-level issues, edge cases, or domain-specific concerns.
- State the verdict explicitly, with a short justification:

> **READY TO SHIP** — no blocking concerns; safe to merge as-is.
> **NEEDS REVISION** — works but has issues that should be fixed first (list them).
> **BLOCKED** — a serious correctness, security, or integration problem prevents shipping (state it).

A `NEEDS REVISION` or `BLOCKED` verdict means `/finalize` does **not** present the change as shippable. Surface exactly what must be fixed, then the change can be re-run through the relevant phases.
