---
name: moes
description: Use when a code change is functionally complete and needs a final hardening review before shipping, or when the user asks for moes.
---

# Moes

`moes` is the final hardening review for a functionally complete change. It takes a change that has already passed through implementation and QA and decides whether it is ready to ship.

It is a **self-contained review operating system**: it carries its own
instructions for every phase, builds shared evidence artifacts up front, routes
scrutiny by risk, and produces a verdict from explicit verification and
verified findings. `moes` stays artifact-driven rather than
phase-local and narrative-first.

The pipeline is ordered so that **code-modifying phases run first against a known-good baseline, and verification + sign-off run last** — you never declare something shippable that you changed after you last confirmed it works.

## When NOT to Use

- Do **not** enter `moes` during active implementation, debugging, or
  exploratory shaping. It is for changes that are already functionally
  complete.
- Do **not** use it for broad repo audits unrelated to the current diff. The
  diff is the unit of work.
- Do **not** use it when the baseline is already broken and needs debugging
  first. `moes` is not the tool for recovering an already-red starting
  point.

## Requesting a review

Users request a review with `/moes` for the current diff, for example:

- `/moes`
- `/moes against base`
- `/moes against develop`
- `/moes against <branch>`

`against base` means auto-detect the repository default branch;
`against <branch>` overrides the comparison base. `/forge:build` runs this
same skill when its workflow reaches the Review phase.

## Operating stance

- Prefer the **smallest justified improvement** to the changed code. Do not
  turn `moes` into speculative cleanup.
- Do not expand scope because a nearby file "could be better." Stay anchored to
  the diff and the pinned intent.
- State assumptions explicitly when evidence is incomplete instead of letting
  confidence tone hide uncertainty.
- Prefer concrete proof, observed behavior, and reachable triggers over
  narrative confidence.
- `moes` is a separate public skill. When `/forge:build` reaches its Review phase, it loads this skill.

## Phase map

| Phase | Purpose | Reads | Writes | Modifies code? | Gate |
|------|---------|-------|--------|----------------|------|
| 0 — Scope & baseline | Establish diff scope, context, risk, intent, and baseline | repo state, diff, project docs, tests | `Evidence Pack` | No | clear scope, composed evidence pack, green baseline |
| 1 — Best-practices pass | Apply idiomatic and codebase-fit improvements to changed code | `Evidence Pack`, best-practice references | improved diff | Yes | idiomatic changed code or noted deviations |
| 2 — Simplify | Remove local accidental complexity without changing behavior | changed diff, `simplify.md` | simpler diff | Yes | simplest clear equivalent form |
| 3 — Refactor assessment | Fix only worthwhile structural issues, test-gated | changed diff, `refactoring.md`, tests | refactored diff | Yes | structural issues fixed or consciously deferred |
| 4 — Audit | Register the maximal audit lane set, run every applicable lane, consolidate verified findings, and apply only safe localized post-consolidation fixes | `Evidence Pack`, audit references, diff | `Finding Set`, `Design Quality Notes`, specialty lane registry | Limited, post-consolidation only | lane registry complete; no speculative blockers remain |
| 5 — Update docs | Align docs with the ship-ready change | `Evidence Pack`, risk lane, changed surfaces | updated docs | Docs only | affected docs aligned |
| 6 — Verify | Gather post-edit evidence from static, test, and runtime checks | tests, runtime flows, risk map | `Verification Ledger` | No | sufficient post-edit evidence gathered |
| 7 — Validation gate | Turn evidence and surviving findings into a verdict | `Evidence Pack`, `Finding Set`, `Design Quality Notes`, `Verification Ledger` | `Decision Packet` | No | verdict justified from evidence |
| 8 — Final report & retro | Present verdict, evidence, residual risk, and next steps | `Decision Packet` | user-facing summary | No | concise decision-ready report complete |

The table above is the quick interface to the pipeline. The phase sections
below carry the detailed operating rules, exceptions, and per-phase routing.

## Operating principles

Read these before starting. They explain *why* the pipeline is shaped the way it is, so you can handle situations the phase list doesn't spell out.

