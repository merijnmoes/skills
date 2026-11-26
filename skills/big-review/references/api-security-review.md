# API security review

Phase 4 support for `big-review`, conditional. Apply when the diff adds or changes HTTP APIs, RPC endpoints, webhooks, or machine-consumable request/response surfaces.

Grounded in the **OWASP API Security Top 10 (2023)** and meant to be loaded from `security-review.md` / `security-cheat-sheets.md`.

## What to check

- **Object authorization (BOLA)** — every object lookup is scoped to the authenticated caller or tenant. Check route params, query params, body IDs, and nested resource IDs.
- **Authentication** — endpoints that should require auth actually do; tokens/sessions are validated server-side; no privileged route is accidentally public.
- **Property-level authorization** — request bodies cannot mass-assign protected fields; responses do not leak internal/admin-only properties.
- **Resource consumption** — pagination, size limits, timeouts, and rate limits exist on expensive or abusable paths.
- **Function-level authorization (BFLA)** — admin/support/internal actions cannot be reached by ordinary roles through hidden endpoints or alternate methods.
- **Sensitive business flows** — signup, purchase, invite, export, password reset, and other abuse-prone flows have anti-automation or replay controls.
- **SSRF and outbound fetches** — any endpoint-triggered fetch validates destination, scheme, redirects, and internal-address access.
- **Unsafe upstream consumption** — third-party API responses are validated and bounded; upstream failures do not silently corrupt local state.
- **Inventory drift** — new/legacy endpoints are documented and routed intentionally; dead or hidden handlers are not accidentally exposed.

## Concrete prompts

- What object identifier does this path accept, and where is ownership checked?
- Can the client set fields the server should own?
- What happens if the request body is much larger, much smaller, or repeated rapidly?
- If this runs twice, does it duplicate a side effect?
- What does the endpoint return on authorization failure, validation failure, and upstream failure?

## Common blockers

- Caller can access another user's record by changing an ID.
- Request body can set role, owner, price, state, or other server-owned fields.
- Unbounded list/export/search endpoint with no size or time controls.
- Webhook or callback path that trusts caller identity without signature/secret validation.
- External URL fetch reachable from the request without allowlisting or internal-network protections.

## Output

Fold findings into the Phase-4 punch list with severity, confidence, and a concrete trigger path.
