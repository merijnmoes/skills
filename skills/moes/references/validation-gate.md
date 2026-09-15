# Validation gate

Phase 7 of `moes`. You are critically evaluating a completed code change before it is considered shippable. This is the final sign-off — apply real engineering scrutiny, not a rubber stamp.

Its job is to answer **"given the evidence and the remaining gaps, what is the
right verdict?"** It should judge the results of `risk-mapping.md`,
`bug-hunting.md`, `verify.md`, and the project context capsule from
`project-context.md` — not restart exploratory testing from scratch.

## How to run the gate

- Treat the `verification ledger` as the primary record of what was actually
  exercised. Do not infer runtime coverage that the ledger does not show.
- If rollout-sensitive deployed behavior was in scope, check whether
  `post-deploy-monitoring.md` produced a canary-style observation or an
  explicit `not run because no environment` gap. Do not treat local-only proof
  as equivalent evidence when a deployed runtime check was the meaningful risk.
- If container behavior, deployment sequencing, or rollout overlap assumptions
  were in scope, check whether `docker-deployment.md` captured concrete
  evidence or an explicit gap. Do not silently treat an unexercised rollout
  assumption as safe.
- If a UI diff clearly warranted `browser-qa.md` but that evidence was not
  gathered, carry it forward as an explicit evidence gap. This includes both
  no runnable environment and cases where the environment existed but the lane
  still was not run; do not assume success from static review alone.
- Produce a `decision packet` as the gate's output bundle: evidence summary,
  surviving findings, verification coverage, residual unknowns, and verdict
  rationale.
- Explicitly check **every** item below and reason about each one briefly and clearly.
- Flag any issue you find. Do **not** assume correctness without verification — lean on the evidence gathered in Phase 6 (lint/type-check, test results, observed app behavior).
- Treat the change's diff against the base branch as the primary source of truth. Use only repository context that was captured explicitly in the gathered evidence, especially the Phase-0 project context capsule. Do not speculate beyond the diff, captured context, and verification results. If something is ambiguous because relevant context is missing, flag it as a risk rather than guessing.
- **Apply the findings lifecycle discipline.** Anything that would push the verdict to `NEEDS REVISION` or `BLOCKED` must survive `findings-lifecycle.md` first — a concrete, reachable trigger, not a hunch. A finding you can't reproduce is a low-confidence note, not a blocker, and every surviving finding gets the right next action: Fix, Investigate, Plan, or Decide.
- **Label every finding** with a **severity** (Critical/High/Medium/Low) and your **confidence** (High/Medium/Low) that it's real. Calibrate severity by blast radius: **Critical** = data loss/corruption, a security breach, or a broken core flow with no workaround; **High** = a real defect on a common path, or a meaningful security/correctness gap; **Medium** = a narrower or lower-likelihood issue, or one with a reasonable workaround; **Low** = minor, cosmetic, or easily avoided. Low-confidence items can be surfaced but should not block on their own.
- **Order findings by business impact, not code elegance.** A data-corruption path that ships matters more than an inelegant abstraction. Lead the verdict with what actually harms the user or the business.
- **Be honest about tool limits.** A green static-analysis or static-intelligence
  pass is supporting evidence, not proof of absence. Interpret tool output in
  light of what it actually covered, what it can miss, and what the environment
  prevented you from exercising.
- This checklist is necessary but **not exhaustive** — after it, apply your own judgement and look for risks it doesn't name (the required final step below). Treat the checklist as a structure for thought, not a substitute for a risk-led bug hunt. But do that by evaluating the gathered evidence and explicit gaps, not by opening a fresh unbounded review loop here.

## Rationalizations to reject

- **"The tests passed, so ship it."** Passing tests matter, but they do not
  prove the *right* risks were exercised.
- **"Nothing failed, so coverage must be enough."** Unexercised high-risk areas
  remain open risks until disproven.