- **The diff is the unit of work.** Everything operates on what changed versus the base branch (plus uncommitted work) — not the whole repo. Reviewing or "improving" untouched code is scope creep and a common way to introduce regressions. The one exception is reading surrounding code to *understand* a change.
- **Own your checks; get independence from fresh context, not from host commands.** Every phase carries its own guidance — the *improve* phases (1–3) and the *audit* and *verify* phases alike — so the pipeline depends on no host-agent built-in commands and travels wherever the skill is installed. The audit's independence comes from running the code-review and security-review references in a **fresh-context subagent** (see the `dispatching-parallel-agents` skill) that hasn't seen Phases 1–3; where a host has no subagent mechanism, follow the same reference as an inline adversarial pass. Verify (Phase 6) is a main-agent procedure following `verify.md`, because behavioral observation benefits from holding the change's intent.
- **Never skip a phase to save time.** "The session was already long", "the diff is small", "a previous phase was thorough", "this is urgent" are never reasons to skip. The point of a `moes` pass is that it is *complete and predictable*. If a phase genuinely does not apply (e.g. no SQL in the diff → no SQL best-practices), state that explicitly and move on — that is judgement, not skipping.
- **Behavior preservation is sacred in the improvement phases.** Best-practices, simplify, and refactor must not change what the code *does*. The test suite (Phase 6) is the safety net that proves it — which is why those phases come before, not after, verification.
- **Fail-stop, don't paper over.** If a modifying or audit phase hits an error it cannot cleanly resolve, stop the pipeline and report where you are. Do not silently continue or mask failures.
- **Never commit — the user owns git.** This pipeline ends at the validation verdict and a summary. Do not run `git commit`, `git push`, `gh pr create`, or any other git/PR write — ever, under any circumstances, even when the verdict is READY TO SHIP and even if asked to "just wrap it up". Staging and committing is the user's decision alone; you may only *suggest* the exact command for them to run. (Consequence: since the modifying phases edit the working tree in place but nothing is committed, the user's own pre-moes commit is the only clean rollback point — hence the Phase 0 commit precondition.)
- **Be project-aware.** Read the repo's standing instructions, architecture docs, local patterns, tooling conventions, and domain rules before applying any "best practice". Build a small project context capsule and carry it through the pipeline; see `references/project-context.md`.
- **Fit the codebase, not just correctness.** A change can be locally correct yet wrong for *this* repo — duplicating an existing helper, adding a second way to do something, or ignoring an established pattern. Reuse prior art and match surrounding conventions; see `references/codebase-fit.md`.
- **Build the right change, not just a correct one.** Code can be clean, idiomatic, and correct yet not be *what was asked for* — a requirement left half-built, a misread of the spec, or behavior nobody requested. Conformance to the originating intent is its own check, distinct from quality; see `references/spec-conformance.md`.
- **Classify the change before judging it.** UI, API, auth, persistence, migrations, jobs, integrations, config, and feature flags fail in different ways. Build a small risk map up front and let it drive which checks, probes, and conditional lanes matter; see `references/risk-mapping.md`.
- **Use the checklist as a floor, not a ceiling.** `moes` has explicit gates so the pass is complete and repeatable, but no checklist is exhaustive. Generate bug hypotheses from the actual diff, the changed invariants, and the system boundaries; use the references to structure your thinking, not replace it.
- **A finding blocks only if it survives challenge.** Before any issue gates the verdict, it must have a concrete, reachable trigger — not a theory or an aesthetic objection. Challenging your own findings keeps the punch list small and trustworthy, so the user doesn't have to re-verify it by hand; see `references/findings-lifecycle.md`.
- **Classify findings by next action.** After findings survive verification, label what should happen next: Fix, Investigate, Plan, or Decide. This keeps real blockers actionable without pretending every architectural smell or domain question can be solved inside `moes`; see `references/findings-lifecycle.md`.
- **Evidence beats narration.** The final report should make it easy for a reviewer to see what changed, what was verified, what remains risky, what project-specific rules were checked, and why the verdict is justified. Prefer concrete evidence — commands run, flows exercised, files updated, triggers reproduced, docs checked — over generic reassurance.
- **Artifacts beat rediscovery.** Build the shared evidence once, then let later
  phases consume it. The pipeline's core internal artifacts are the `Evidence
  Pack`, `Finding Set`, `Design Quality Notes`, `Verification Ledger`, and
  `Decision Packet`; later phases should enrich them, not start from scratch.
- **Run a freshness probe on triggered surfaces.** Training data drifts and APIs change. Run a docs/advisory lookup when the diff (a) adds or bumps a dependency, (b) uses a library/framework API not already verified in this repo, or (c) touches auth/crypto/payment/sanitization through a library call. Use a documentation MCP such as **Context7** if available (resolve the library, query the specific topic); otherwise web-search official docs + release notes + advisories. Cite source and date in the finding's evidence; if offline or no tool is available, say so and cap confidence at Medium — never assert "current best practice" from memory. Bound to 2-3 lookups per review on triggered surfaces only; keep queries generic (library + API, no internal paths) and never put secrets or tokens in a query. Most relevant in Phases 1, 4, and 7.

## Setup

At the start, register the pipeline as tasks so progress is visible and nothing
is dropped. If the host offers task tracking, create one task per phase below
(Phase 0 through Phase 8). Otherwise keep an explicit checklist in your working
notes. Mark each phase `in_progress` when you enter it and `completed` when its
gate passes. If a phase doesn't apply, mark it completed with a one-line note
on why.

## The pipeline

### Phase 0 — Scope & baseline

Establish exactly what `moes` is hardening and confirm it starts from a known-good state.

**Precondition — checkpoint before you enter `moes`.** The modifying phases (best-practices, simplify, refactor) edit the working tree in place, but this pipeline makes no git writes of its own. So the user's completed feature work should be committed (or stashed) *before* `moes` runs — that checkpoint is the clean rollback point if a phase has to be backed out (`git restore` / `git checkout`). If there is uncommitted feature work, say so and recommend a checkpoint commit first; proceed without one only with the user's go-ahead, and warn that auto-applied fixes won't be individually reversible.

1. **Determine the base branch.** If the user explicitly requested a base
   override through `/moes` (`against <branch>`), use that first (`/forge:build` reaches this skill only when run as its Review phase). Otherwise try
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`; fall back
   to `main`, then `master`, then `develop`. Identify the current branch with
   `git rev-parse --abbrev-ref HEAD`.
2. **Branch safety.** If the current branch *is* the base branch (e.g. on `main`), warn the user — `moes` assumes feature work on a branch. Continue only if they confirm.
3. **Compute the diff.** `git diff <base>...HEAD` for committed work, plus `git status` / `git diff` for uncommitted work. This combined diff is your source of truth for every later phase. Optional accelerator (stdlib-only, degrades gracefully): `python3 <skill-dir>/scripts/triage.py --base <base>` for size XS-XL, time estimate, and `NO_TEST_CHANGES` / `SECURITY_SURFACE` / `MIGRATION_DATA` / `CONFIG_ROLLOUT` / `LARGE_DIFF_SHARD` flags. If the script cannot run, do the same triage by hand — never block on tooling.
4. **Detect languages & frameworks** from changed file extensions and manifests (`package.json`, `composer.json`, `pyproject.toml`, `*.csproj`, etc.). This decides which best-practices references load in Phase 1. Build the single **stack-context snapshot** defined in `references/evidence-pack.md` (language/framework/ORM/test-runner versions, declared vs resolved) so Phases 1, 4, and 6 share one version profile instead of guessing independently.
5. **Build a project context capsule.** Follow `references/project-context.md`: capture relevant standing instructions, architecture boundaries, local patterns/prior art, domain invariants, tooling/test norms, docs/release conventions, and unknowns. This capsule drives Phases 1, 4, 6, 7, and 8.
6. **Build a risk map.** Follow `references/risk-mapping.md` to classify the change and write down the top risks before you start polishing. Capture the change archetypes in play (e.g. UI, API, auth, persistence, schema/migration, async/job, integration, config/feature-flag, perf-sensitive), the project/domain invariants from the context capsule, the side effects, the trust boundaries, and the 2-5 highest-value failure modes to probe later. This risk map drives Phases 4, 6, and 7.
7. **Pin the spec/intent.** Establish *what this change was supposed to do* so Phase 4 can check the diff against it. Follow `references/spec-conformance.md`: look for issue refs in commit messages (`#123`, `Closes #45` → `gh issue view` if available), then a PRD/spec file under `docs/`/`specs/`/`.scratch/` matching the branch/feature, then the branch name as a weak hint. If none of those turn up, ask the user once for a one-line intent or a path. If they have none either, record "no external spec; internal-consistency check only" and proceed — never block on a missing spec. Carry the pinned intent (and its source) forward.
8. **Confirm a green baseline.** Run the test suite once now. If it is already failing *before* `moes` touches anything, stop and report — `moes` is not the tool to debug a broken baseline, and you must not mask pre-existing failures as if `moes` caused or fixed them.
9. **Assign a risk lane.** Classify the diff internally as `green`, `yellow`,
   or `red` based on the surfaces, side effects, and trust boundaries in the
   risk map. This does not change the command the user runs; it changes the
   depth of later scrutiny.
10. **Build the runtime interaction sketch.** Capture the key entrypoints,
   state transitions, persistence/cache boundaries, async points, auth/trust
   boundaries, and rollout/config toggles that changed.
11. **Compose the evidence pack.** Follow `references/evidence-pack.md`
   exactly. That reference is the canonical schema and output discipline for
   the `Evidence Pack`; do not create a smaller competing definition here.

