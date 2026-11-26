# Docs quality router

Phase 5 support for `big-review`, conditional. Use this router when the diff
changed behavior that may need documentation but it is not yet obvious which
doc type owns the update.

Default to the smallest truthful doc change. Escalate only when the changed
surface actually broadens the audience, contract, or boundary that must be
explained.

## Choose the doc type

- **README** — setup, install, local run commands, environment prerequisites,
  quick-start usage, or common user/developer workflow changed.
- **API docs** — a public endpoint, event, SDK surface, CLI contract, config
  key, schema, request/response shape, or compatibility expectation changed.
- **Runbook** — operators now need different deploy, rollback, incident,
  recovery, seeding, rotation, or manual troubleshooting instructions.
- **Component doc** — one subsystem's responsibilities, extension points,
  invariants, lifecycle, or consumer expectations changed in a way that is too
  specific for a README but too local for a system architecture doc.
- **Architecture doc** — system boundaries, cross-component topology, trust
  boundaries, integration shape, or major data/control flow changed across more
  than one component.
- **ADR** — the diff establishes or reverses a durable technical decision,
  tradeoff, or policy that future contributors will otherwise rediscover or
  unknowingly fight.

## Escalation rules

- Start with one primary doc target. Add a second target only when two
  different audiences were genuinely affected.
- Keep scope minimal: update the smallest existing document that can tell the
  truth before creating a new doc.
- If the diff changes public APIs, system boundaries, or responsibilities, pair
  this router with
  `architecture-docs-review.md` to decide whether README/API docs are enough or
  whether ADR / architecture / component docs are required.
- If the App Store lane is already relevant, this router may still choose
  reviewer notes or submission instructions as the doc target for that surface.
  In mixed diffs, it may also choose a separate non-reviewer doc target when
  public APIs, boundaries, or responsibilities changed.

## Minimal-scope guardrails

- Do not create an ADR when an API reference or component doc update already
  explains the change.
- Do not create an architecture doc for a local implementation detail inside an
  existing boundary.
- Do not expand a README with operator-only or reviewer-only detail when a
  runbook or reviewer note is the right home.

## Output

Emit the primary doc target, any justified secondary target, and the reason the
change does or does not escalate beyond routine README/API/runbook updates.