- **"The tools were green, so the problem is probably not there."** Tool output
  is evidence, not absolution.
- **"The tests were listed, so coverage must exist."** Discovery runs (`--list`, `--collect-only`, `--dry-run`) prove the runner found tests, not that they passed. Only a real execution with an observed pass/fail result counts.
- **"The user can run the suite."** Delegating a runnable check to the user is not verification. The ledger must show the agent ran it, or an explicit environment-blocked gap with a `Decide` follow-up.
- **"This is probably fine."** Verdicts need concrete justification from
  evidence, not a confident tone.

## Verdict calibration

Do not choose the verdict by vibe. Calibrate it explicitly:

- **BLOCKED** — a serious problem prevents shipping at all: data loss/corruption,
  a real security breach/external exploit path, a broken core flow with a clear
  trigger, a dangerous migration/rollout path with no safe mitigation, a
  critical accessibility failure on a changed UI path, a confirmed
  exploit-driven workflow vulnerability, an unresolved red-lane
  threat-model finding that leaves a serious residual risk, or a failed
  verification gate on a critical path.
- **NEEDS REVISION** — the change mostly works but still has issues worth fixing
  before merge: a confirmed non-catastrophic correctness bug, missing required
  coverage on a high-risk new path, a spec gap, a risky but bounded config/doc
  mismatch, a serious App Store reviewability issue, an unresolved red-lane
  threat-model finding that is important but not fully blocking, a surviving
  structural-regression or codebase-fit hard violation on a yellow/red diff
  (single canonical-duplication, second pattern, boundary leak, or feature-in-general-module
  with mechanism plus maintenance cost plus placement sketch, or a patched-in cluster),
  or a residual
  risk too important to leave implicit.
- **READY TO SHIP** — relevant gates are green, all registered `run` audit lanes actually completed (no pending or late-missing lane), new integration and renderer paths are tested (not just reasoned about), the top risks from the risk map
  were meaningfully exercised, no confirmed blocking findings remain, and any
  residual risks are explicitly small, bounded, and acceptable. The ledger must show the required suites were really executed on the final code state with an observed pass/fail result — discovery-only, delegated-to-user, or `flaky`/`infra` entries never satisfy this. When the diff touched an E2E/browser-covered journey and that suite was configured with a reachable target, its real result must be in the ledger; otherwise the verdict is at most NEEDS REVISION with the gap named. A corroborated HIGH (a second independent audit also rates it HIGH) can never be closed as residual risk without a concrete trigger, a reproducible example, an explicit Fix/Investigate/Plan/Decide decision, and fresh verification after any fix.

When in doubt, name the exact reason the issue changes the verdict. "Feels
unfinished" is not enough.

## Checklist

### 1. Functional correctness
- Behaves correctly for the intended use case.
- Core logic is correct, not merely syntactically valid.
- Edge cases handled: empty input, nulls, invalid states.
- No obvious logical errors or inconsistencies.
- For changed UI flows, accessibility verification evidence exists and no
  critical accessibility failure remains unresolved.

### 2. Tests & regression safety
- Existing tests still pass (or equivalent reasoning confirms no breakage).
- New functionality is covered by appropriate tests.
- The **test type matches the risk**: unit for logic, integration for wiring/state, E2E/browser only where the journey itself is the risk.
- A green existing suite never substitutes for missing coverage on new integration or renderer paths. If the diff adds a new integration seam or a new renderer/formatter and that path has no test, that alone blocks READY TO SHIP — even when the full suite is green.
- Bug fixes and high-risk edge cases have a replayable regression test or a clearly stated reason why one could not be added now.
- No regression introduced in related components.
- Critical paths verified with concrete examples.

