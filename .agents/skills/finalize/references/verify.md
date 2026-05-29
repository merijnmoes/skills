# Behavioral verification

Prove the change actually works by **running it**, not just by reading it or trusting a green test suite. Type-checks and tests show code correctness; this step shows *feature* correctness. Run by the main agent (it holds the change's intent and can drive the app).

## Procedure

1. **Static gates** — run the project's formatter, linter and type-checker (detected in Phase 0). These are cheap and catch more than a human read.
2. **Test suite** — run the full suite; it must pass. Confirm new code paths are actually *covered* (an untested new path is a finding). Assess test *quality* against `testing.md` — behavior over implementation, deterministic, not over-mocked, not vacuous (asserts something real). A green-but-meaningless test is false confidence and is itself a finding.
3. **Run the app / feature** — launch it and exercise the change for real:
   - the **golden path** the change was built for (use the intent pinned in Phase 0);
   - **edge cases** — invalid input, empty states, error and permission-denied paths, boundary values;
   - **regressions** — quickly exercise adjacent features the change could plausibly affect.
   Observe actual behavior (output, UI, logs, side effects); don't infer it from the code.
4. **Accessibility** *(UI changes only)* — a keyboard-only pass plus an automated checker (e.g. axe), verifying the rules in `frontend-a11y-i18n.md` actually hold, not just that the markup looks right.
5. **Performance** *(hot-path / perf-sensitive changes only)* — follow `performance-profiling.md`: measure against realistic data, find the real bottleneck, confirm any optimisation with a before/after. Skip with a note for cold-path changes.

## When you cannot run it

If the environment can't launch the app (no runtime, missing services, no display), **say so explicitly** and mark the behavioral check as not performed — never report success you didn't observe. Fall back to the strongest evidence available (tests, a dry run, a focused harness) and record the gap for the validation gate.
