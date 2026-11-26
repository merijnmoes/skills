# Infrastructure security review

Use this specialty reference when the diff changes Docker, Kubernetes,
Terraform, cloud policy/configuration, deploy manifests, or infra-sensitive
runtime settings that deserve focused review.

## What to check

- **Container runtime posture** — privileged mode, root user, added
  capabilities, host namespace or socket exposure, writable root filesystem,
  and whether the image/runtime settings make breakout or tampering easier.
- **Image provenance and mutability** — trusted base images, pinned versions or
  digests where the project expects them, and remote build/download steps that
  weaken provenance.
- **Public exposure and encryption defaults** — load balancers, ingress,
  services, ports, security groups, and whether encryption in transit / at
  rest is enabled by default rather than assumed elsewhere.
- **Secret injection and identity** — plaintext secrets in manifests or vars,
  unsafe secret mounting, service-account / IAM / workload-identity scope, and
  least-privilege defaults for infra-managed identities.
- **Logging and audit defaults** — whether the changed resource keeps the audit
  trail needed for auth changes, admin actions, access logs, or policy events.

## Scope discipline

- Keep the review tied to the changed resource, manifest, module, or runtime
  setting; do not expand into a full platform or compliance audit.
- Prefer concrete exposure paths over category-only findings: name the
  resource, trust boundary, and the missing control.

## Mutability

- Mutability mode: `small-fix-allowed`
- `small-fix-allowed` only for clearly safe hardening changes such as pinning
  container image digests, narrowing service-account scope, tightening
  obviously overbroad network exposure, or secret-reference hygiene.

## Output

Emit infra findings into the shared `Finding Set` under security-lane
ownership, with the changed resource, exposure path, missing control, and
whether the next action is `Fix`, `Investigate`, `Plan`, or `Decide`.