### 3. Code quality & maintainability
- Readable and follows project conventions.
- No unnecessary complexity or over-engineering.
- No duplicated logic that should be abstracted or reused.
- Project-specific coding, testing, and documentation conventions from the Phase-0 context capsule are respected.
- For JS/TS-related changes, static-intelligence evidence has been considered: no confirmed changed-code dead code, unresolved/duplicate exports, stale suppressions, or new clone/complexity hotspots remain unaddressed.
- Interfaces and abstractions are clean and consistent.
- Changes are minimal and focused (no unrelated edits).

### 4. Integration safety
- Integrates cleanly with existing architecture.
- No broken contracts between modules or APIs.
- Architecture boundaries, dependency direction, and domain boundaries captured in the Phase-0 context capsule are respected.
- No module-graph, workspace dependency, client/server boundary, or framework entry-point regression was introduced by the diff.
- No unintended side effects in unrelated parts of the system.
- Build system / CI / tooling remains compatible.

### 5. Security & safety
- No injection vulnerabilities (SQL, shell, eval, template injection, etc.).
- No unsafe handling of untrusted input.
- No secrets exposed, logged, or hardcoded.
- File system and network access are safe and intentional.
- Any dependencies introduced are safe and justified.
- For relevant diffs, focused security lanes were considered: API, auth/session, input/upload/output, workflow/release, configuration, observability, migration safety, and agent/LLM behavior.
- Confirmed exploit-driven workflow vulnerabilities and unresolved red-lane
  threat-model findings are carried into the verdict explicitly rather than
  left as vague concerns.
- Trust-boundary diffs carry either a threat-model escalation or a why-not note; a missing both is a gate finding.

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
- Security-sensitive and high-value actions do not disappear silently, and their signals do not leak secrets or unnecessary PII.

### 10. Minimality of change
- The solution is the simplest correct approach.
- No unnecessary refactors included.
- No unrelated improvements bundled in.
- Diff is as small as reasonably possible.

### 11. Business-risk lanes
Beyond generic correctness, sweep the diff for the failure classes that do the most real-world damage. Skip a lane with a one-line note when the change can't trigger it (e.g. no money math → no financial lane).
- **Project/domain rules** — repo-specific product invariants, workflow states, tenant/privacy boundaries, compatibility promises, and team policy captured in the project context capsule remain true. If the rule is undocumented but appears material, report the unknown instead of inventing a rule.
- **Data integrity** — silent truncation, encoding/charset corruption, precision/rounding loss, timezone/locale mishandling, partial writes that leave records half-updated, and schema/migration safety (is the migration reversible; does it lock or rewrite a large table; does old code still run against the new schema during rollout). Corrupted or lost data is often unrecoverable — weight it accordingly.
- **Idempotency & concurrency** — race conditions and TOCTOU on shared state, operations that aren't safe to retry (double-charge, duplicate row, replayed webhook), missing locks/transactions across a read-modify-write, and double-submit / at-least-once delivery assumptions. Ask: what happens if this runs twice, or two of these run at once?
- **Financial / quantitative correctness** *(only where the change touches money, billing, quotas, or other quantitative invariants)* — currency and unit consistency, rounding direction and accumulation error, off-by-one on quotas/limits, and sign/overflow on balances. A wrong number that looks plausible is worse than a crash. Trace the full unit chain source → calculation → aggregation → rounding → formatting → caption/helptext, and compare sibling indicators sharing labels or helptext for scale mismatches (per-day vs per-week, per-person vs total, absolute vs percentage). A unit/scale mismatch is a correctness/spec finding, not a cosmetic note. For any new breakdown/total UI (totals with line items, percentages, quotas): require (a) a pure-calculation test, (b) a non-zero aggregation test, (c) a renderer/formatter test, (d) a zero/fallback test, and (e) a consistency test proving total, rounded lines, and percentages agree. Actively hunt: total from a different source than the lines; normalization or fallback masking a data problem; rounded values that no longer sum; a percentage shown for a rounded-to-zero value; a visible category permanently stuck at zero; a mock that bypasses the real integration code entirely. Prefer one canonical source for total and breakdown; treat defensive normalization as suspect until the underlying invariant is proven, not as an automatic improvement.
- **Configuration / rollout safety** — defaults are safe, missing config fails safely, feature flags have explicit fallback behavior, and deployment sequencing does not silently weaken security or correctness.
- **Container / deployment assumptions** — when Docker, Compose, health checks,
  or rollout mechanics changed, the gate distinguishes reviewed overlap and
  readiness assumptions from `not exercised` gaps rather than collapsing both
  into a generic green result.