Gate: you have a clear diff, a language list, a stack-context snapshot, a project context capsule, a risk
map, a pinned intent (or an explicit note that none exists), a composed
`Evidence Pack`, and a green starting state. If the baseline is already red,
stop rather than proceeding with an acknowledged failure.

**Risk routing rules**

- **Green lane** examples: docs-only, test-only, safe rename, tiny local
  cleanup.
  Behavior: lighter runtime reconstruction, no challenger by default, simpler
  verification expectations.
- **Yellow lane** examples: business logic, moderate refactor, bounded config
  or API changes, local state or persistence changes with limited blast radius.
  Behavior: full audit lanes, targeted runtime interaction sketch, stronger
  bug-hypothesis generation.
- **Red lane** examples: auth/permissions, migrations or rollout-sensitive
  changes, concurrency/idempotency, trust-boundary changes, cache correctness
  involving money or authorization, external side effects, public API changes,
  and multi-subsystem interaction changes.
  Behavior: mandatory deep runtime sketch, stricter blocker verification, more
  aggressive negative-path probing, challenger by default, and
  stronger residual-risk reporting.

### Phase 1 — Best-practices pass *(modifies code)*

Apply idiomatic, language- and framework-specific best practices to the changed code only.

- Read `references/best-practices/_index.md` and load only the files matching the languages detected in Phase 0. Always also load `references/best-practices/general-oop.md` and `references/best-practices/clean-coding.md` for any backend/business-logic change, `references/best-practices/frontend-a11y-i18n.md` for any user-facing UI/markup change, and `references/testing.md` if the diff adds or changes test code (so the tests themselves get brought up to standard, not just the production code).
- Before changing anything, use the Phase-0 project context capsule and follow `references/codebase-fit.md`: study how the project already does this and reuse existing utilities/patterns, so the change conforms instead of introducing a parallel approach.
- For cross-language design/code smells that often survive language-specific guides, consult `references/universal-quality.md` and apply only the safe, clearly-improving fixes.
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

### Phase 4 — Audit *(limited-mutation audit; maximal lane registry; fixes applied after consolidation)*

Independently review the now-polished diff. Phase 4 is a **maximal-audit lane registry**: enumerate the full lane set the diff could plausibly need, then mark each lane `run`, `N/A`, or `deferred by environment` before consolidating findings. The default contract is audit-first, with mutation allowed only after consolidation and only for safe localized fixes that satisfy the auto-fix contract below. Run the lane work as one parallel wave where possible (dispatch parallel subagents — see the `dispatching-parallel-agents` skill and the wave pattern in `../forge/references/delegation.md`) and consolidate their findings into one punch list before any fix is applied. Build one shared context packet once (diff plus Evidence Pack slices: risk map, stack-context snapshot, project context capsule, pinned intent, runtime sketch, hotspots) and hand the same packet to every worker. Every worker returns normalized candidate findings plus a `Covered:` receipt naming what it read; any lane without a receipt is re-run or marked honestly as unexercised.

Fan-out roster (all read-only, fresh-context, depth 1):

- **C1 line-walk** (`references/code-review.md`): every hunk plus enclosing function.
- **C2 removed-behavior** (`references/code-review.md`): every deleted line names its invariant.
- **C3 cross-file tracer** (`references/code-review.md`): callers and field read-sites.
- **C4 language-pitfall**: checklist pattern-match for the diff's language.
- **Q1 reuse** (`references/codebase-fit.md`): existing helper to call, dead code, duplicates.
- **Q2 altitude** (`references/design-quality.md`): bandaid vs right depth.
- **Q3 consistency** (`references/codebase-fit.md`, `references/universal-quality.md`): sibling guards, convention drift, naming.
- **S security** (`references/security-review.md`): owns threat-model, infra, and exploit-path routes.
- **P performance** and **T test-coverage** lanes.
- **U personas**: attacker, 3am-oncall, and maintainer passes in parallel.
- **A architecture** (`references/architecture-review.md`): advisory default with a blocking exception (see `references/architecture-review.md`); builds the Architecture Map when registered (see conditional lane below); unregistered diffs get a minimal Map sketch (inventory plus touched edges only).
- **D specialized finders**: 0-2 per-review lanes synthesized from the risk map when the diff concentrates in a domain with known failure modes.
- **B build & test probe**: shell only under the QA worker role; mutating probes run in a throwaway worktree so readers never see a dirty tree.
Review workers follow `../forge/references/worker-templates/review.md`. Shared methodology skills (such as `dispatching-parallel-agents`) are referenced by skill name and ship with `forge` in this repo.

Large-diff rule: when the diff exceeds 500 source lines or 3200 total lines, switch the C and Q groups to territory agents of roughly 400 lines each, split on hunk boundaries and never inside a function. Cap each worker at 40 files / 200kB per chunk; permute file order per agent so the same files are not always read last. Whole-diff lanes (S, A, U, D, the cross-chunk half of C2, C3) keep whole-diff scope. Checkpoint per lane (run key = HEAD + diff bytes + lane set); on interruption resume from the last completed lane, never silently re-scope. Any lane without a receipt, any failed worker, or any capped hunt is surfaced as an explicit `PARTIAL REVIEW` gap — never absorbed quietly. Re-runs on an advanced HEAD review only the `last_reviewed..HEAD` delta (incremental); same-SHA re-runs reuse artifacts.

Effort tiers change depth, never diff/base mechanics: `low` is a pre-screen outside `moes` (inline sweep only: no Ledger, no Decision Packet, no verdict, no ship-readiness claim); `medium` runs a reduced fan-out plus build/test and a single verification pass with no reverse audit; `high` runs the full fan-out plus sharded verification plus reverse audit. Default to `high` for `/moes`; a green-lane diff may drop to `medium` with an explicit note.

Use the Phase-0 risk map and project context capsule to decide which conditional lanes deserve real attention. `moes` should not pretend every diff has the same risk profile.

- Build and carry a specialty lane registry as part of the Phase-4 artifact set.
  The registry is compact metadata, not a second checklist document: lane name,
  why it was considered, state (`run`, `N/A`, or `deferred by environment`),
  mutability mode (`read-only`, `report-first`, or `small-fix-allowed`), and
  any escalation target.
- Every `N/A` or `deferred by environment` state carries a one-line why-not naming the checked signal.
- Spot-check N/A claims on yellow/red diffs: re-verify the 2-3 highest-risk skipped lanes by grepping the diff for trigger signals; a trigger signal present despite `N/A` is a process finding plus the lane runs.
- On yellow/red diffs, `deferred by environment` converts to a `Plan` finding naming the concrete follow-up check, or an explicit user-accepted gap (`Decide`); green diffs keep the one-line note.
- Every audit lane emits candidate findings into the shared `Finding Set`,
  normalized according to `references/findings-lifecycle.md`.
- Candidate findings must include a provisional recommended action so the
  shared `Finding Set` stays structurally complete; consolidation is
  responsible for verifying and finalizing the
  `Fix` / `Investigate` / `Plan` / `Decide` action type.
