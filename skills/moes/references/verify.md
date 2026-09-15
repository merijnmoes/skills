# Behavioral verification

Prove the change actually works by **running it**, not just by reading it or trusting a green test suite. Type-checks and tests show code correctness; this step shows *feature* correctness. Run by the main agent (it holds the change's intent and can drive the app).

Build the verification plan from the Phase-0 risk map and project context
capsule. Do not just "poke around" randomly: choose probes that attack the
highest-value failure modes and the project/domain invariants that matter for
this repo.

Its job is to answer **"what did we actually run, and what did we actually
observe?"** It should execute the highest-value probes suggested by
`risk-mapping.md`, `project-context.md`, and `bug-hunting.md`, not reopen broad
ideation or verdict debate.

## Verification posture

- Match the verification method to the risk shape: static analysis for some
  structural/data-flow issues, targeted tests for logic and regressions,
  runtime probes for stateful behavior, and adversarial review for
  exploitability/security claims.
- On high-risk changes, do not let one green evidence source substitute for the
  others. A passing suite, a clean linter run, or a green static lane can each
  be meaningful without being sufficient alone.
- Record what was directly observed, what is only indirectly supported by
  evidence, and what the environment prevented you from running.

## Execution discipline

- **Self-first.** Run every check yourself via the shell, harness, or app — never ask the user to run a command you can run. Escalate to the user only when blocked by credentials, interactive login, a physical device, or an explicit prohibition; then log the activity as `not-run`/`environment-blocked` with a `Decide` follow-up instead of a pass.
- **Capability + reachability first.** Before claiming E2E/browser proof, confirm the capability is configured (config file, test scripts, and specs exist per the Phase-0 inventory — e.g. `playwright.config.*` + `package.json` script + specs) and the target is reachable (baseURL responds, or the configured webServer starts). When the diff touches the E2E-covered journey **and** the suite is configured **and** the target is reachable, run the suite yourself — full suite by default, a focused subset only with an explicit why-not. A reachable target that was not exercised is a gap, never a pass.
- **Discovery is not proof.** Listing or enumerating tests (`--list`, `--collect-only`, `--dry-run`, `-l`, and equivalents) counts as discovery only. Log such runs as `not-run` with a `discovery-only` note — never as `pass`. Exception: static gates that by design do not execute tests (e.g. `tsc --noEmit`, linters, formatters) remain valid proof for their own lane.
- **Timeout with progress gets one larger retry.** When a shell timeout aborts a run that was visibly making progress (tests starting or passing, output growing), retry once on the same code state with a ~2x timeout and log it as `infra` with `attempt: 2`, the `prior` id, the raised timeout, and a quote of the progress. Without progress evidence, follow the normal `infra` path. When the larger-timeout retry still times out, propose sharding or splitting the run and carry the remainder as an `infra` gap — do not keep looping.

## Four-level assessment for new functionality

Judge new behavior on four levels separately, each with its own probe or an
explicit gap — a green level never proves the next one:

- **pure business logic** — unit probe on the calculation or rule;
- **aggregation / integration wiring** — integration probe through the real
  wiring with non-zero data (no mocked total standing in for the pipeline);
- **UI rendering and formatting** — renderer probe with real data, including
  rounding, zero, and fallback states;
- **browser / accessibility behavior** — keyboard pass plus automated checker
  (e.g. axe) where the surface is user-facing, or an explicit
  environment-blocked gap when no runnable target exists.

## Procedure

1. **Static gates** — run the project's formatter, linter and type-checker (detected in Phase 0). These are cheap and catch more than a human read.
2. **Test suite** — run the full suite yourself; it must pass. Discovery runs (`--list`, `--collect-only`, `--dry-run`) do not count — see Execution discipline above. Confirm new code paths are actually *covered* (an untested new path is a finding). Assess test *quality* against `testing.md` — behavior over implementation, deterministic, not over-mocked, not vacuous (asserts something real). A green-but-meaningless test is false confidence and is itself a finding. If the changed surface needs framework-specific testing guidance, load `testing-specialty-router.md`. For higher-risk diffs, use `bug-hunting.md` to choose a few focused probes or regression tests rather than trusting suite breadth alone.
3. **Run the app / feature** — launch it and exercise the change for real:
   - the **golden path** the change was built for (use the intent pinned in Phase 0);
   - **at least one negative/error path** — invalid input, empty state, permission-denied path, timeout, or dependency failure, whichever best matches the risk map;
   - **regressions** — quickly exercise adjacent features the change could plausibly affect.
   Observe actual behavior (output, UI, logs, side effects); don't infer it from the code.
   - **temporal/retry behavior** *(when relevant)* — retry, refresh/reload, back/forward navigation, duplicate submit, reconnect, or rerun the same action to confirm idempotency and stale-state handling.
   - **persistence/round-trip behavior** *(when relevant)* — create something, reload/refetch it, and confirm the stored or serialized form still behaves correctly.
   - **auth / permission paths** *(when relevant)* — confirm unauthenticated, under-privileged, expired-session, and wrong-tenant paths behave safely.
   - **upload / parser / redirect / outbound-fetch paths** *(when relevant)* — exercise malformed input, oversized files, blocked destinations, and unsafe redirect attempts.
   - **observability** *(when relevant)* — confirm failures and high-value actions leave useful signals without leaking secrets or PII; see `observability-review.md`.
   - **migration / rollout safety** *(when relevant)* — verify new code tolerates existing data shape and migrated data shape where the environment allows; see `migration-safety.md`.
   - **async / duplicate / replay behavior** *(when relevant)* — rerun the same message, job, or action and confirm side effects are not duplicated or corrupted.
   - **config / feature-flag behavior** *(when relevant)* — verify safe defaults, missing-config behavior, and both sides of the flag when the change depends on rollout controls.
   - **project/domain invariants** *(when relevant)* — exercise the repo-specific calculation, workflow state, tenant/privacy boundary, compatibility promise, or documented convention captured in the project context capsule.
    - **Browser QA for important runnable web UI** *(when relevant)* — for important runnable web UI changes, prefer `browser-qa.md` as the Phase 6 proof path instead of an ad hoc manual click-through. First confirm capability + reachability per Execution discipline above; when the suite is configured and the target is reachable, run it yourself and record the real pass/fail result. Cover the golden path, one meaningful negative path, and one viewport- or state-specific regression check. When the project already has specialty browser/E2E tooling and the changed surface needs that detail, route through `testing-specialty-router.md`.
   - **post-deploy / canary observation** *(when relevant and a target environment exists)* — if the risk map includes rollout-sensitive deployed behavior, use `post-deploy-monitoring.md` to record at least one canary-style observation instead of relying only on local checks.
   - **workflow safety confirmation** *(when relevant and static verification is meaningful)* — for workflow/release automation changes, confirm the trusted event model, token/secrets exposure, and execution path assumptions from `workflow-security.md`, and record what was statically proven versus what could not be exercised directly.
4. **Accessibility** *(UI changes only)* — run the dedicated `accessibility-review.md` lane for the changed UI. Treat it as the Phase 6 verification path that proves the expectations introduced by `best-practices/frontend-a11y-i18n.md` actually hold: keyboard-only pass, automated checker (e.g. axe), and any changed focus/label/error/motion expectations that matter for this surface. This complements `browser-qa.md`; do not treat browser smoke/interaction evidence as a substitute for the dedicated accessibility lane.
5. **Performance** *(hot-path / perf-sensitive changes only)* — follow `performance-profiling.md`: measure against realistic data, find the real bottleneck, confirm any optimisation with a before/after. If the changed surface needs framework-specific performance guidance, load `performance-specialty-router.md`. Skip with a note for cold-path changes.

At the end of verification, be able to say which top risks from the risk map and
which relevant project-context invariants were actually exercised, and which
were not.

## Required probes by archetype

If an archetype appears in the Phase-0 risk map, cover **at least one**
meaningful probe from its row. High-risk diffs usually need more than one.

- **UI / UX**
  - golden path in the real UI;
  - one validation/loading/error-state check;
  - refresh/navigation/back-forward or stale-state check.
- **API / contract**
  - valid request;
  - malformed/missing-field or wrong-method check;
  - backward-compatibility or response-shape check when relevant.
- **Auth / privacy / tenant boundary**
  - unauthenticated or expired-session path;
  - under-privileged/wrong-resource/wrong-tenant path;
  - confirm both deny behavior and absence of leaked data.
- **Persistence / state**
  - create/update/delete round-trip;
  - partial-failure or rollback-safe behavior if relevant;
  - cache/read-model/derived-state sync after mutation.
- **Schema / migration / rollout**
  - old/new data-shape tolerance;
  - deploy-order or flag-order assumption check;
  - reversibility/rollback note or explicit reason it is not relevant.
- **Async / jobs / events**
  - retry or duplicate-delivery probe;
  - ordering/replay probe when ordering matters;
  - failure visibility and poison-message behavior where relevant.
- **External integration**
  - upstream timeout/error path;
  - retry/idempotency behavior;
  - schema/contract assumption check on the exchanged payload.
- **Config / feature flags / deployment**
  - safe default / missing-config path;
  - flag off and flag on behavior when both modes can exist;
  - startup/runtime failure mode when config is invalid.
- **Workflow / release automation**
  - trusted event / trigger assumptions;
  - secret and token exposure path;
  - static workflow safety confirmation when direct execution is unavailable.
- **Performance-sensitive**
  - measure the suspected hotspot;
  - compare before/after or explain why no before/after was possible.

If you skip a row because the environment cannot exercise it, say that
explicitly and carry the gap into the validation gate rather than silently
pretending it was covered.

## Output

Phase 6 must produce the shared `verification ledger`.

Use `verification-ledger.md` as the canonical schema and minimum-coverage
contract. For each verification activity, record the exact fields defined
there:

When Forge QA produced a QA capability matrix, carry its states into the
verification ledger. `run` capabilities should point to commands or observed
flows; `not configured` and `deferred` capabilities should stay visible as
not-run or environment-blocked evidence.

- activity name
- command, flow, or probe that was run
- observed result
- risk or invariant exercised
- coverage type: `direct` | `indirect`
- status: `pass` | `fail` | `flaky` | `infra` | `not-run` (per `verification-ledger.md`; `flaky`/`infra` never count as proof)
- attempt: `1` initial, `2`/`3` retries
- notes on environment gaps or unexercised risks

If a top risk from the Phase-0 risk map was not exercised, carry that gap
forward explicitly into the validation gate.

When summarizing the ledger, be explicit about which entries are **directly
verified**, which are only **indirectly supported**, and which remain
**not-run/environment-blocked**. `flaky`/`infra` never counts as proof — repeat
that verdict at the summary rather than letting absence read as green.

When post-deploy monitoring was relevant, record whether it was `run and healthy`, `run with warnings`, or `not run because no environment` rather than collapsing those cases into generic verification success.

## Fix-to-green loop (bounded, max 2 fixes)

Initial run is attempt 1. You get at most 2 fix attempts (attempts 2 and 3 total).

Don't just note "saw a failure." Capture it in a replayable way: record the
exact command, route, fixture, input, or seed that triggered it; minimize the
reproducer if you can; add or improve a regression test when practical.

Debug hygiene: tag every temporary debug log with a unique prefix (e.g.
`[DEBUG-xxxx]`) so cleanup is one grep; delete throwaway harnesses when done.
Redact shown output (`<REDACTED>`, secrets via env vars, generic queries only).
Fix order on a real bug: capture trigger → minimize → regression test red →
fix → focused probe plus suite green → re-run the original loop.

Per attempt:
1. Classify the failure first: `fail` vs `flaky` vs `infra` per
   `verification-ledger.md`. Do not fix `infra` with code changes. Do not mark
   `flaky`/`infra` as proof.
2. Fix only if it meets the `Fix` contract from `findings-lifecycle.md`
   (localized, safe, verifiable). `Plan`/`Decide` issues stop the loop and go
   to the gate as-is.
3. Re-run in order: focused probe that caught it first. Only if focused passes,
   re-run the broader suite. Only if suite passes, re-run static gates touched
   by the fix. Don't re-run everything on every try.
4. Log each attempt in the ledger with `attempt` + trigger + what changed.

Stop, do not loop, when any holds:
- all required checks `pass` on the same code state — green, exit loop
- 2 fix attempts used — stop, carry to gate as NEEDS REVISION (BLOCKED only
  if `validation-gate.md` calibration says so)
- same trigger reproduces identically twice — deterministic defect needing
  design, not polish, stop after 2nd
- `infra` blocks twice with no code fix possible — stop, mark
  `not-run`/`environment-blocked`, carry gap to gate (a shell timeout with
  visible progress gets its one larger-timeout retry first per Execution
  discipline above; that retry counts as the second attempt)
- fix would exceed localized `Fix` scope — stop, mark
  `Investigate`/`Plan`/`Decide`

An exhausted loop never reports green. The ledger must show attempts, triggers,
and what remains unexercised.

## When you cannot run it

If the environment can't launch the app (no runtime, missing services, no display), **say so explicitly** and mark the behavioral check as not performed — never report success you didn't observe. Fall back to the strongest evidence available (tests, a dry run, a focused harness) and record the gap for the validation gate.
