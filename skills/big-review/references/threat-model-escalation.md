# Threat-model escalation

Use this specialty reference when a red-lane change crosses or reshapes a trust
boundary, or when a high-impact security finding needs compact abuse-path
framing before Phase 4 can decide whether deeper threat-model follow-up is
required.

## Scope

- Model only the changed high-risk surface, not the full system.
- Record enough structure to explain why the finding matters or why the
  boundary change or abuse path needs follow-up.
- Feed compact outputs into the shared `Finding Set` and the Phase 7
  `Decision Packet`; do not redesign the architecture inside `big-review`.

## Why-not note

On any trust-boundary change — auth/session paths, tenant separation, untrusted-input handling, money or authorization caching — either run this escalation or record a why-not note naming the boundary and why escalation adds nothing.

## Compact threat model

Capture only the minimum set needed to justify escalation:

- **Trust boundary** — what newly crosses from untrusted to trusted, or what
  existing boundary widened, moved, or lost a control.
- **Assets** — data, credentials, control plane access, deploy authority, or
  business operation put at risk by this changed surface.
- **Attacker goals** — the concrete thing an attacker wants here: read,
  modify, execute, escalate, persist, or disrupt.
- **Abuse paths** — the 1-3 most plausible paths from entry point to impact on
  this changed surface.

## Escalation outputs

- **Finding Set** — attach a compact escalation note to the relevant finding:
  changed boundary, at-risk asset, attacker goal, abuse path, and the
  recommended action (`Fix`, `Plan`, `Investigate`, or `Decide`).
- **Decision Packet** — record whether the threat is contained by the diff,
  remains a blocking residual risk, or needs explicit follow-up requirements.

## Routing onward

If the escalated threat needs explicit acceptance criteria or a human
trade-off, load `security-requirements.md` before finalizing the verdict.

## Mutability

- Mutability mode: `read-only`
