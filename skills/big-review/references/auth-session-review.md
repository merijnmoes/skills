# Auth and session review

Phase 4 support for `big-review`, conditional. Apply when the diff touches authentication, sessions, cookies, tokens, logout, password reset, MFA, account recovery, or authorization boundaries.

## What to check

- **Authentication boundaries** — protected routes/actions actually require authentication on the server, not just in the client.
- **Session lifecycle** — session IDs / tokens are rotated at login, privilege elevation, and reset flows when appropriate; logout invalidates what it claims to invalidate.
- **Cookie safety** — auth cookies use appropriate `HttpOnly`, `Secure`, `SameSite`, domain, and path settings for the app’s deployment model.
- **Token safety** — token expiry, refresh, revocation, audience, and issuer checks are present; tokens are not logged or exposed in URLs.
- **Authorization** — role/permission checks happen at the point of use, not only at navigation or UI level.
- **Password and recovery flows** — reset tokens are single-use, time-bounded, and not guessable; account enumeration is minimized.
- **MFA / step-up auth** — high-risk actions require the intended assurance level.
- **Brute-force / stuffing resistance** — login/reset/invite flows have throttling, lockout, delay, captcha, or other abuse controls where appropriate.
- **CSRF** — state-changing cookie-authenticated flows have anti-CSRF controls or an equivalent same-site strategy that actually fits the deployment.

## Concrete prompts

- What changes in auth state after login, logout, password reset, and role change?
- Can an attacker replay an old token or continue using a session after logout/reset?
- Which checks are UI-only, and which are definitely server-enforced?
- What does the system reveal on invalid username/email/password/reset-token paths?

## Common blockers

- Privileged action guarded only in frontend code.
- Session or refresh token remains valid after logout or password reset.
- Auth token appears in logs, URLs, local storage without justification, or client-visible error payloads.
- Reset/invite token is reusable, long-lived, or guessable.

## Output

Fold findings into the Phase-4 punch list with the exact flow and state transition that makes the issue reachable.
