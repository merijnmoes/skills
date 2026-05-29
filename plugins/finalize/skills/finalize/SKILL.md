---
name: finalize
description: The /finalize command. Runs the full post-implementation finalization pipeline on a completed code change — language best-practices, simplify, refactor assessment, code review, security review, spec-conformance check, doc updates, lint/type/test gates, and a final validation gate that returns a READY TO SHIP / NEEDS REVISION / BLOCKED verdict. Invoke ONLY when the user explicitly runs the /finalize command. Do NOT auto-trigger from related phrasing such as "finish this", "wrap up", "clean this up", or "ready to commit", and never during ordinary coding, debugging, or review tasks.
---

# Finalize

`/finalize` is the quality-assurance pipeline a developer runs once a change is *functionally complete* and they want it brought up to shippable standard. It is a **self-contained orchestrator**: it carries its own instructions for every phase — the *improve* work (language best-practices, simplification, refactor assessment) and the audit, verification, and remaining gaps (code review, security review, behavioral verification, spec-conformance, doc updates, and the final validation gate) — and depends on no host-agent built-in commands. The independent audit checks (code review and security review) run in fresh-context subagents that follow the skill's own references; behavioral verification runs in the main agent. Crucially, **`/finalize` never commits, pushes, or opens a pull request** — it stops at a verdict and a summary, and every git action stays in your hands.

The pipeline is ordered so that **code-modifying phases run first against a known-good baseline, and verification + sign-off run last** — you never declare something shippable that you changed after you last confirmed it works.

## Operating principles

Read these before starting. They explain *why* the pipeline is shaped the way it is, so you can handle situations the phase list doesn't spell out.

- **The diff is the unit of work.** Everything operates on what changed versus the base branch (plus uncommitted work) — not the whole repo. Reviewing or "improving" untouched code is scope creep and a common way to introduce regressions. The one exception is reading surrounding code to *understand* a change.
- **Own your checks; get independence from fresh context, not from host commands.** Every phase carries its own guidance — the *improve* phases (1–3) and the *audit* and *verify* phases alike — so the pipeline depends on no host-agent built-in commands and travels wherever the skill is installed. The audit's independence comes from running the code-review and security-review references in a **fresh-context subagent** (see the `dispatching-parallel-agents` skill) that hasn't seen Phases 1–3; where a host has no subagent mechanism, follow the same reference as an inline adversarial pass. Verify (Phase 6) is a main-agent procedure following `verify.md`, because behavioral observation benefits from holding the change's intent.
- **Never skip a phase to save time.** "The session was already long", "the diff is small", "a previous phase was thorough", "this is urgent" are never reasons to skip. The point of a finalize pass is that it is *complete and predictable*. If a phase genuinely does not apply (e.g. no SQL in the diff → no SQL best-practices), state that explicitly and move on — that is judgement, not skipping.
- **Behavior preservation is sacred in the improvement phases.** Best-practices, simplify, and refactor must not change what the code *does*. The test suite (Phase 6) is the safety net that proves it — which is why those phases come before, not after, verification.
- **Fail-stop, don't paper over.** If a modifying or audit phase hits an error it cannot cleanly resolve, stop the pipeline and report where you are. Do not silently continue or mask failures.
- **Never commit — the user owns git.** This pipeline ends at the validation verdict and a summary. Do not run `git commit`, `git push`, `gh pr create`, or any other git/PR write — ever, under any circumstances, even when the verdict is READY TO SHIP and even if asked to "just wrap it up". Staging and committing is the user's decision alone; you may only *suggest* the exact command for them to run. (Consequence: since the modifying phases edit the working tree in place but nothing is committed, the user's own pre-finalize commit is the only clean rollback point — hence the Phase 0 commit precondition.)
- **Be convention-aware.** Read `CLAUDE.md` / `AGENTS.md` and existing code style before applying any "best practice". Project conventions win over generic rules — note the conflict rather than overriding silently.
- **Fit the codebase, not just correctness.** A change can be locally correct yet wrong for *this* repo — duplicating an existing helper, adding a second way to do something, or ignoring an established pattern. Reuse prior art and match surrounding conventions; see `references/codebase-fit.md`.
- **Build the right change, not just a correct one.** Code can be clean, idiomatic, and correct yet not be *what was asked for* — a requirement left half-built, a misread of the spec, or behavior nobody requested. Conformance to the originating intent is its own check, distinct from quality; see `references/spec-conformance.md`.
- **A finding blocks only if it survives challenge.** Before any issue gates the verdict, it must have a concrete, reachable trigger — not a theory or an aesthetic objection. Challenging your own findings keeps the punch list small and trustworthy, so the user doesn't have to re-verify it by hand; see `references/finding-verification.md`.
- **Check current library docs when unsure.** Training data drifts and APIs change. When the change uses a library or framework and you're not certain an API is current, non-deprecated, and used the way maintainers now recommend, consult docs rather than memory — if a documentation MCP such as **Context7** is available, resolve the library and query the specific topic. If none is available, say so and lower your confidence instead of guessing. Most relevant in Phases 1, 4, and 7.