- **Post-deploy runtime evidence** — when the diff changed deployed behavior, assets, transport, or rollout-sensitive config, the gate distinguishes `run and healthy` from `run with warnings` and from `not run because no environment`.
- **Workflow / release safety** — trusted event assumptions, secret/token exposure,
  artifact trust, and exploitability of changed automation paths are understood;
  confirmed exploit-driven workflow vulnerabilities can block.
- **Accessibility** *(for UI diffs)* — changed user journeys remain keyboard-,
  focus-, and automation-verifiable; critical accessibility failures can block.
- **App Store reviewability** *(when relevant)* — changed reviewer-facing setup,
  account, purchase, entitlement, or metadata surfaces remain reviewable; serious
  App Store reviewability issues require revision.

### 12. Final sanity check
- If reviewing this in production, you would approve it.
- No "this might break later" concerns left unaddressed.
- The feature is safe to ship or merge as-is.

## Required final step

After the checklist, you must also:
- Identify any risks, gaps, or failure modes **not** covered above.
- Bring forward residual bug hypotheses from `bug-hunting.md`, especially around timing, retries, concurrency, stale state, and invariants that broad checklists often under-specify.
- Ask whether the changed surface carries property-style expectations —
  round-trip, idempotency, monotonicity, conservation, ordering, or
  differential equivalence — and whether those expectations were actually
  exercised or remain open.
- Revisit the Phase-0 risk map and state which top risks were actually disproven, which remain open, and whether any of those open risks materially affect the verdict.
- State the audit rounds run and whether the reverse audit stopped converged or capped, and carry any capped-but-unsearched areas as residual risk.
- Name the 3 highest remaining risks even when below the blocking bar, with belowBarReason values, in residual risk (fewer than 3 only with an explicit why-no-more-risks note).
- If the surprise rule fired, state what the extra hunt targeted and what it found.
- Treat surviving architectural blockers as pushing the verdict to NEEDS REVISION at most; BLOCKED stays reserved for data loss, security breaches, and broken core flows.
- Treat surviving race-mechanism blockers the same way: NEEDS REVISION at most, never BLOCKED on mechanism alone.
- Revisit the Phase-0 project context capsule and state whether any project-specific boundary, convention, domain rule, tooling norm, docs/release convention, or unknown materially affects the verdict.
- Consider architecture-level issues, edge cases, or domain-specific concerns.
- Re-check the lane registry: any `N/A` without a why-not, or with a contradicted why-not, is a gate finding.
- An unconverted, unaccepted environment deferral on yellow/red is a gate finding.
- **Incorporate the Phase 4 spec-conformance result.** The change must be not just correct but the *right* change: a confirmed missing or partial requirement is a `NEEDS REVISION` regardless of how clean the code is (and `moes` does not implement the gap itself). Unrequested scope creep is at least a flagged item. Report Standards and Spec findings separately and name the worst issue within each axis — do not merge or rerank across axes, so one axis cannot mask the other.
- State the verdict explicitly, with a short justification:

> **READY TO SHIP** — no blocking concerns; safe to merge as-is.
> **NEEDS REVISION** — works but has issues that should be fixed first (list them).
> **BLOCKED** — a serious correctness, security, or integration problem prevents shipping (state it).

A `NEEDS REVISION` or `BLOCKED` verdict means `moes` does **not** present the change as shippable. Surface exactly what must be fixed, then the change can be re-run through the relevant phases.
