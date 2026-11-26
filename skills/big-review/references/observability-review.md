# Observability review

Phase 4 and Phase 6 support for `big-review`, conditional. Apply when the diff changes logging, tracing, audit events, alerts, error reporting, or sensitive state transitions that must be diagnosable.

## What to check

- **Security-relevant events are visible** — auth failures, permission denials, high-value writes, admin actions, payment-like actions, or data exports leave enough trace to investigate.
- **Sensitive data is not leaked** — logs, traces, metrics tags, and error reports do not carry secrets, tokens, raw credentials, or unnecessary PII.
- **Errors are diagnosable** — failures emit enough structured context to debug without exposing internals to end users.
- **Auditability matches the risk** — irreversible or high-impact actions have traceable actors, targets, and timestamps where the domain expects that.
- **Signal quality** — the diff does not replace actionable errors with silent failures or vague generic logs.

## Concrete prompts

- If this feature fails in production, what signal would an operator actually have?
- If this action is abused, what event trail remains?
- What data lands in logs or tracing metadata on the happy path and the failure path?

## Common blockers

- Sensitive tokens, auth headers, passwords, raw reset links, or full PII logged.
- High-value action with no actor/target traceability where the domain clearly needs it.
- Error swallowed or downgraded so operators cannot tell the action failed.

## Mutability

- Mutability mode: `report-first`

## Output

Fold observability findings into the Phase-4 punch list. Use verification notes
only when you can observe the runtime signals directly in Phase 6.