- If a lane reference suggests a bucket list, short assessment, or any other
  lane-local scratch format, treat that as intermediate reasoning only. The
  final emitted output from every lane must still be normalized into the shared
  `Finding Set`.
- The challenger is selective, not universal. Run it for red-lane diffs,
  high-severity findings with medium/low confidence, disagreement between audit
  lanes, thin pre-verification evidence in a high-impact area, unusually
  large or cross-cutting diffs, or as executor of the surprise pass when a yellow-or-higher diff reports zero design findings.
- Challenger scope: disprove weak blockers, look for missed high-impact bug
  classes, and test whether key findings are duplicated, overstated, or
  under-supported.
- Challenger limits: it does not replace the main audit, generate a second wall
  of noisy findings, or change the verdict without evidence.
- Challenger execution: on hosts with subagents, run it as a fresh-context
  adversarial pass using the same diff and the relevant slices of the
  `Evidence Pack`. Blind discipline: pass only `title + description + code` per challenged finding — never the originating lane's reasoning or evidence text. On hosts without subagents, run the same challenger criteria
  inline as a separate pass after the reverse audit (order for the whole back half: consolidate, then sharded verification, then reverse audit, then challenger).
- Auto-fix contract: only apply findings whose fix is safe, localized,
  low-blast-radius, and realistically verifiable in Phase 6. Do not auto-fix
  architecture boundary changes, rollout-plan changes, legal/policy wording,
  reviewer-facing submission metadata, or speculative hardening that lacks a
  concrete triggered defect. Those stay as `Plan`, `Decide`, or
  `Investigate` findings unless the user explicitly broadens scope.
- Escalation hooks: keep specialty lanes orchestration-focused and route them
  outward instead of embedding their full checklists here. Use
  `error-handling-review.md` for retry/recovery-heavy flows,
  `accessibility-review.md` for UI/markup accessibility surfaces,
  `appstore-review.md` for iOS metadata/purchase/privacy/reviewer-facing
  surfaces, the security-owned specialty routes in
  `security-review.md` / `security-cheat-sheets.md` for infra, workflow,
  exploit-path, or threat-model escalation, and
  `architecture-docs-review.md` for public API or architecture boundary
  changes. Use `qa-evidence-review.md` when Forge produced or should have
  produced QA intent, Playwright/API tests, exploratory browser evidence, or a
  QA capability matrix.

- **Code review:** dispatch a fresh-context subagent (per the `dispatching-parallel-agents` skill) to review the diff following `references/code-review.md`. Pass the diff plus the shared context packet defined above. Start with the fast sweep from `references/common-bugs-checklist.md` and `references/universal-quality.md`, then do the deeper correctness pass. On a host without subagents, follow those references as an inline adversarial pass using the same context packet.
- **Security review:** dispatch a fresh-context subagent to audit the diff following `references/security-review.md`, using `references/security-cheat-sheets.md` as the canonical router for the conditional security surfaces. Pass the diff plus the shared context packet defined above. Inline-adversarial fallback as above. When migration, observability, or configuration surfaces are in play, this lane owns the security-specific findings for them; the separate operational lanes below own the non-security rollout/operability/behavior findings. Infra, GitHub Actions exploit-path, threat-model-escalation, and security-requirements routes stay under security-lane ownership: keep them visible in the specialty lane registry, but normalize their findings under the shared security lane rather than as standalone Phase-4 lanes. Use the threat-model route when a red-lane trust boundary changes or a high-impact security finding needs abuse-path framing before it can block.
- **Delegation recovery:** dispatched audit subagents must behave per `../forge/references/delegation.md`. If a review subagent fails, times out, is cancelled, or never returns, do not wait on it — run the same lane inline as an adversarial pass, or continue degraded with the partial result recorded. Never block the pipeline on a worker that does not deliver.
- **Secret scan:** scan the diff for committed secrets, credentials, tokens,
  private keys, or `.env` values. Verify hits with the same false-positive
  discipline in `references/findings-lifecycle.md`; any confirmed real secret
  is a hard stop for the `moes` run and must be resolved before the
  pipeline can continue.
- **Dependency & license audit** *(only if the diff changed dependency manifests/lockfiles)*: follow `references/dependency-audit.md` — check new/bumped dependencies for known vulnerabilities, license compatibility, and supply-chain hygiene. Skip with a note if no dependencies changed.
- **Static intelligence** *(only if the diff changed JavaScript/TypeScript,
  related framework/module files, or JS/TS manifests/workspace config such as
  `package.json`, lockfiles, or `tsconfig*`)*: follow
  `references/static-intelligence.md` — check changed-code dead code,
  unresolved/duplicate exports, dependency graph hygiene, duplicate logic,
  complexity/hotspot risk, boundary signals, and stale feature-flag paths. This
  lane is tool-optional: use project-native evidence and manual checks by
  default; if a suitable static-analysis tool is already available, it may
  accelerate the read-only audit, but `moes` must not install tools,
  initialize config, enable telemetry, or apply tool-driven autofixes.
- **Migration safety** *(only when the risk map or hotspots include schema,
  rollout, data-shape, or backfill risk)*: follow
  `references/migration-safety.md` for non-security migration/rollout safety.
  If the same surface also has security implications, keep the security finding
  under the security lane and the operational/rollout finding here.
- **Docker / deployment review** *(only when the diff changes Dockerfiles,
  Compose, image build logic, deployment manifests, health checks, rollout
  strategy, or runtime container behavior)*: follow
  `references/docker-deployment.md` for image safety, runtime least privilege,
  health-check discipline, and rollout assumptions. Keep exploit-path or
  infra-exposure findings under the security lane; use this lane for
  non-security operability and rollout correctness.
- **Observability review** *(only when the diff affects logging, tracing,
  auditing, or incident visibility on important flows)*: follow
  `references/observability-review.md` for signal quality and operability.
  Keep security-sensitive logging or redaction issues under the security lane,
  and operational visibility issues here.
- **Configuration review** *(only when the diff changes env vars, flags,
  deployment config, defaults, rollout behavior, debug settings, or
  production-vs-dev behavior)*: follow `references/configuration-review.md` for
  safe defaults and deploy behavior. Keep security misconfiguration findings
  under the security lane and non-security behavior/routing findings here.
- **Error-handling review** *(only when the diff changes retries, jobs, async
  flows, side effects, recovery logic, or user-visible failure paths)*:
  follow `references/error-handling-review.md` for resilience and degradation
  behavior around the changed flow. Keep security-sensitive controls under the
  security lane and pure signal-quality gaps under observability unless the
  core issue is recovery behavior itself.
- **Accessibility review** *(only when the risk map flags user-facing UI or
  markup as a specialty surface)*: register the lane and route it through
  `accessibility-review.md`. If the environment cannot support the required
  audit, mark the lane `deferred by environment` and carry that forward.