## Setup

At the start, register the pipeline as tasks so progress is visible and nothing is dropped. Use `TaskCreate` to create one task per phase below (Phase 0 through Phase 8). Mark each `in_progress` when you enter it and `completed` when its gate passes. If a phase doesn't apply, mark it completed with a one-line note on why.

## The pipeline

### Phase 0 — Scope & baseline

Establish exactly what you are finalizing and confirm it starts from a known-good state.

**Precondition — commit before you finalize.** The modifying phases (best-practices, simplify, refactor) edit the working tree in place, but this pipeline makes no git writes of its own. So the user's completed feature work should be committed (or stashed) *before* finalize runs — that commit is the clean rollback point if a phase has to be backed out (`git restore` / `git checkout`). If there is uncommitted feature work, say so and recommend a checkpoint commit first; proceed without one only with the user's go-ahead, and warn that auto-applied fixes won't be individually reversible.

1. **Determine the base branch.** Try `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`; fall back to `main`, then `master`, then `develop`. Identify the current branch with `git rev-parse --abbrev-ref HEAD`.
2. **Branch safety.** If the current branch *is* the base branch (e.g. on `main`), warn the user — finalize assumes feature work on a branch. Continue only if they confirm.
3. **Compute the diff.** `git diff <base>...HEAD` for committed work, plus `git status` / `git diff` for uncommitted work. This combined diff is your source of truth for every later phase.
4. **Detect languages & frameworks** from changed file extensions and manifests (`package.json`, `composer.json`, `pyproject.toml`, `*.csproj`, etc.). This decides which best-practices references load in Phase 1.
5. **Read conventions:** root and nearest `CLAUDE.md` / `AGENTS.md`, plus linter/formatter config, so later phases respect house style.
6. **Pin the spec/intent.** Establish *what this change was supposed to do* so Phase 4 can check the diff against it. Follow `references/spec-conformance.md`: look for issue refs in commit messages (`#123`, `Closes #45` → `gh issue view` if available), then a PRD/spec file under `docs/`/`specs/`/`.scratch/` matching the branch/feature, then the branch name as a weak hint. If none of those turn up, ask the user once for a one-line intent or a path. If they have none either, record "no external spec; internal-consistency check only" and proceed — never block on a missing spec. Carry the pinned intent (and its source) forward.
7. **Confirm a green baseline.** Run the test suite once now. If it is already failing *before* finalize touches anything, stop and report — finalize is not the tool to debug a broken baseline, and you must not mask pre-existing failures as if finalize caused or fixed them.

Gate: you have a clear diff, a language list, a pinned intent (or an explicit note that none exists), and a green (or explicitly-acknowledged) starting state.

### Phase 1 — Best-practices pass *(modifies code)*

Apply idiomatic, language- and framework-specific best practices to the changed code only.

