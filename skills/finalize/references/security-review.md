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
