# Agent security review

Phase 4 support for `big-review`, conditional. Apply when the diff calls an LLM, builds agent behavior, stores embeddings, exposes tools, or uses model output in downstream actions.

Grounded in the **OWASP Top 10 for LLM Applications (2025)** and **AISVS-style** verification thinking: verify the control, not just the intention.

## What to check

- **Prompt injection** — untrusted text from users, files, web pages, tickets, docs, or retrieval enters the model as instructions or system-like authority.
- **Sensitive information disclosure** — prompts/context include secrets, credentials, internal-only data, or excessive PII without a clear need.
- **Output handling** — model output is rendered, executed, stored, queried, or sent to tools without validation or narrowing.
- **Excessive agency** — the model can take high-impact actions without scoped tools, explicit confirmation, or server-side policy checks.
- **System prompt leakage** — secrets, hidden trust assumptions, or operational details are embedded in prompts that may be exposed.
- **Supply chain / retrieval trust** — tools, retrieval corpora, prompt templates, or embedding sources are untrusted or mutable in unsafe ways.
- **Unbounded consumption** — attackers can force runaway token spend, large context growth, repeated tool loops, or excessive retries.
- **Memory / persistence safety** — long-term memory, traces, or conversation logs store more sensitive data than intended.

## Concrete prompts

- What untrusted content can reach the model, and how is instruction/data separation enforced?
- Which tools can the model invoke, and what server-side checks still gate them?
- If the model hallucinates or produces hostile output, what prevents execution or unsafe persistence?
- What data is included in prompts by default, and what is the minimum needed?
- Can a user trigger high cost, repeated tool use, or large retrieval expansions?

## Common blockers

- Model output is fed directly into shell, SQL, HTML, or privileged tool calls.
- Tool access is broader than the user’s own permissions.
- Retrieved/untrusted content is injected into high-authority prompt sections.
- Secrets or internal credentials are included in prompt context or long-lived memory.

## Output

Fold findings into the Phase-4 punch list with a concrete attack path, not just a category label.
