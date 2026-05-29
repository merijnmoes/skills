# Design — Self-contained audit & verify for `finalize`

- **Date:** 2026-05-29
- **Status:** Approved (pending spec review)
- **Scope:** `plugins/finalize/skills/finalize` + `README.md`

## Problem

`finalize` is an orchestrator that, in its audit and verify phases, delegates to three Claude Code first-party slash commands:

- Phase 4 — `/code-review` (correctness review of the diff)
- Phase 4 — `/security-review` (security audit of the pending changes)
- Phase 6 — `/verify` (run the app, observe real behavior)

These commands exist only inside Claude Code. They have no equivalent in GitHub Copilot CLI or OpenAI Codex CLI, so the skill cannot run unmodified on those agents. The user wants `finalize` to depend on **its own implementation** (inline references the AI follows) rather than host-agent built-ins or third-party tooling — both for control and for eventual portability.

There is direct precedent in this repo: commit `f2d0eb3` already replaced the built-in `/simplify` with the repo's own `references/simplify.md`. This design applies the same move to the last three delegations.

## Goals

- Remove `finalize`'s dependence on `/code-review`, `/security-review`, and `/verify`.
- Replace each with a reference file the skill owns, so the behavior travels with the repo.
- Keep the audit's **independent, fresh-eyes** property.
- Make `security-review.md` comprehensive — at minimum the full OWASP Top 10:2025, plus conditional API and LLM lenses.
- Preserve the existing pipeline shape, phase ordering, and validation gate.

## Non-goals (explicitly deferred)

- Cross-platform packaging: AGENTS.md orchestrator form, Copilot `.agent.md` profiles, Codex skill packaging. The output of this work remains a Claude `SKILL.md`; it merely stops depending on host commands.
- Any change to Phases 0–3, 5, 7, 8 beyond doc/principle wording.
- Replacing or re-deriving the existing references (`finding-verification.md`, `codebase-fit.md`, `spec-conformance.md`, `refactoring.md`, `dependency-audit.md`, `testing.md`, `simplify.md`).

## Decisions (from brainstorming)

1. **Independence mechanism — subagent dispatch.** The two review lanes run in a **fresh-context subagent** that follows the repo's own reference file; the main agent only consolidates findings. The reference file is the source of truth. Where the host has no subagent mechanism, the same reference is followed as an **inline adversarial pass** (graceful degradation). This preserves independence on Claude Code today and keeps the content portable.
2. **Verify — main-agent inline procedure.** `verify.md` is followed by the main agent in Phase 6, not a subagent: verification is behavioral observation that benefits from the main agent's knowledge of the change's intent and its ability to drive the dev server/browser. Independence is not the goal there; observation is.
3. **Scope — self-containment only.** Build the three references + rework Phases 4 and 6. Defer cross-platform packaging.
4. **Reference composition — composed (not duplicated).** Each new reference owns its core domain and links to the shared references rather than copying them. `finding-verification.md` remains the single home of the trigger-test discipline; `dependency-audit.md` remains the single home of supply-chain checks.
5. **Security completeness — OWASP Top 10:2025 floor + lenses.** `security-review.md` is structured around all ten 2025 categories (verified against owasp.org on 2026-05-29), always applied, plus general extras, plus two conditional lenses (API, LLM/GenAI) applied only when the diff has that surface.

## Design

### New reference: `references/code-review.md`

Correctness / bug-hunting review of the **diff only**. Content:

- Logic errors and off-by-one; incorrect conditionals/boolean logic.
- Edge and boundary conditions (empty, max, negative, unicode, timezones).
- Error and failure paths — unhandled exceptions, swallowed errors, fail-open vs fail-closed.
- Null / undefined / optional handling.
- Concurrency, ordering, and race conditions; non-atomic read-modify-write.
- Resource leaks — file handles, DB connections, listeners, memory.
- API / contract misuse — wrong argument order, ignored return values, misused library APIs (verify current usage against docs when unsure).
- Incorrect state mutation and shared-state aliasing.
- Type-boundary correctness (parse/serialize edges, unchecked casts).
- Dead / unreachable code introduced by the change.

Discipline: diff-scoped (do not review untouched neighbors); every candidate finding must survive the trigger test in `finding-verification.md`; label severity + confidence; order by business impact.

### New reference: `references/security-review.md`

Security audit of the diff. **Always-applied core — OWASP Top 10:2025** (each category mapped to concrete diff-level checks, not just definitions):

| # | Category | Notes for the reference |
|---|---|---|
| A01 | Broken Access Control | includes IDOR and **SSRF** (merged here in 2025); missing authz checks, privilege escalation |
| A02 | Security Misconfiguration | insecure defaults, debug endpoints, permissive CORS, verbose errors |
| A03 | Software Supply Chain Failures | **composes with `dependency-audit.md`**; new/bumped deps, lockfile integrity |
| A04 | Cryptographic Failures | weak/aging algorithms, hardcoded keys, bad randomness, plaintext sensitive data |
| A05 | Injection | SQL/NoSQL/command/template injection and **XSS**; unparameterized queries, unescaped output |
| A06 | Insecure Design | missing security control by design, abuse cases, trust-boundary gaps |
| A07 | Authentication Failures | weak session/token handling, missing MFA paths, credential stuffing exposure |
| A08 | Software or Data Integrity Failures | unsigned updates, unsafe deserialization, untrusted CI/build inputs |
| A09 | Security Logging and Alerting Failures | missing audit logs, **sensitive data in logs**, no alerting on security events |
| A10 | Mishandling of Exceptional Conditions | error handling that leaks info or fails open; inconsistent exception flow |

