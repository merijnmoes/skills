# Verification ledger

Used in `moes` Phase 6. Every verification action must produce an explicit
record of what was exercised and what remained unproven.

## Record fields

- activity name
- command, flow, or probe that was run
- observed result
- risk or invariant exercised
- coverage type: `direct` | `indirect`
- status: `pass` | `fail` | `flaky` | `infra` | `not-run`
- attempt: `1` for initial run, `2`/`3` for retries, plus `prior` id when retrying
- notes on environment gaps or unexercised risks

## Status definitions

- `fail` = code defect with reproducible trigger quoted (command + input + wrong output). Only state that can carry a blocking finding.
- `flaky` = same code + same command gives both pass and fail with no code change. Never counts as `pass`. Quote both runs.
- `infra` = tool/env failure, not code (OOM, missing service, no display, timeout, rate limit). Quote the tool error. Never counts as `pass`. A shell timeout that aborted a run with visible progress gets one retry with a ~2x timeout on the same code state (log as `infra`, `attempt: 2` with `prior` id, raised timeout, and a quote of the progress); a second timeout without completion becomes a sharding proposal plus an `infra` gap.
- `pass-after-retry` is not a status — record as `pass` with `attempt: 2`/`3` plus a note on what was fixed. A `flaky` that eventually passes stays `flaky` with a note, not `pass`.
- Discovery runs (`--list`, `--collect-only`, `--dry-run`, `-l`, and equivalents) are `not-run` with a `discovery-only` note — never `pass`, `fail`, or proof of coverage. Static gates that by design do not execute tests (e.g. `tsc --noEmit`, linters) are the exception and keep their own lane status.

## Minimum coverage

The ledger must explicitly record:

- static gates
- full test suite, with the actual pass/fail result observed from a real execution (not discovery, not delegated-to-user) on the final code state
- E2E/browser suite result when the diff touches the covered journey and the capability was configured + reachable — or an explicit `not-run` gap with why-not
- targeted regressions or probes
- behavioral verification
- accessibility or performance checks when relevant
- every top risk from the risk map as either exercised or unexercised
- which audit lanes actually completed, which stayed pending, and which results arrived late (with how the late result was consolidated and re-verified)
- which findings were fixed and which tests were rerun after the last code change (Phase 6 is rerun fully on the final state, never assumed from a pre-fix run)
- which risks were only reasoned about and not runtime-tested, kept distinct from directly verified ones
- the audit trail: how many verify shards ran, how many reverse-audit rounds ran, and whether the audit stopped converged (2 consecutive dry rounds) or capped at the round limit
- surprise-pass target and outcome when the surprise rule fired

## Rule

If a risk was not exercised, write that plainly. Absence of evidence must never
read like positive evidence. `flaky` or `infra` is not evidence — only `pass` on
the same code state counts toward the gate.