- **Browser QA** *(only when the diff changes important user-facing web UI and
  a runnable browser target exists)*: follow `references/browser-qa.md` for
  smoke, interaction, visual, and lightweight browser-based verification of
  the changed UX. Keep deeper accessibility findings and remediation under the
  dedicated accessibility lane.
- **QA evidence review:** when the Forge run includes QA intent, Playwright/API
  artifacts, exploratory browser notes, or a capability matrix, follow
  `references/qa-evidence-review.md`. Verify that QA evidence covers the
  diff's meaningful risks, that missing capabilities are honestly marked, and
  that test gaps are normalized into the shared `Finding Set` only when they
  affect this diff's ship-readiness.
- **App Store / reviewer-facing review** *(only when the risk map flags iOS
  metadata, purchase, privacy, or reviewer-facing submission surfaces)*:
  register the lane and route it through `appstore-review.md`.
- **Architecture review** *(only when the diff changes a public API, an
  architecture boundary, or module responsibilities)*: register the lane and
  route it through `architecture-review.md`, which builds the Architecture Map
  and calls `architecture-docs-review.md` as its docs-staleness checklist.
- **Post-deploy monitoring** *(only when the diff changes deployed web
  behavior, rollout-sensitive config, or release-critical journeys and a
  target environment is available)*: follow
  `references/post-deploy-monitoring.md` for canary-style runtime verification
  and regression thresholds.
- **Focused bug hunt:** follow `references/bug-hunting.md` to generate a small set of high-value bug hypotheses from the diff itself — boundaries, invariants, state transitions, retries, concurrency, caching, persistence, auth/tenant separation, and rollout/failure paths. Prefer focused probes with existing tests/harnesses/tools over broad new scaffolding; do not install dependencies or build elaborate new frameworks inside `moes`.
- **Project-context fit:** per `references/project-context.md`, check the change
  respects the repo's standing instructions, domain rules, tooling/test norms,
  docs/release conventions, and any explicitly stated architecture
  constraints. Flag missing or ambiguous project guidance as an unknown, not a
  guessed rule.
- **Consistency & codebase fit:** per `references/codebase-fit.md`, check the
  change fits the existing architecture in practice — reuses prior art, matches
  established patterns, doesn't duplicate existing functionality or introduce a
  competing pattern, and respects module boundaries. When project-context fit
  and codebase fit notice the same problem, keep one finding under the lane with
  the clearest ownership instead of duplicating it. Do the same when a finding
  overlaps with structural regression. Give the A lane the same treatment: A owns cross-module shape plus the Map, Q1 owns local reuse, Q2 owns depth, and structural regression owns degradation this change caused — cross-point to one finding instead of duplicating it. The same single-report rule covers steelmans: one per unique mechanism.
- **Spec conformance:** per `references/spec-conformance.md`, check the diff against the intent pinned in Phase 0 — missing or partial requirements, scope creep (behavior nobody asked for), and implemented-but-wrong. If no external spec was pinned, run the lighter internal-consistency check instead (half-built paths, dead branches, leftover scaffolding). A confirmed missing requirement or implemented-but-wrong result is blocking. Missing/partial requirements are flagged, not implemented, inside `moes`; implemented-but-wrong issues may still be fixed when they are localized `Fix` findings rather than new feature work.
- **Structural regression:** per the diff-scoped lane in
  `references/refactoring.md`, check whether *this change* degraded structure —
  ad-hoc branching tangled into an unrelated flow, feature logic leaking into a
  general module, file bloat, a duplicated canonical helper, or a boundary
  leak. Diff-scoped only: flag degradation the change caused; do not flag or
  rewrite untouched neighboring code. If the same problem is already best owned
  by codebase fit, report it once there instead of duplicating it.
- **Design-quality review:** follow `references/design-quality.md` to produce
  compact `Design Quality Notes` for changed surfaces where the design lesson is
  meaningful. Capture both strengths worth preserving and design risks worth
  surfacing, but require mechanism-level evidence: what knowledge moved, what
  callers now need to know, whether the interface became deeper or shallower,
  and whether change amplification, cognitive load, locality, or unknown
  unknowns improved or worsened. Do not emit generic praise or block on
  aesthetics; design risks that become findings still flow through
  `references/findings-lifecycle.md`.

Consolidate the lanes into one punch list. **Before marking anything blocking,
run it through `references/findings-lifecycle.md`** — require a concrete
reachable trigger, blame origin (`new` / `surfaced` / `pre-existing` from diff ranges, never guessing), downgrade known false-positive classes, verify any
framework/library claim against docs, and assign the right action type and
status. Every surviving finding must carry title, lane/source, file or
surface, origin, severity, confidence, reachability, evidence type, concrete
trigger/evidence, violated invariant or spec point, action type
(Fix / Investigate / Plan / Decide), and an internal workflow status from the
shared `Finding Set`. Order by business impact (`new` blockers first, then `surfaced`).
Only localized findings with action type `Fix` should be fixed inside
`moes`, and only when they satisfy the auto-fix contract above. Blocking
findings with action types like `Plan`, `Decide`, or `Investigate` stay open
and are reported forward rather than auto-fixed. Any fix applied here must
still pass Phase 6 verification for the touched code. Record non-blocking
items, systemic follow-ups, and human decision points in the final report,
where Phase 8 can map findings into report-facing statuses.

Gate: no speculative or unverified blocking review, security, dependency,
static-intelligence, migration-safety, observability, configuration,
bug-hunting, project-context, consistency, spec-conformance, or structural
findings remain; no secrets in the diff. Any blocking findings that do remain
must be verified (reproducible trigger), correctly normalized in the
`Finding Set`, and explicitly carried into Phase 7 for the verdict.

### Phase 5 — Update docs *(modifies docs)*

Bring documentation in sync with the change so the next reader isn't misled.

- Follow `references/update-docs.md`. It covers what to check (READMEs, `CLAUDE.md`, API/usage docs, inline docstrings for changed signatures, and the changelog) and how to keep updates minimal and truthful.
- For doc-type escalation, route through `references/docs-quality-router.md`;
  when the diff changes public APIs, system boundaries, or responsibilities,
  pair that with `references/architecture-docs-review.md`. For iOS
  submission-facing metadata, purchase, privacy, or reviewer-setup docs, use
  `references/appstore-review.md`. App Store-only diffs use that lane alone;
  mixed diffs that also change API/boundary/responsibility surfaces run both
  lanes.
- Use the `Evidence Pack` and risk lane, not just touched files, to decide
  whether docs, rollout notes, config guidance, or migration instructions should
  be updated.

Gate: docs affected by the change are updated; the changelog has an entry if the project keeps one.

### Phase 6 — Verify *(gate)*

Gather hard evidence that the change works after all the modifications above. This evidence feeds the validation gate.

