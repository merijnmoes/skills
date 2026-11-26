# Workflow security

Phase 4 support for `big-review`, conditional. Apply when the diff changes `.github/workflows/**`, CI/CD config, release automation, deploy scripts, or secrets handling in automation.

## What to check

- **Action pinning** — third-party GitHub Actions are pinned to immutable SHAs where the project expects that level of supply-chain safety.
- **Token permissions** — workflow/job permissions are least-privilege; broad write scopes are justified.
- **Untrusted input in shell** — PR titles, branch names, commit messages, matrix values, event payloads, or issue text are not interpolated unsafely into shell commands.
- **Secrets handling** — secrets are only exposed to trusted events/jobs and are not echoed, uploaded, or passed to forks unintentionally.
- **Trusted event model** — `pull_request_target`, manual dispatch, release, and deployment triggers are used intentionally with clear trust assumptions.
- **Artifact safety** — downloaded artifacts, caches, and build outputs are treated as untrusted unless provenance is established.
- **Release integrity** — publishing, tagging, signing, and changelog/release-note generation cannot be spoofed by untrusted input.

## Concrete prompts

- Which workflow events can run this job, and what trust level does each event carry?
- What secrets or write tokens are available to this job, and does it really need them?
- Is any event field inserted into a shell command or script without safe quoting and validation?
- Are external actions pinned, and are internal scripts sourced from the reviewed repo state?

## Common blockers

- `pull_request_target` job checks out and executes attacker-controlled PR code with secrets or write token access.
- Workflow uses broad `permissions: write-all` or equivalent without a strong reason.
- External action referenced by mutable tag when repo policy expects immutable pinning.
- PR-controlled text interpolated into `run:` shell steps unsafely.

## Output

Fold findings into the Phase-4 punch list with the exact workflow event, permission set, and execution path involved.