**Always-applied general extras:** CSRF, open redirect, insecure file upload/handling, sensitive data in responses.

**Conditional lens — API** (apply when the diff touches HTTP API endpoints), grounded in the OWASP API Security Top 10 (2023): BOLA, broken object property-level authz / mass assignment, broken function-level authz (BFLA), unrestricted resource consumption / rate limiting, improper inventory management, unsafe consumption of upstream APIs.

**Conditional lens — LLM/GenAI** (apply when the diff calls an LLM or builds agent behavior), grounded in the OWASP Top 10 for LLM Applications: prompt injection (direct + indirect), improper/insecure output handling, sensitive-information disclosure, excessive agency / over-broad tool permissions, system-prompt leakage.

The **inline secret-scan** remains the dedicated Phase-4 lane (committed secrets/keys/tokens/`.env`) — referenced from here but not duplicated. Every finding runs the `finding-verification.md` trigger test; label severity + confidence; order by business impact.

> Implementation note: verify the exact, current category names and ordering for the **API Security Top 10** and the **OWASP Top 10 for LLM Applications** against owasp.org at write-time (the web Top 10:2025 list was already verified on 2026-05-29), consistent with finalize's "check current docs when unsure" principle.

### New reference: `references/verify.md`

Behavioral verification procedure, run by the main agent in Phase 6:

- **Static gates:** project formatter, linter, type-checker (detected in Phase 0).
- **Test suite:** full run must pass; confirm new code paths are actually covered; assess test *quality* via `testing.md` (behavior over implementation, determinism, no over-mocking, no vacuous asserts).
- **Behavioral check:** launch the app/feature and exercise the golden path plus edge cases; watch for regressions in adjacent features. Green tests prove code correctness, not feature correctness.
- **Accessibility** (UI changes only): keyboard pass + automated checker per `frontend-a11y-i18n.md`.
- **Performance** (hot-path changes only): measure-first per `performance-profiling.md`.
- State explicitly when the app cannot be run in the environment, rather than claiming success.

### Phase 4 rework (Audit)

Replace the two delegated bullets:

- *Code review:* "invoke `/code-review` on the diff" → "**dispatch a fresh-context subagent** (per the `dispatching-parallel-agents` skill) to review the diff following `references/code-review.md`; if the host has no subagent mechanism, perform an inline adversarial pass against the same reference."
- *Security review:* "invoke `/security-review` on the pending changes" → "**dispatch a fresh-context subagent** to audit the diff following `references/security-review.md`; inline-adversarial fallback as above."

Unchanged Phase-4 lanes: secret-scan, dependency-audit, codebase-fit/consistency, spec-conformance, structural-regression, and the consolidation + `finding-verification.md` gate. Phase 4 already instructs parallel-subagent dispatch, so the two reworked lanes slot into the existing parallelization.

### Phase 6 rework (Verify)

Replace step 3 "Behavioral check: delegate to `/verify` ..." → "Behavioral check: **follow `references/verify.md`** to run the app/feature and observe real behavior." The surrounding static-gate/test/a11y/perf steps already describe this work inline; `verify.md` becomes their single home and Phase 6 points to it.

### Operating-principle update (SKILL.md "Delegate, don't duplicate")

Reframe the principle: the audit phases no longer delegate to host built-ins. Their **independence now comes from fresh-context subagents following the repo's own references**, and verify is a main-agent procedure following `verify.md`. Drop the claim that `/code-review`, `/security-review`, `/verify` are the independent built-ins; keep the broader point that the *improve* phases own their guidance.

### Documentation updates

- **SKILL.md reference table:** add rows for `code-review.md` (Phase 4), `security-review.md` (Phase 4), `verify.md` (Phase 6).
- **SKILL.md description / front matter:** wording already lists "code review, security review" as capabilities — no mechanism change needed, but remove any implication of host-command delegation if present.
- **README.md:** update the orchestrator paragraph (currently describes delegation to `/code-review`, `/security-review`, `/verify`), the Phase-4 line in the pipeline diagram, and drop the now-stale "`/simplify` isn't delegated to — it's just `/code-review --fix`" framing (there is no `/code-review` dependency anymore).

## What stays unchanged

The pipeline shape, phase order, the Phase-7 validation gate and its business-risk lanes, and all existing references. Only *who runs the two reviews and how they are sourced* changes, plus `verify`'s home.

## Acceptance criteria

- `finalize` contains **no reference** to `/code-review`, `/security-review`, or `/verify` (grep clean across `SKILL.md`, `references/`, `README.md`).
- The three new reference files exist and are linked from the reference table and the relevant phase text.
- Phase 4 dispatches subagents for the two review lanes with an explicit inline fallback; Phase 6 verify points to `verify.md`.
- `security-review.md` enumerates all ten OWASP Top 10:2025 categories with concrete diff-level checks, plus the API and LLM conditional lenses, and composes (not duplicates) `dependency-audit.md` and `finding-verification.md`.
- The "Delegate, don't duplicate" principle is reframed accurately.

## Risks / notes

- **Subagent independence vs. portability:** the subagent path is the independence mechanism on Claude Code; the inline-fallback wording must be explicit so the skill still functions on agents without subagents (the deferred packaging work will lean on this).
- **OWASP drift:** API and LLM list category names must be verified at write-time; the web Top 10:2025 was verified 2026-05-29.
- **No automated tests** in this repo — verification of the change is by review + grep against the acceptance criteria, not a test suite.
