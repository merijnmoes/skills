# Security requirements

Use this specialty reference when an escalated security finding needs explicit
requirement framing before Phase 7 can carry it cleanly into the verdict.

## Purpose

Convert the changed-surface threat into requirements that are specific enough
to test, defer, or hand back for a decision without expanding `big-review` into
an architecture rewrite.

## Requirement types

- **Functional requirement** — a control the system must perform, such as
  authorization, validation, approval gating, or verified provenance checks.
- **Non-functional requirement** — a security property the surface must retain,
  such as encryption defaults, audit logging, rate limiting, or recovery-safe
  secret handling.
- **Constraint requirement** — a design or policy limit, such as no public
  exposure, no mutable third-party action references, or least-privilege
  identity only.

## Conversion checklist

For each escalated threat:

- Restate the changed surface and the violated or missing security invariant.
- Choose the smallest requirement type that would prevent or contain the abuse
  path.
- Write an acceptance criterion that is observable in code, config, or runtime
  behavior.
- Mark the finding's next action as `Fix`, `Plan`, `Investigate`, or `Decide`.

## Action mapping

- `Fix` — the requirement is local to the changed diff and has a safe,
  well-bounded remediation now.
- `Plan` — the requirement is real but needs broader architecture, rollout, or
  policy work than `big-review` should perform.
- `Investigate` — the requirement is plausible but evidence is incomplete;
  state the first concrete verification step.
- `Decide` — the requirement depends on product, compliance, release, or risk
  tolerance judgment that the reviewer should not invent.

## Output

Emit a compact requirement note into the shared `Finding Set` and reference it
from the `Decision Packet`:

- changed surface
- requirement type
- acceptance criterion
- unmet or satisfied status
- recommended action: `Fix` | `Plan` | `Investigate` | `Decide`

## Mutability

- Mutability mode: `read-only`