- Read `references/best-practices/_index.md` and load only the files matching the languages detected in Phase 0. Always also load `references/best-practices/general-oop.md` for any backend/business-logic change, `references/best-practices/frontend-a11y-i18n.md` for any user-facing UI/markup change, and `references/testing.md` if the diff adds or changes test code (so the tests themselves get brought up to standard, not just the production code).
- Before changing anything, follow `references/codebase-fit.md`: study how the project already does this and reuse existing utilities/patterns, so the change conforms instead of introducing a parallel approach.
- Apply the rules to the diff. Prefer the smallest change that brings the code in line; do not rewrite working code wholesale.
- When a best-practice rule conflicts with an established project convention, the convention wins — note the conflict instead of fighting it.

Gate: changed code follows the relevant idioms, or deviations are noted with reasons.

### Phase 2 — Simplify *(modifies code)*

Improve clarity and remove unnecessary complexity in the changed code.

- Follow `references/simplify.md`. It carries the equivalence test that keeps this phase safe without a test gate, the clarity ethos, and the local-simplification catalog.
- Goal is readability and removing accidental complexity — flatten needless nesting, name things well, drop dead code — **without** changing behavior or over-compressing into clever one-liners.
- This is the middle improve rung: language idioms are Phase 1, structural change is Phase 3. Phase 2 is *local* clarity — single-location rewrites whose equivalence you can see. Anything you'd need the tests to prove belongs in Phase 3.

Gate: the diff is as simple as it can be while staying clear.

### Phase 3 — Refactor assessment *(modifies code, test-gated)*

Assess whether the changed code has structural problems worth fixing *now*, and fix only those that genuinely improve it.

