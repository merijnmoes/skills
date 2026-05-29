# Self-contained finalize audit & verify — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `finalize`'s delegation to the Claude Code built-ins `/code-review`, `/security-review`, and `/verify` with the skill's own reference files, so the pipeline depends on no host-agent commands.

**Architecture:** Three new `references/*.md` files own the audit/verify guidance. Phase 4 dispatches fresh-context subagents that follow `code-review.md` / `security-review.md` (with an inline-adversarial fallback where the host has no subagents); Phase 6 follows `verify.md` in the main agent. The pipeline shape, phase order, and validation gate are unchanged; existing references are composed, not duplicated.

**Tech Stack:** Markdown skill content (Claude Code SKILL.md + references). No code, no test suite — verification is by `grep` against acceptance criteria.

**Spec:** `docs/superpowers/specs/2026-05-29-finalize-self-contained-audit-design.md`

---

## File structure

| File | Responsibility |
|------|----------------|
| `plugins/finalize/skills/finalize/references/code-review.md` | **Create.** Correctness/bug review of the diff. |
| `plugins/finalize/skills/finalize/references/security-review.md` | **Create.** Security audit: OWASP Top 10:2025 floor + API/LLM lenses. |
| `plugins/finalize/skills/finalize/references/verify.md` | **Create.** Behavioral verification procedure. |
| `plugins/finalize/skills/finalize/SKILL.md` | **Modify.** Reframe "Delegate, don't duplicate"; rework Phase 4 review lanes + Phase 6 verify step; add 3 reference-table rows. |
| `README.md` | **Modify.** Orchestrator paragraph, Phase-4 pipeline line, cross-cutting list; drop stale `/simplify` framing. |

Verification convention (no test runner in this repo): a "test" step is a `grep`/content check with an expected result.

---

## Task 1: Create `references/code-review.md`

**Files:**
- Create: `plugins/finalize/skills/finalize/references/code-review.md`

- [ ] **Step 1: Create the file with this exact content**

```markdown
# Code review (correctness)

Independent correctness review of the **diff only**, dispatched to a fresh-context subagent. You are checking that the change does what it should and breaks nothing reachable — not style (Phases 1–2 own that) and not structure (`refactoring.md` owns that). Read surrounding code only to understand the change; never review untouched neighbors.

## What to check

- **Logic & control flow** — off-by-one, inverted conditionals, wrong boolean operators, incorrect loop bounds, missing or duplicated `switch`/match cases.
- **Edge & boundary conditions** — empty / single / maximal inputs, zero and negative numbers, very large values, unicode/multibyte strings, timezone/DST and locale edges, first/last iteration.
- **Error & failure paths** — unhandled exceptions, errors swallowed silently, partial failure leaving inconsistent state, fail-open where it should fail-closed, missing rollback/cleanup on the error branch.
- **Null / undefined / optional** — unchecked dereferences, optional values assumed present, default-value gaps, `0`/`""`/`false` mistaken for "absent".
- **Concurrency & ordering** — race conditions, non-atomic read-modify-write, shared mutable state without synchronisation, async/await ordering bugs, assumptions about callback/event order.
- **Resource management** — leaked file handles, DB connections, sockets, timers, listeners or subscriptions; missing close/dispose on every path including errors.
- **API & contract misuse** — wrong argument order, ignored return values/error codes, misread library semantics, deprecated calls. When unsure an API is current and used as maintainers intend, check the docs (Context7 if available) rather than trusting memory.
- **State & data** — incorrect mutation of shared/aliased objects, stale caches, broken invariants, lost updates.
- **Type-boundary correctness** — unchecked casts, parse/serialize round-trip edges, numeric precision/overflow, implicit coercion.
- **Dead / unreachable code** introduced by the change.

## Output

Consolidate into the Phase-4 punch list. Before anything blocks, run it through `finding-verification.md`: it needs a concrete, reachable trigger (a real input or sequence that reaches the bug), known false-positive classes are downgraded, and any framework/library claim is checked against docs. Label each surviving finding with **severity** and **confidence**, and order by business impact.
```

- [ ] **Step 2: Verify the file exists and is non-empty**

