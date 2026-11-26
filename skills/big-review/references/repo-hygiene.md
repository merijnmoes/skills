# Repo hygiene and supply-chain posture

Phase 4 support for `big-review`, conditional. Apply when the diff changes dependency manifests, lockfiles, release config, action references, security policy files, or other repo-level trust surfaces.

This is a review lane for posture, not a hard requirement that every repository already has perfect governance.

## What to check

- **Dependencies are pinned and reproducible** — lockfiles are updated with manifest changes; mutable references are intentional.
- **Third-party automation references are stable** — actions, containers, scripts, and release inputs are pinned or otherwise trusted per project policy.
- **Security policy and ownership files** — changes to `SECURITY.md`, CODEOWNERS, release config, or branch/ruleset-related files do not weaken review or disclosure posture silently.
- **Release and provenance assumptions** — tag, package, and artifact publishing paths are intentional and cannot be redirected by untrusted input.
- **Secrets and credentials posture** — repo-level examples and policy files do not encourage committing real secrets or unsafe defaults.
- **Trust boundary docs** — if the diff changes repo governance or operator expectations, documentation is updated accordingly.

## Concrete prompts

- Does this change make builds/releases less reproducible or less reviewable?
- Does it reduce who must review sensitive changes?
- Does it introduce new mutable third-party trust without explanation?
- If an attacker controls a PR or branch name, can repo automation publish or modify trusted state?

## Common blockers

- Manifest changes without lockfile update.
- Sensitive release/deploy path now depends on mutable refs or weaker review controls.
- Security/ownership policy weakened with no explicit intent.

## Mutability

- Mutability mode: `report-first`

## Output

Fold findings into the Phase-4 punch list. Use medium confidence for posture concerns unless a concrete exploit or bypass path is clear.