- Phase 6 must produce the shared `Verification Ledger` following
  `references/verification-ledger.md`, recording what was run, what was
  observed, which risks were exercised, and which remained unexercised.
  When Forge QA ran before `moes`, include the QA capability matrix and
  Playwright/API artifacts in the verification ledger. Do not collapse
  `not configured` or `deferred` capabilities into success.

1. **Static gates:** run the project's formatter, linter, and type-checker (detected in Phase 0). These are cheap and catch more than human review.
2. **Test suite:** run the full suite. It must pass. Confirm that new functionality is actually covered by tests — if a new code path has no test, that is a finding for the validation gate. Also assess the *quality* of new/changed tests against `references/testing.md` — they should test behavior not implementation, avoid over-mocking, and be deterministic; a brittle, order-dependent, or vacuous (asserts-nothing) test is itself a finding, since green-but-meaningless tests are false confidence. Use `references/bug-hunting.md` to choose a few focused probes or regression tests for the highest-risk bug hypotheses instead of relying on broad coverage numbers.
3. **Behavioral check:** follow **`references/verify.md`** to actually run the app/feature and observe real behavior, not just green tests. Type-checks and tests prove code correctness, not feature correctness. Build the verification plan from the Phase-0 risk map and project context capsule: always exercise the golden path, at least one meaningful negative/error path, and at least one risk-specific probe for each top failure mode that matters (retry/double-submit, persistence round-trip, old/new data shape, auth boundary, stale cache, project-specific domain invariant, etc.). Use the required-probe guidance in `verify.md` so every archetype in the risk map gets at least one meaningful probe. Route through `references/testing-specialty-router.md` when the changed surface needs Playwright-specific browser guidance or pytest-specific fixture/async discipline, `references/browser-qa.md` when important runnable UI changes need browser evidence beyond generic checks, `references/post-deploy-monitoring.md` when deployed web behavior needs canary-style runtime verification, and `references/error-handling-review.md` when retries, jobs, or recovery behavior need targeted probes.
4. **Accessibility check** *(only for UI changes)*: verify the a11y rules from `references/best-practices/frontend-a11y-i18n.md` actually hold — a keyboard pass plus an automated checker (e.g. axe), not just code inspection.
5. **Performance profiling** *(only if the change touches a hot path / performance-sensitive code)*: follow `references/performance-profiling.md` — measure against realistic data, find the real bottleneck, confirm any optimization with a before/after. Skip with a note for cold-path changes.
6. **Deployment/runtime checks** *(only when the diff changes containerized runtime or rollout-sensitive deployment behavior)*: use `references/docker-deployment.md` for non-security container/build/runtime assumptions and health-check verification; keep exploit-path or infra-exposure concerns under the security lane.

Gate: lint/format/type-check clean, tests green, the feature observably works, and any a11y/perf concerns are resolved or explicitly recorded. Phase 6 allows max 2 fix attempts (3 runs total) per `references/verify.md`. `flaky`/`infra` never satisfy the gate. An exhausted loop goes to Phase 7 with NEEDS REVISION plus the ledger trail, not silent green.

### Phase 7 — Validation gate *(gate)*

Apply the critical, structured validation review to the final diff and produce a verdict.

- Phase 7 produces the `Decision Packet` following
  `references/findings-lifecycle.md`: evidence summary, surviving findings,
  verification coverage, residual unknowns, and verdict rationale.
- Carry `Design Quality Notes` into the `Decision Packet` only when their
  disposition is `report`, `finding`, or a meaningful `defer`. Positive
  strengths support learning and reviewer handoff; risks affect the verdict
  only when they survive the same evidence and action-typing discipline as
  other findings.

- Follow `references/validation-gate.md` exactly — it is a 12-section checklist (including business-risk lanes for data integrity, idempotency/concurrency, and financial correctness) plus a required final risk pass. Reason about each item against the diff, the Phase-0 project context capsule, the Phase-0 risk map, and the evidence gathered in Phase 6; flag issues rather than assuming correctness. Use the checklist as a floor; bring forward any residual bug hypotheses from `references/bug-hunting.md` that the checklist doesn't name explicitly.
- Apply the same `references/findings-lifecycle.md` discipline as Phase 4:
  anything that pushes the verdict to `NEEDS REVISION`/`BLOCKED` needs a
  concrete reachable trigger, every finding carries severity, confidence,
  action type, trigger/evidence, and status, and findings are ordered by
  business impact. Fold in the Phase 4 spec-conformance result — a confirmed
  missing requirement is `NEEDS REVISION`.
- Calibrate the verdict with the rules in `references/validation-gate.md`, not gut feel. Different issues should push to `READY TO SHIP`, `NEEDS REVISION`, or `BLOCKED` for clear reasons, especially on data loss, security, broken core flows, dangerous migrations, and unverifiable rollout risk.
- Explicitly state which top risks were disproven, which remain open, and
  whether the remaining open risks are acceptable for shipping.
- Treat unresolved QA evidence gaps from `qa-evidence-review.md` as residual
  risk inputs. They block only when they survive the findings lifecycle and
  materially affect this diff's ship-readiness.
- The gate ends in one verdict: **READY TO SHIP**, **NEEDS REVISION**, or **BLOCKED**, with a short justification.

Gate: a verdict is produced. `BLOCKED` or `NEEDS REVISION` means the change is *not* presented as shippable — surface what must be fixed.

### Phase 8 — Final report & retro *(no git writes)*

Close out without taking git actions (per the no-automatic-writes principle).

Follow `references/final-reporting.md` so the output is **decision-ready** for the user and **review-ready** for a PR. The report should be concise, but it must surface the evidence, findings, residual risk, and next action clearly enough that the user does not have to reconstruct what happened.

- Phase 8 reports from the `Decision Packet` rather than reconstructing the
  story from scratch.
- Surface report-facing finding statuses from `references/findings-lifecycle.md`
  (`fixed`, `unresolved`, `deferred`, `needs user decision`) in the final
  report. Do not expose the internal workflow statuses from the shared
  `Finding Set` unless they are specifically useful as metadata.
- Be explicit about coverage honesty: distinguish what was **directly
  verified**, what was only **reasoned about**, and what remained
  **environment-blocked** or otherwise unexercised.

Present a concise report:

```
# Moes report

**Verdict:** READY TO SHIP | NEEDS REVISION | BLOCKED

## Executive summary
- <2-4 sentence plain-language summary of what changed and whether it is shippable>

## What changed
- Scope: <what feature/fix/refactor the diff delivers>
- Files/surfaces touched: <major areas only>
- Intent/spec source: <issue/spec/user statement/none>
- Risk lane: <green | yellow | red>
- Project context: <standing instructions, architecture/domain conventions, and unknowns that mattered>

## Evidence
- Static gates: <formatter/lint/typecheck status>
- Tests: <suite status + notable targeted probes/regressions added/run>
- Behavioral verification: <real flows exercised, manual or automated>
- Docs/config: <what was updated or checked>
- Project fit: <architecture boundaries, prior-art reuse, domain rules, tooling/test/doc conventions checked>
- Perf/a11y/rollout/security: <only the relevant lanes and their evidence>

## Findings
- Blocking: <none, or list with severity/confidence/origin/action/trigger/report status; `new` first>
- Surfaced (old code this diff activates): <downgraded one tier, with activation path; never blocks except red-lane + reachable trigger>
- Non-blocking: <deferred items, coverage gaps, low-confidence notes, planned follow-ups, decision points, with report status>

## Considered and dismissed
- <title plus one-line reason for each Finding Set member dropped after challenge or verification, ex-blockers first then by severity and confidence, maximum 5; omit this entire section when empty>

[Conditional: include only when meaningful design strengths exist]
## What went right
- <meaningful design strengths from `Design Quality Notes`; omit this entire section when there are no evidence-backed examples worth preserving>

## Learning notes
- <for the most instructive findings, fixes, positive design notes, or rejected recommendations: principle/source lens, mechanism, why it matters here, trade-off or drawback, when not to apply, and an alternative>

## Verification coverage
- Directly verified: <what was run and observed>
- Reasoned about: <what is supported indirectly by static checks, surrounding evidence, or code inspection>
- Environment-blocked / not exercised: <what remained unproven and why>

## What each phase did
- Best-practices: <changes made, or "no change">
- Simplify: <...>
- Refactor: <...>
- Audit: <blocking fixed / non-blocking deferred>
- Docs: <...>
- Verify: <lint/types/tests/app status>

## Residual risk / open questions
- <what was not fully proven, not runnable, or intentionally deferred>

## Recommended next step
- <if READY TO SHIP: suggested PR/commit framing and any reviewer attention points>
- <if NEEDS REVISION/BLOCKED: exact fixes required before re-running `moes`>

## Compact metadata
- Risk lane / challenger / lane availability: <lane, whether challenger ran, and any major skipped or unavailable lanes>
- Specialty lane registry: <lane -> `run` | `N/A` | `deferred by environment`, plus any escalation targets>
- Specialty-lane auto-fixes: <which specialty-lane findings were auto-fixed, or `none`; note Phase-6 verification status>
- Threat-model escalation: <whether the security-owned `threat-model-escalation.md` route was triggered and what follow-up it caused>
- Audit independence: <structural or instructional>
```

Then a brief **retro**: note anything from this session worth remembering (a recurring mistake, a project convention discovered, a workflow preference). If it is durably useful, offer to save it to memory. Keep this to a few lines — it is a learning capture, not a second report.

Do not commit, push, or open a PR. If the verdict is READY TO SHIP, you may suggest the exact commit/PR command for the user to run.

## Reference files