Run: `test -s plugins/finalize/skills/finalize/references/code-review.md && grep -c "Type-boundary correctness" plugins/finalize/skills/finalize/references/code-review.md`
Expected: prints `1`

- [ ] **Step 3: Commit**

```bash
git add plugins/finalize/skills/finalize/references/code-review.md
git commit -m "$(cat <<'EOF'
feat(finalize): add own code-review reference (correctness lane)

Replaces delegation to the /code-review built-in with the skill's own
diff-scoped correctness checklist, run by a fresh-context subagent.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `references/security-review.md`

**Files:**
- Create: `plugins/finalize/skills/finalize/references/security-review.md`

OWASP lists verified against owasp.org on 2026-05-29: web **Top 10:2025**, **API Security Top 10 (2023)**, **Top 10 for LLM Applications (2025)**.

- [ ] **Step 1: Create the file with this exact content**

```markdown
# Security review

Independent security audit of the **diff only**, dispatched to a fresh-context subagent. The floor is the full **OWASP Top 10:2025**, always applied; two conditional lenses add API- and LLM-specific risks when the change has that surface. Read surrounding code to understand trust boundaries, but only flag issues the change introduces or exposes.

## Always — OWASP Top 10:2025

For each, check the concrete patterns and confirm the control is actually present in the changed code.

- **A01 Broken Access Control** — missing/incorrect authorization, IDOR (object references not scoped to the caller), privilege escalation, path-based bypass, and **SSRF** (server fetching attacker-controlled URLs — folded into A01 in 2025). Verify every new endpoint/handler/resource enforces who-can-do-what.
- **A02 Security Misconfiguration** — insecure defaults, debug/verbose errors enabled, permissive CORS, default credentials, unnecessary features/ports, missing security headers, secrets in committed config.
- **A03 Software Supply Chain Failures** — new/bumped dependencies, unpinned or untrusted sources, lockfile integrity, install scripts. **Compose with `dependency-audit.md`** for the full vulnerability/license/provenance check — flag here, audit there.
- **A04 Cryptographic Failures** — weak or aging algorithms (MD5/SHA1/DES/ECB), hardcoded keys/IVs, predictable randomness for security tokens, secrets/PII stored or transmitted in plaintext, missing TLS, home-rolled crypto.
- **A05 Injection** — SQL/NoSQL/OS-command/LDAP/template injection from unparameterised queries or unescaped interpolation, and **XSS** from unescaped output. Verify parameterised queries and context-correct output encoding.
- **A06 Insecure Design** — a security control missing by design rather than by bug: no rate limiting on an abusable flow, missing authorization layer, trust placed in client-supplied data, no threat consideration for a sensitive feature.
- **A07 Authentication Failures** — weak session/token handling (no expiry/rotation, predictable tokens), credentials in URLs/logs, missing brute-force / credential-stuffing protection, broken logout, insecure password storage.
- **A08 Software or Data Integrity Failures** — unsafe deserialization of untrusted data, unsigned/unverified updates or plugins, trusting untrusted CI/build inputs, insecure auto-update.
- **A09 Security Logging and Alerting Failures** — security-relevant events not logged (authn, authz failures, high-value actions) and no alerting; OR the opposite failure — **sensitive data (passwords, tokens, PII) written to logs**.
- **A10 Mishandling of Exceptional Conditions** — error handling that leaks stack traces/internal detail to users, inconsistent exception flow that bypasses a check, or failing *open* (granting access) on an exception.

## Always — general extras

- **CSRF** — state-changing requests without anti-CSRF tokens / SameSite protection.
- **Open redirect** — redirect target taken from unvalidated user input.
- **Insecure file handling** — unrestricted upload type/size, path traversal in filenames, serving user files from an executable path.
- **Sensitive data exposure** — secrets/PII in responses, error bodies, or client-visible state beyond what's needed.

## Conditional — API lens *(apply when the diff adds/changes HTTP API endpoints)*

Grounded in the **OWASP API Security Top 10 (2023)**:

- **API1 Broken Object Level Authorization (BOLA)** — object IDs not scoped to the authenticated caller.
- **API2 Broken Authentication** — weak or missing auth on endpoints.
- **API3 Broken Object Property Level Authorization** — mass assignment / excessive data exposure (accepting or returning fields the caller shouldn't set or see).
- **API4 Unrestricted Resource Consumption** — no rate/size/pagination limits.
- **API5 Broken Function Level Authorization (BFLA)** — privileged operations reachable by under-privileged roles.
- **API6 Unrestricted Access to Sensitive Business Flows** — automatable abuse of a sensitive flow (purchase, signup, etc.).
- **API7 Server Side Request Forgery** — also under A01; double-check API-initiated fetches.
- **API8 Security Misconfiguration**; **API9 Improper Inventory Management** (undocumented/old endpoints exposed); **API10 Unsafe Consumption of APIs** (trusting upstream/third-party responses).

## Conditional — LLM/GenAI lens *(apply when the diff calls an LLM or builds agent behavior)*

Grounded in the **OWASP Top 10 for LLM Applications (2025)**:

- **LLM01 Prompt Injection** — direct and indirect (untrusted content reaching the model as instructions).
- **LLM02 Sensitive Information Disclosure** — secrets/PII leaking via prompts, context, or outputs.
- **LLM05 Improper Output Handling** — model output used unsanitised in a sink (rendered as HTML, executed, run as SQL/shell).
- **LLM06 Excessive Agency** — tools/permissions broader than the task needs; unchecked autonomous actions.
- **LLM07 System Prompt Leakage** — secrets or trust assumptions baked into a leak-able system prompt.
- Also consider where relevant: **LLM03 Supply Chain**, **LLM04 Data and Model Poisoning**, **LLM08 Vector and Embedding Weaknesses**, **LLM09 Misinformation**, **LLM10 Unbounded Consumption**.

## Secret scan

Committed secrets remain the dedicated Phase-4 lane (keys, tokens, credentials, private keys, `.env` values) — a hard stop. Referenced here, not duplicated.

## Output

Consolidate into the Phase-4 punch list. Every finding must survive the `finding-verification.md` trigger test (a concrete, reachable exploit path — not a theoretical category) before it can block; label **severity** and **confidence**; order by business impact.
```

- [ ] **Step 2: Verify all ten 2025 categories plus both lenses are present**

Run: `grep -Ec "A0[1-9]|A10|API1 Broken|LLM01 Prompt" plugins/finalize/skills/finalize/references/security-review.md`
Expected: a number ≥ `12` (ten OWASP rows + API1 + LLM01 lines)

- [ ] **Step 3: Commit**

```bash
git add plugins/finalize/skills/finalize/references/security-review.md
git commit -m "$(cat <<'EOF'
feat(finalize): add own security-review reference (OWASP 2025 + lenses)

Replaces delegation to the /security-review built-in. Covers the full
OWASP Top 10:2025 floor plus conditional API Security Top 10 (2023) and
LLM Top 10 (2025) lenses; composes dependency-audit and finding-verification.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `references/verify.md`

**Files:**
- Create: `plugins/finalize/skills/finalize/references/verify.md`

- [ ] **Step 1: Create the file with this exact content**

```markdown
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
```

- [ ] **Step 2: Verify the file exists with the key sections**

Run: `grep -Ec "Run the app|When you cannot run it" plugins/finalize/skills/finalize/references/verify.md`
Expected: prints `2`

- [ ] **Step 3: Commit**

```bash
git add plugins/finalize/skills/finalize/references/verify.md
git commit -m "$(cat <<'EOF'
feat(finalize): add own verify reference (behavioral verification)

Replaces delegation to the /verify built-in with the skill's own
run-the-app procedure, followed by the main agent in Phase 6.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Rework SKILL.md (principle, Phase 4, Phase 6, reference table)

**Files:**
- Modify: `plugins/finalize/skills/finalize/SKILL.md`

- [ ] **Step 1: Reframe the "Delegate, don't duplicate" operating principle**

Replace this paragraph:

```
- **Delegate, don't duplicate.** The improve phases (1–3: best-practices, simplify, refactor) carry their own guidance, because *making code better* is the value this skill adds and there is no single built-in that does it the way the pipeline needs. The audit/verify phases delegate to independent built-ins (`/code-review`, `/security-review`, `/verify`), because *independently checking* the result is exactly what those tools are for and re-deriving their logic here would rot. (Note `/simplify` is itself `/code-review --fix`, not a distinct simplifier — which is why Phase 2 owns its guidance rather than delegating, and Phase 4's `/code-review` then acts as an independent read-only check that Phases 1–3 did their job.)
```

with:

```
- **Own your checks; get independence from fresh context, not from host commands.** Every phase carries its own guidance — the *improve* phases (1–3) and the *audit/verify* phases alike — so the pipeline depends on no host-agent built-in commands and travels wherever the skill is installed. The audit's independence comes from running the code-review and security-review references in a **fresh-context subagent** (see the `dispatching-parallel-agents` skill) that hasn't seen Phases 1–3; where a host has no subagent mechanism, follow the same reference as an inline adversarial pass. Verify (Phase 6) is a main-agent procedure following `verify.md`, because behavioral observation benefits from holding the change's intent.
```

- [ ] **Step 2: Rework the Phase 4 code-review and security-review bullets**

Replace these two lines:

```
- **Code review:** invoke **`/code-review`** on the diff.
- **Security review:** invoke **`/security-review`** on the pending changes.
```

with:

```
- **Code review:** dispatch a fresh-context subagent (per the `dispatching-parallel-agents` skill) to review the diff following `references/code-review.md`. On a host without subagents, follow that reference as an inline adversarial pass.
- **Security review:** dispatch a fresh-context subagent to audit the diff following `references/security-review.md` (OWASP Top 10:2025 floor + conditional API & LLM lenses). Inline-adversarial fallback as above.
```

- [ ] **Step 3: Rework the Phase 6 behavioral-check step**

Replace this line:

```
3. **Behavioral check:** delegate to **`/verify`** to actually run the app/feature and observe real behavior, not just green tests. Type-checks and tests prove code correctness, not feature correctness.
```

with:

```
3. **Behavioral check:** follow **`references/verify.md`** to actually run the app/feature and observe real behavior, not just green tests. Type-checks and tests prove code correctness, not feature correctness.
```

- [ ] **Step 4: Add three rows to the reference table**

Replace this row:

```
| `references/dependency-audit.md` | Phase 4 | Vulnerability, license & supply-chain audit for changed deps |
```

with (original row plus the two new Phase-4 rows):

```
| `references/code-review.md` | Phase 4 | Correctness/bug review of the diff (logic, edges, error paths, concurrency, resource leaks, API misuse) |
| `references/security-review.md` | Phase 4 | Security audit — OWASP Top 10:2025 floor + conditional API & LLM lenses; composes dependency-audit & finding-verification |
| `references/dependency-audit.md` | Phase 4 | Vulnerability, license & supply-chain audit for changed deps |
```

Then replace this row:

```
| `references/performance-profiling.md` | Phase 6 | Measure-first profiling for hot-path changes |
```

with (new verify row plus the original):

```
| `references/verify.md` | Phase 6 | Behavioral verification — run the app & observe; composes testing, a11y & performance refs |
| `references/performance-profiling.md` | Phase 6 | Measure-first profiling for hot-path changes |
```

- [ ] **Step 5: Verify SKILL.md no longer references the built-in commands and does reference the new files**

Run: `grep -En "/code-review|/security-review|/verify" plugins/finalize/skills/finalize/SKILL.md | grep -v "references/"`
Expected: no output. (The `| grep -v "references/"` drops the new `references/*.md` paths, which legitimately contain those substrings; what remains would be a stray built-in invocation.)

Run: `grep -Ec "references/code-review.md|references/security-review.md|references/verify.md" plugins/finalize/skills/finalize/SKILL.md`
Expected: a number ≥ `5` (two Phase-4 bullets + Phase-6 step + three table rows; some files appear more than once)

- [ ] **Step 6: Commit**

```bash
git add plugins/finalize/skills/finalize/SKILL.md
git commit -m "$(cat <<'EOF'
refactor(finalize): run audit/verify from own refs, not host commands

Reframe the delegate principle, dispatch subagents that follow the new
code-review/security-review references in Phase 4 (inline fallback where
no subagents), point Phase 6 at verify.md, and wire all three into the
reference table. No remaining dependency on /code-review, /security-review
or /verify.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite the orchestrator paragraph**

Replace this paragraph:

```
A post-implementation **finalization pipeline**: you run it once a change is functionally complete, and it brings the change up to shippable standard, then gives a go/no-go verdict. It is an *orchestrator* — where Claude Code already has an independent-check command (`/code-review`, `/security-review`, `/verify`) it delegates to it, and carries its own guidance for the improve work and the remaining gaps (language best-practices, simplification, refactor assessment, spec-conformance, doc updates, the validation gate). (`/simplify` isn't delegated to — it's just `/code-review --fix`, so Phase 2 owns its guidance.)
```

with:

```
A post-implementation **finalization pipeline**: you run it once a change is functionally complete, and it brings the change up to shippable standard, then gives a go/no-go verdict. It is a **self-contained orchestrator** — it carries its own guidance for every phase (language best-practices, simplification, refactor assessment, code review, security review, behavioral verification, spec-conformance, doc updates, the validation gate) and depends on no host-agent built-in commands. The independent audit checks (code review, security review) run in fresh-context subagents that follow the skill's own references; behavioral verification runs in the main agent.
```

- [ ] **Step 2: Update the Phase-4 line in the pipeline diagram**

Replace this line:

```
4  Audit               /code-review + /security-review + secret scan + dependency audit + consistency + spec-conformance + structural regression
```

with:

```
4  Audit               code review + security review (own refs, subagent-run) + secret scan + dependency audit + consistency + spec-conformance + structural regression
```

- [ ] **Step 3: Add the new references to the cross-cutting coverage sentence**

Replace this sentence:

```
Cross-cutting: simplify (local clarity), refactoring (incl. structural-regression), codebase-fit, spec-conformance, finding-verification, test quality, docs, dependency/license audit, performance profiling, and the validation gate.
```

with:

```
Cross-cutting: simplify (local clarity), refactoring (incl. structural-regression), code review (correctness), security review (OWASP Top 10:2025 + conditional API & LLM lenses), behavioral verification, codebase-fit, spec-conformance, finding-verification, test quality, docs, dependency/license audit, performance profiling, and the validation gate.
```

- [ ] **Step 4: Verify README no longer references the built-in commands**

Run: `grep -En "/code-review|/security-review|/verify|/simplify" README.md`
Expected: no output (exit 1)

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: describe finalize as self-contained (no host commands)

Update the README orchestrator description, Phase-4 pipeline line, and
cross-cutting coverage to reflect the skill's own code-review/security-
review/verify references; drop the stale /simplify framing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Final acceptance check

**Files:** none (verification only)

- [ ] **Step 1: Confirm no built-in command references remain anywhere in the shipped skill or README**

Run: `grep -REn "/code-review|/security-review|/verify" plugins/ README.md | grep -v "references/"`
Expected: no output. (`| grep -v "references/"` drops the new reference file paths; `docs/` specs/plans are already outside the searched paths. Any remaining line is a real built-in reference to remove.)

- [ ] **Step 2: Confirm the three new references exist and are wired into the reference table**

Run: `ls plugins/finalize/skills/finalize/references/{code-review,security-review,verify}.md && grep -c "references/verify.md" plugins/finalize/skills/finalize/SKILL.md`
Expected: the three paths listed, then a count ≥ `1`

- [ ] **Step 3: Confirm security-review covers the OWASP floor + both lenses**

Run: `grep -E "OWASP Top 10:2025|API Security Top 10|Top 10 for LLM Applications" plugins/finalize/skills/finalize/references/security-review.md`
Expected: all three header lines printed

- [ ] **Step 4: No commit** unless a check failed and required a fix.

---

## Notes for the executor

- This repo has **no automated test suite**; the `grep` checks above are the verification.
- Keep edits surgical — do not reflow or reword untouched parts of SKILL.md/README.md.
- Commit messages follow the repo's conventional-commit style (`feat(finalize):`, `refactor(finalize):`, `docs:`) with the `Co-Authored-By` footer.
- The OWASP category lists were verified against owasp.org on 2026-05-29; if re-verifying, the web list is **Top 10:2025**, API is the **2023** edition, LLM is the **2025** edition.
