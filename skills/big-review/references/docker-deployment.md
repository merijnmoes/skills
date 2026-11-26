# Docker and deployment review

Phase 4, Phase 6, and Phase 7 support for `big-review`, conditional. Apply when
the diff changes Dockerfiles, Compose, image build logic, container runtime
behavior, health checks, deployment strategy, or release sequencing.

This lane owns operability and rollout correctness. Keep secret exposure,
privilege abuse, and exploitability findings under `security-review.md`.

## What to check

- **Runtime privilege** — production containers run as non-root where practical,
  with any exception justified by the workload.
- **Build discipline** — multi-stage builds are used when they materially reduce
  runtime surface area, and base images are pinned explicitly enough to make the
  dependency choice reviewable.
- **Exposure minimization** — only necessary ports, binds, mounts, and network
  reachability are opened; dev-only exposure does not leak into production
  paths.
- **Health and readiness** — rollout-sensitive services expose a meaningful
  health/readiness signal so deploy tooling can distinguish booting, healthy,
  and broken states.
- **Environment separation** — development conveniences, debug tooling, mock
  services, and permissive defaults stay out of production images and runtime
  config.
- **Rollout assumptions** — the docs or implementation make clear whether the
  intended strategy is rolling, blue-green, or canary, and the service behavior
  still makes sense under that strategy.
- **Two-version overlap** — the change has a rollback story or compatibility
  plan when old and new versions can overlap during deploy.

## Common blockers

- Production image runs as root with no workload-specific justification.
- Broad port exposure, unnecessary public bind, or overly open service
  networking is introduced.
- A rollout-sensitive service change has no health/readiness signal to gate the
  rollout.
- Deployment sequencing assumes old and new versions never overlap even though
  the real rollout mode allows overlap.

## Output

Record the container or deployment surface reviewed, the assumed rollout mode,
any evidence for health/readiness behavior, and whether overlap/rollback
assumptions were exercised or remain an explicit gap.