| File | Used in | Purpose |
|------|---------|---------|
| `references/best-practices/_index.md` | Phase 1 | Language → best-practices file router |
| `references/best-practices/general-oop.md` | Phase 1 | SOLID, DI, composition, layering for backend code |
| `references/best-practices/clean-coding.md` | Phase 1 | Cross-language naming, control-flow, comment, error-handling, and readability guidance |
| `references/best-practices/javascript.md` | Phase 1 | JS hygiene + patterns.dev design/performance/rendering patterns |
| `references/best-practices/typescript.md` | Phase 1 | TypeScript idioms & anti-patterns |
| `references/best-practices/react.md` | Phase 1 | React hooks, effects, boundaries, data flows, and rendering discipline |
| `references/best-practices/python.md` | Phase 1 | Python idioms & anti-patterns |
| `references/best-practices/fastapi.md` | Phase 1 | FastAPI route/dependency, schema, async, and API-boundary discipline |
| `references/best-practices/django.md` | Phase 1 | Django / DRF ORM, serializer, viewset, and security discipline |
| `references/best-practices/python-details.md` | Phase 1 | Python tooling config + worked examples (loaded on demand from `python.md`) |
| `references/best-practices/php.md` | Phase 1 | PHP idioms, PSR, typing, static analysis, security, performance, testing |
| `references/best-practices/laravel.md` | Phase 1 | Laravel specifics (Eloquent/N+1, FormRequests, queues) — layers on `php.md` |
| `references/best-practices/vue.md` | Phase 1 | Vue 3 / Composition API idioms |
| `references/best-practices/css.md` | Phase 1 | CSS cascade, responsiveness, motion, and maintainability discipline |
| `references/best-practices/sql.md` | Phase 1 | Cross-engine SQL query & index optimization |
| `references/best-practices/rust.md` | Phase 1 | Rust ownership, thiserror/anyhow, SAFETY comments, async/cancellation discipline |
| `references/best-practices/go.md` | Phase 1 | Go error wrapping, goroutine ownership, ctx propagation, resource discipline |
| `references/best-practices/postgresql.md` | Phase 1 | PostgreSQL + ORM (TypeORM/Prisma) patterns |
| `references/best-practices/supabase.md` | Phase 1 | Supabase RLS/auth, roles, pooling (layers on postgresql/sql) |
| `references/best-practices/frontend-a11y-i18n.md` | Phase 1 (+6) | Accessibility & i18n for UI changes |
| `references/testing.md` | Phase 1 (+6) | Test-quality discipline (behavior over implementation, determinism, mocking) |
| `references/simplify.md` | Phase 2 | Local clarity: equivalence test, clarity ethos, local-simplification catalog |
| `references/evidence-pack.md` | Phase 0 (+4 +6 +7 +8) | Canonical `Evidence Pack` schema and output discipline for diff scope, comparison point, surfaces, context, intent, risk lane, runtime sketch, hotspots, specialty-lane candidates, environment availability, architecture/App Store implications, verifier inventory, and unknowns |
| `references/project-context.md` | Phase 0 (+1 +4 +6 +7 +8) | Capture repo-specific instructions, architecture boundaries, domain rules, tooling/test/doc conventions, and unknowns |
| `references/codebase-fit.md` | Phase 1 (+4) | Reuse prior art, match patterns, respect boundaries — fit the change to the repo |
| `references/universal-quality.md` | Phase 1 (+4) | Cross-language anti-patterns: abstraction leaks, flag bloat, stringly typed behavior, redundant writes, check-then-act races, shallow wrappers |
| `references/spec-conformance.md` | Phase 0 (+4) | Pin the originating intent; check the diff for missing requirements, scope creep, wrong implementation |
| `references/risk-mapping.md` | Phase 0 (+4 +6 +7) | Classify the change, define invariants/boundaries/side effects, and choose the highest-value risks to probe |
| `references/refactoring.md` | Phase 3 (+4) | Refactor priority model, behavior-preservation discipline & the diff-scoped structural-regression lane |
| `references/design-quality.md` | Phase 4 (+7 +8) | Diff-scoped design-quality notes: meaningful strengths, concrete design risks, Ousterhout/SOLID/project-fit lenses, mechanism-level explanations, and optional positive reporting |
| `references/findings-lifecycle.md` | Phase 4 (+7 +8) | Shared lifecycle for normalized findings, blocker verification, action typing, report-status mapping, and the `Decision Packet` |
| `references/code-review.md` | Phase 4 | Correctness/bug review of the diff (logic, edges, error paths, concurrency, resource leaks, API misuse) |
| `references/common-bugs-checklist.md` | Phase 4 | Fast sweep of recurring defect classes so boring-but-reachable bugs are not missed before deeper review |
| `references/security-review.md` | Phase 4 | Security audit floor plus conditional focused lanes for API, auth/session, input/output, workflow/release, repo hygiene, migration, observability, configuration, and LLM/agent behavior |
| `references/bug-hunting.md` | Phase 4 (+6 +7) | Risk-led bug-finding: invariants, edge sweeps, retries, concurrency, deterministic repro, fault probes, and Playwright/system-flow guidance when already available |
| `references/security-cheat-sheets.md` | Phase 4 | Router for focused security references based on diff surface |
| `references/api-security-review.md` | Phase 4 | OWASP API Top 10-style review for endpoints, webhooks, and machine-facing interfaces |
| `references/agent-security-review.md` | Phase 4 | LLM / agent / tool-calling security review grounded in OWASP LLM risks and AISVS-style verification |
| `references/auth-session-review.md` | Phase 4 | Authentication, authorization, session, cookie, token, MFA, reset, and CSRF checks |
| `references/input-upload-output-review.md` | Phase 4 | Untrusted input, upload, parsing, redirect, rendering, and outbound fetch safety |
| `references/sql-injection-prevention.md` | Phase 4 | Parameterized queries, identifier allow-listing, ORM raw-path safety with multi-language examples |
| `references/xss-prevention.md` | Phase 4 | Sink-aware output encoding, escape-hatch audit, URL/redirect validation |
| `references/n-plus-one-queries.md` | Phase 4 (+6) | ORM eager-loading / batching patterns with per-stack fixes and query-count probe |
| `references/error-handling-principles.md` | Phase 1 (+4) | Cross-language error/retry/compensation patterns companion to `error-handling-review.md` |
| `references/async-concurrency-patterns.md` | Phase 1 (+4) | Owned concurrency, timeouts/cancellation, check-then-act races, delivery semantics |
| `references/workflow-security.md` | Phase 4 | CI / GitHub Actions / release automation security review |
| `references/repo-hygiene.md` | Phase 4 | Supply-chain posture, action pinning, repo policy, and governance-sensitive changes |
| `references/dependency-audit.md` | Phase 4 | Vulnerability, license & supply-chain audit for changed deps |
| `references/observability-review.md` | Phase 4 (+6 +7) | Logging, tracing, auditability, signal quality, and redaction checks |
| `references/migration-safety.md` | Phase 4 (+6 +7) | Schema, migration, backfill, rollout, and persistent-data safety |
| `references/docker-deployment.md` | Phase 4 (+6 +7) | Container/build/runtime/deployment review for Dockerized and rollout-sensitive changes |
| `references/configuration-review.md` | Phase 4 (+5 +7) | Safe defaults, env vars, feature flags, deployment config, and fail-safe behavior |
| `references/static-intelligence.md` | Phase 4 (+7) | JS/TS changed-code graph, duplication, complexity, boundary & feature-flag risk; optional static-analysis accelerator without requiring install |
| `references/error-handling-review.md` | Phase 4 (+6) | Resilience lane for retries, recovery logic, degraded paths, and replay/retry visibility on changed flows |
| `references/accessibility-review.md` | Phase 4 (+6 +8) | Specialty accessibility audit + verification lane for changed UI surfaces, with evidence expectations and limited safe fixes |
| `references/browser-qa.md` | Phase 4 (+6) | Browser smoke, interaction, visual, and accessibility checks for runnable UI changes |
| `references/qa-evidence-review.md` | Phase 4 (+6 +7) | Review Forge QA intent, Playwright/API artifacts, exploratory browser evidence, and QA capability matrix states as evidence rather than regenerating the QA plan |
| `references/appstore-review.md` | Phase 4 (+5 +8) | Specialty App Store / reviewer-facing lane for metadata, purchase, privacy, and submission-readiness surfaces |
| `references/post-deploy-monitoring.md` | Phase 4 (+6 +7) | Post-deploy canary verification, thresholds, compare mode, and regression reporting |
| `references/infra-security-review.md` | Phase 4 security review (+7 +8) | Security-owned specialty route for Docker/Kubernetes/Terraform/cloud config, exposure paths, and least-privilege defaults |
| `references/gha-exploit-review.md` | Phase 4 security review (+7 +8) | Security-owned specialty route for `.github/workflows` and related automation exploit-path analysis |
| `references/threat-model-escalation.md` | Phase 4 security review (+7 +8) | Security-owned escalation route for trust-boundary changes or high-impact findings that need abuse-path framing |
| `references/security-requirements.md` | Phase 4 security review (+7) | Security-owned escalation companion that turns surviving threats into explicit requirement notes and acceptance criteria |
| `references/architecture-docs-review.md` | Phase 4 (+5) | Specialty architecture-doc lane for deciding ADR / architecture / component-doc escalation and detecting stale API/boundary docs |
| `references/docs-quality-router.md` | Phase 5 | Minimal-scope router for choosing README, API docs, runbook, ADR, architecture doc, or component doc |
| `references/update-docs.md` | Phase 5 | What docs to update and how |
| `references/verification-ledger.md` | Phase 6 (+7 +8) | Shared `Verification Ledger` artifact for executed checks, observed results, coverage type, and unexercised risks |
| `references/verify.md` | Phase 6 | Behavioral verification — run the app & observe; composes testing, a11y & performance refs |
| `scripts/triage.py` | Phase 0 | Stdlib-only diff triage: size, time estimate, NO_TEST/SECURITY/MIGRATION/CONFIG/LARGE flags; manual fallback when unrunnable |
| `references/testing-specialty-router.md` | Phase 6 | Router for framework- or stack-specific testing guidance when generic `testing.md` is not enough; use it for Playwright-specific browser flows and pytest fixture/async discipline |
| `references/testing-playwright.md` | Phase 6 (via router) | Playwright specialty guidance for flake-resistant E2E verification and artifacts |
| `references/testing-pytest.md` | Phase 6 (via router) | Pytest specialty guidance for fixtures, parametrization, async tests, and isolation |
| `references/performance-profiling.md` | Phase 6 | Measure-first profiling for hot-path changes |
| `references/performance-specialty-router.md` | Phase 6 | Router for stack-specific performance guidance when generic profiling needs ecosystem detail |
| `references/validation-gate.md` | Phase 7 | 12-section validation checklist (incl. business-risk lanes) + verdict |
| `references/final-reporting.md` | Phase 8 | PR-ready reporting: executive summary, `Verification Ledger` summary, findings, residual risk, reviewer handoff |