- Follow `references/refactoring.md`. It carries the priority model (what's worth fixing vs. skipping), the knowledge-vs-structure rule for duplication, and the behavior-preservation discipline.
- Refactor in small steps. After each structural change, the tests must still pass — refactoring without a passing test suite is editing, not refactoring.
- It is correct and common for this phase to conclude "no refactor needed." Don't manufacture changes.

Gate: structural issues are either fixed (with tests still green) or consciously deferred with a reason.

### Phase 4 — Audit *(read-only)*

Independently review the now-polished diff. These checks are read-only and independent, so run them in parallel where possible (dispatch parallel subagents — see the `dispatching-parallel-agents` skill) and consolidate their findings into one punch list.

- **Code review:** dispatch a fresh-context subagent (per the `dispatching-parallel-agents` skill) to review the diff following `references/code-review.md`. On a host without subagents, follow that reference as an inline adversarial pass.
- **Security review:** dispatch a fresh-context subagent to audit the diff following `references/security-review.md` (OWASP Top 10:2025 floor + conditional API & LLM lenses). Inline-adversarial fallback as above.
- **Secret scan:** scan the diff for committed secrets, credentials, tokens, private keys, or `.env` values. Any hit is a hard stop — never let secrets proceed toward a commit.
- **Dependency & license audit** *(only if the diff changed dependency manifests/lockfiles)*: follow `references/dependency-audit.md` — check new/bumped dependencies for known vulnerabilities, license compatibility, and supply-chain hygiene. Skip with a note if no dependencies changed.
- **Consistency & codebase fit:** per `references/codebase-fit.md`, check the change fits the existing architecture — reuses prior art, matches established patterns, doesn't duplicate existing functionality or introduce a competing pattern, and respects module boundaries. Flag divergences as findings.
- **Spec conformance:** per `references/spec-conformance.md`, check the diff against the intent pinned in Phase 0 — missing or partial requirements, scope creep (behavior nobody asked for), and implemented-but-wrong. If no external spec was pinned, run the lighter internal-consistency check instead (half-built paths, dead branches, leftover scaffolding). A confirmed missing requirement is blocking; `/finalize` flags it but does not implement it.
- **Structural regression:** per the diff-scoped lane in `references/refactoring.md`, check whether *this change* degraded structure — ad-hoc branching tangled into an unrelated flow, feature logic leaking into a general module, file bloat, a duplicated canonical helper, or a boundary leak. Diff-scoped only: flag degradation the change caused; do not flag or rewrite untouched neighboring code.

Consolidate the lanes into one punch list. **Before marking anything blocking, run it through `references/finding-verification.md`** — require a concrete reachable trigger, downgrade known false-positive classes, and verify any framework/library claim against docs. Label each surviving finding with severity and confidence, and order by business impact. Fix anything blocking now (a fix re-opens Phase 6 verification for the touched code). Record non-blocking items in the final report.

Gate: no blocking review, security, dependency, consistency, spec-conformance, or structural findings remain; no secrets in the diff. Blocking findings are verified (reproducible trigger), not speculative.

### Phase 5 — Update docs *(modifies docs)*

Bring documentation in sync with the change so the next reader isn't misled.

- Follow `references/update-docs.md`. It covers what to check (READMEs, `CLAUDE.md`, API/usage docs, inline docstrings for changed signatures, and the changelog) and how to keep updates minimal and truthful.

Gate: docs affected by the change are updated; the changelog has an entry if the project keeps one.

### Phase 6 — Verify *(gate)*

Gather hard evidence that the change works after all the modifications above. This evidence feeds the validation gate.

1. **Static gates:** run the project's formatter, linter, and type-checker (detected in Phase 0). These are cheap and catch more than human review.
2. **Test suite:** run the full suite. It must pass. Confirm that new functionality is actually covered by tests — if a new code path has no test, that is a finding for the validation gate. Also assess the *quality* of new/changed tests against `references/testing.md` — they should test behavior not implementation, avoid over-mocking, and be deterministic; a brittle, order-dependent, or vacuous (asserts-nothing) test is itself a finding, since green-but-meaningless tests are false confidence.
3. **Behavioral check:** follow **`references/verify.md`** to actually run the app/feature and observe real behavior, not just green tests. Type-checks and tests prove code correctness, not feature correctness.
4. **Accessibility check** *(only for UI changes)*: verify the a11y rules from `references/best-practices/frontend-a11y-i18n.md` actually hold — a keyboard pass plus an automated checker (e.g. axe), not just code inspection.
5. **Performance profiling** *(only if the change touches a hot path / performance-sensitive code)*: follow `references/performance-profiling.md` — measure against realistic data, find the real bottleneck, confirm any optimization with a before/after. Skip with a note for cold-path changes.

Gate: lint/format/type-check clean, tests green, the feature observably works, and any a11y/perf concerns are resolved or explicitly recorded.

### Phase 7 — Validation gate *(gate)*

Apply the critical, structured validation review to the final diff and produce a verdict.

- Follow `references/validation-gate.md` exactly — it is a 12-section checklist (including business-risk lanes for data integrity, idempotency/concurrency, and financial correctness) plus a required final risk pass. Reason about each item against the diff and the evidence gathered in Phase 6; flag issues rather than assuming correctness.
- Apply the same `references/finding-verification.md` discipline as Phase 4: anything that pushes the verdict to `NEEDS REVISION`/`BLOCKED` needs a concrete reachable trigger, every finding carries a severity + confidence label, and findings are ordered by business impact. Fold in the Phase 4 spec-conformance result — a confirmed missing requirement is `NEEDS REVISION`.
- The gate ends in one verdict: **READY TO SHIP**, **NEEDS REVISION**, or **BLOCKED**, with a short justification.

Gate: a verdict is produced. `BLOCKED` or `NEEDS REVISION` means the change is *not* presented as shippable — surface what must be fixed.

### Phase 8 — Final report & retro *(no git writes)*

Close out without taking git actions (per the no-automatic-writes principle).

Present a concise report:

```
# Finalize report

**Verdict:** READY TO SHIP | NEEDS REVISION | BLOCKED

## What each phase did
- Best-practices: <changes made, or "no change">
- Simplify: <...>
- Refactor: <...>
- Audit: <blocking fixed / non-blocking deferred>
- Docs: <...>
- Verify: <lint/types/tests/app status>

## Outstanding items
- <non-blocking findings, deferred refactors, coverage gaps>

## Recommended next step
- <e.g. suggested conventional-commit message; or what to fix before re-running /finalize>
```

Then a brief **retro**: note anything from this session worth remembering (a recurring mistake, a project convention discovered, a workflow preference). If it is durably useful, offer to save it to memory. Keep this to a few lines — it is a learning capture, not a second report.

Do not commit, push, or open a PR. If the verdict is READY TO SHIP, you may suggest the exact commit/PR command for the user to run.

## Reference files

| File | Used in | Purpose |
|------|---------|---------|
| `references/best-practices/_index.md` | Phase 1 | Language → best-practices file router |
| `references/best-practices/general-oop.md` | Phase 1 | SOLID, DI, composition, layering for backend code |
| `references/best-practices/javascript.md` | Phase 1 | JS hygiene + patterns.dev design/performance/rendering patterns |
| `references/best-practices/typescript.md` | Phase 1 | TypeScript idioms & anti-patterns |
| `references/best-practices/python.md` | Phase 1 | Python idioms & anti-patterns |
| `references/best-practices/python-details.md` | Phase 1 | Python tooling config + worked examples (loaded on demand from `python.md`) |
| `references/best-practices/php.md` | Phase 1 | PHP idioms, PSR, typing, static analysis, security, performance, testing |
| `references/best-practices/laravel.md` | Phase 1 | Laravel specifics (Eloquent/N+1, FormRequests, queues) — layers on `php.md` |
| `references/best-practices/vue.md` | Phase 1 | Vue 3 / Composition API idioms |
| `references/best-practices/sql.md` | Phase 1 | Cross-engine SQL query & index optimization |
| `references/best-practices/postgresql.md` | Phase 1 | PostgreSQL + ORM (TypeORM/Prisma) patterns |
| `references/best-practices/supabase.md` | Phase 1 | Supabase RLS/auth, roles, pooling (layers on postgresql/sql) |
| `references/best-practices/frontend-a11y-i18n.md` | Phase 1 (+6) | Accessibility & i18n for UI changes |
| `references/testing.md` | Phase 1 (+6) | Test-quality discipline (behavior over implementation, determinism, mocking) |
| `references/simplify.md` | Phase 2 | Local clarity: equivalence test, clarity ethos, local-simplification catalog |
| `references/codebase-fit.md` | Phase 1 (+4) | Reuse prior art, match patterns, respect boundaries — fit the change to the repo |
| `references/spec-conformance.md` | Phase 0 (+4) | Pin the originating intent; check the diff for missing requirements, scope creep, wrong implementation |
| `references/refactoring.md` | Phase 3 (+4) | Refactor priority model, behavior-preservation discipline & the diff-scoped structural-regression lane |
| `references/code-review.md` | Phase 4 | Correctness/bug review of the diff (logic, edges, error paths, concurrency, resource leaks, API misuse) |
| `references/security-review.md` | Phase 4 | Security audit — OWASP Top 10:2025 floor + conditional API & LLM lenses; composes dependency-audit & finding-verification |
| `references/dependency-audit.md` | Phase 4 | Vulnerability, license & supply-chain audit for changed deps |
| `references/finding-verification.md` | Phase 4 (+7) | Trigger test, known-false-positive exclusions & confidence/severity labels — keep the blocking list true |
| `references/update-docs.md` | Phase 5 | What docs to update and how |
| `references/verify.md` | Phase 6 | Behavioral verification — run the app & observe; composes testing, a11y & performance refs |
| `references/performance-profiling.md` | Phase 6 | Measure-first profiling for hot-path changes |
| `references/validation-gate.md` | Phase 7 | 12-section validation checklist (incl. business-risk lanes) + verdict |
