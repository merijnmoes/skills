# Findings lifecycle

Used in `moes` Phases 4, 7, and 8. This is the single source of truth
for how candidate findings are emitted, challenged, classified, carried into
the verdict, and projected into final reporting.

The goal is to keep the punch list small, true, and decision-ready. A finding
should not block just because it sounds plausible; it must survive challenge,
carry the right next action, and arrive at the verdict with enough structure
that the user does not have to re-triage it by hand.

## Quality policy

No finding without a concrete failure mode. Every candidate names: the trigger, the wrong outcome (or concrete cost for quality findings), and the violated invariant or spec point. Label-only claims ("violates SOLID", "not clean", "could be faster") are dropped at the source. Version-gated toolchain claims ("use X", "deprecated in Y") require a `docs-checked` cite or cap confidence at Medium — never assert current best practice from memory. This policy is what lets the lane set grow without the punch list rotting.

## Required fields per finding

Every lane that emits a finding into the shared `Finding Set` should provide:

- title
- lane/source
- file or surface
- origin: `new` | `surfaced` | `pre-existing` (see below — blame from diff ranges, not guessing)
- severity
- confidence
- reachability
- evidence type
- concrete trigger
- failure scenario: the concrete input, state, or timing that triggers the
  finding and the wrong outcome that results (for quality findings, the
  concrete cost instead). A candidate that cannot name its failure scenario is
  dropped at the source.
- violated invariant or spec point
- current status
- recommended action: `Fix` | `Investigate` | `Plan` | `Decide`
- learning note, when the finding teaches a reusable lesson
- related `Design Quality Notes` item, when the finding came from the
  design-quality review

## Lane contract

Every audit lane should emit candidate findings using the required fields
above. Common participating lanes include:

- correctness review
- security review
- focused bug hunt
- spec conformance
- project-fit / consistency
- structural regression
- dependency / static-intelligence / migration-sensitive conditional lanes

Lane-local scratch formats are fine for intermediate reasoning, but the final
emitted result from each lane must still be normalized into the shared
`Finding Set`.

Use the `risk lane` assigned in the `Evidence Pack` when deciding whether
challenger coverage or extra verification is needed. Refer to
`risk-mapping.md` for the deeper risk map behind that lane.

## Design Quality Notes

`Design Quality Notes` are the companion artifact for design strengths and
design risks. They are not automatically findings. A strength can become a
report-facing "what went right" item; a risk becomes a finding only when it
creates a concrete future bug, maintenance hazard, or delivery risk for the
current diff.

When a design-quality risk becomes a finding, preserve the mechanism in the
finding: what knowledge moved, which interface became deeper or shallower, what
coupling changed, or how change amplification, cognitive load, locality, or
unknown unknowns changed. Label-only claims such as "violates SOLID" or "not
clean architecture" are not sufficient.

## Lifecycle

1. Audit lanes emit `candidate` findings into the shared `Finding Set`.
2. Candidate findings are challenged against concrete trigger evidence before
   they are allowed to block.
3. Surviving findings are given severity, confidence, reachability, action,
   and status.
4. Localized `Fix` findings may be fixed inside `moes`; anything else is
   reported forward.
5. Phase 7 carries the surviving findings into the `Decision Packet`.
6. Phase 8 projects those findings into user-facing report statuses.

## Trigger test for blocking findings

Before a finding is marked **blocking**, state a concrete, reachable trigger: a
specific input or scenario that produces the wrong behavior, and the path by
which untrusted or real data reaches it.

- **Concrete trigger exists and is reachable**: it can block. Record the
  trigger so the user can reproduce it.
- **No trigger you can state**: it is not blocking. Demote it to a
  non-blocking observation or drop it.
- **Trigger requires impossible or contradictory preconditions**: drop it.
- **Trigger is reachable only under unusual low-likelihood conditions**: keep
  it if it is real, but rate severity accordingly.

This applies across lanes. A missing requirement needs the violated spec line.
A race condition needs the interleaving. A structural regression needs the
concrete maintenance hazard it creates, not an aesthetic objection.

The failure scenario is the trigger plus the wrong outcome (or concrete cost for quality findings); it is what satisfies this trigger test. Lanes drop scenario-less candidates at the source; verifiers downgrade uncertain survivors but never reject one as "too speculative".
Architecture findings may block through the mechanism gate instead of a reachable trigger: the triple of harmed parties named, blast radius counted, and cheaper alternative stated replaces the trigger requirement, while `failureScenario` is still carried as the concrete cost.
Concurrency hazards use the same gate with the race-mechanism triple defined in `bug-hunting.md`.

## Corroborated findings

A finding rated HIGH (or higher) by a second independent audit — another lane, the challenger, or a late-arriving worker — may not be written off as residual risk or reasoned away. To close it you need all four: a concrete trigger, a reproducible example, an explicit `Fix` / `Investigate` / `Plan` / `Decide` decision, and fresh verification after any fix. Until then it stays verdict-affecting and is carried into the gate as blocking or contested. Late-arriving results re-enter here as new candidates: consolidate, verify, then re-decide — never patch the verdict by narration.

## Origin: new / surfaced / pre-existing

The diff is the unit of work. Blame every finding from diff ranges (`git diff <base>...HEAD` + `git blame`), not from memory:

- **`new`** — defect in added/modified lines. Normal severity. Can block when the trigger test passes.
- **`surfaced`** — defect in untouched code that *this diff* newly exposes or activates (new caller hits a buggy path, new input shape reaches an old parser, new concurrency reaches an unsafe helper). Auto-downgrade one severity tier, group in a separate `Surfaced` report section. Blocks only on red-lane diffs with a reachable trigger through this diff; otherwise non-blocking. Always state the activation path: which changed line reaches the old defect.
- **`pre-existing`** — untouched and unactivated by this diff. Never blocks. Report at most as a one-line deferred aside, or omit. Do not punish the author for old sins — file it as follow-up (`Plan`) or drop it.

If blame is ambiguous, mark `surfaced` and state why, rather than inflating to `new`.

## Known false-positive classes

Downgrade these from blocking unless you have specific evidence the protection
is absent or bypassed here:

- framework or ORM already provides the cited protection
- auth is enforced elsewhere in the request path
- the runtime or type system already rules the issue out
- trusted input is being treated as if it were attacker-controlled
- the issue is informational rather than a demonstrated runtime defect
- the report applies only to tests, fixtures, or public test material

This list downgrades; it never upgrades. A finding that escapes every
exclusion still has to pass the trigger test.

Security findings are exempt from memory-based downgrades: invoking "framework or ORM already provides the protection" or "auth is enforced elsewhere" requires quoting the guard — in-diff lines, or an immediately adjacent file:line verified by reading it.
Without the quote the finding keeps a verdict-affecting status: `blocking` if its trigger holds, otherwise `contested`, or `Investigate` with the concrete check stated.

## Verify framework and library claims

If the existence or dismissal of a finding depends on library or framework
behavior, verify that behavior against current docs rather than memory. If a
documentation MCP such as Context7 is available, query the specific behavior;
otherwise web-search official docs + release notes + advisories. Freshness
never creates a blocker by itself — it only upgrades confidence or prevents
false "use X" advice; the trigger test above remains the gate.

When a finding's violated invariant is "maintainer-recommended usage", carry a
`docs-checked: <library@version, source URL, date>` field in its evidence (or
`docs-checked: unverified, confidence capped at Medium` when offline or no tool
is available). Keep queries generic and never put secrets or tokens in them.

## Action types

After verification, assign one next action:

| Action | Use when | Effect on `moes` |
|--------|----------|------------------------|
| **Fix** | High-confidence, localized defect with a clear safe fix inside the finalized diff | Fix it now, then re-run the relevant verification. |
| **Investigate** | Plausible issue but missing evidence, unclear cause, or environment-dependent behavior | Surface as non-blocking unless the unknown itself creates unacceptable risk. State the first concrete check. |
| **Plan** | Systemic architecture, migration, cross-module, or policy work that exceeds moes scope | Do not refactor broadly in `moes`; report as follow-up or `NEEDS REVISION` if it blocks the current change. Multi-part follow-ups become tracer-bullet slices with blocking edges (fog-test: ticket only what is sharply statable now; refer by name, not bare ids). |
| **Decide** | Product, domain, security, release, or policy trade-off needing human judgment | Surface the decision point as `needs user decision` with the concrete question plus your recommended answer. Do not invent policy. |

Work open `Decide` points as frontier rounds: ask the whole frontier in one
round (numbered questions with a recommended answer each), look up facts
yourself instead of asking the user for them, then recompute the frontier until
empty. Interrupt the run inline only when the verdict genuinely cannot proceed
without the answer; otherwise collect into the final report. When unsure whether
a `Decide` point blocks, show it as blocking-with-a-question-mark rather than
dropping it — doubtful cases surface per the trigger-test discipline, downgraded
rather than deleted.

Decision flow:

1. Is the issue a verified localized defect in changed code? If yes, `Fix`.
2. Does it require broad architecture or policy change beyond the diff? If
   yes, `Plan`.
3. Does it depend on product intent, domain policy, compliance posture,
   rollout tolerance, or team preference? If yes, `Decide`.
4. Is the diagnosis plausible but not proven? If yes, `Investigate`.

## Status values

- `candidate`: found by a lane, not yet challenged
- `blocking`: survives trigger-test verification and should affect the verdict
- `non-blocking`: real but not verdict-changing
- `deferred`: real follow-up, intentionally not solved inside `moes`
- `contested`: important disagreement or uncertainty remains after challenge
- `fixed`: resolved during the moes run
- `dropped`: failed verification or duplicate of a stronger finding

## Findings as data

The consolidated `Finding Set` is persisted as canonical JSON under the
repo-local `.forge/` state dir. Each finding carries a stable `id`, a
`shortSummary` capped at 60 characters, its `failureScenario`, and one
`locations` entry per occurrence so N-file patterns stay countable. Phases 6,
7, and 8 read that artifact instead of re-typing the list.

Every finding fixed inside `moes` is accounted for in an outcomes ledger:
each id gets exactly one of `fixed`, `skipped` (with reason), or
`no_change_needed`. A ledger that does not cover every finding id is
incomplete — a fixer that silently shortens the list has failed verification.

Suppression lifecycle (repo-local `.forge/` state, never committed): a finding marked `deferred` or `wontfix` carries `code_hash` (±3 lines around each location) + reason + date. Re-run reopens it when the hash drifts (code changed) or after 30 days stale; otherwise it stays suppressed. Snoozed findings carry `snoozed_until`. Suppression never hides a `new` blocker — it only quiets acknowledged non-blockers across runs.

Ledger outcomes map onto lifecycle statuses: `fixed` stays `fixed`; `skipped` (with reason) maps to `deferred`; `no_change_needed` (with reason) maps to `dropped`.

Dropped Finding Set members carry a dismissedLedger entry: title, reason, prior status, and priority rank. Only members dropped after challenge or verification qualify; scenario-less candidates dropped at the source and fixer `no_change_needed` outcomes are excluded unless explicitly notable.

## Label every surviving finding

Attach these labels to every finding that reaches the report or verdict:

- **Severity**: Critical / High / Medium / Low, calibrated by impact.
- **Confidence**: High / Medium / Low, your certainty that it is real after
  challenge.
- **Reachability**: external / authenticated / internal / unreachable for
  input-driven issues.
- **Action**: Fix / Investigate / Plan / Decide.
- **Trigger or evidence**: the concrete input, path, spec line, command
  output, or missing evidence.

Low-confidence items may still be surfaced, but they should not block on their
own.

## Learning notes

Add a learning note for findings, fixes, positive `Design Quality Notes`, and
rejected recommendations that would help the user become a better developer.
Keep it short and tied to this diff; do not turn the report into a tutorial.

A useful learning note answers:

- **Principle:** the review lens in play, such as project fit, information
  hiding, deep interfaces, change amplification, reuse before reinvention,
  rendering/performance patterns, or test quality.
- **Mechanism:** how the choice changes knowledge hiding, interface depth,
  coupling, locality, change amplification, cognitive load, or unknown unknowns.
- **Why it matters:** the concrete complexity, correctness, maintenance, or
  product risk this principle reduces here.
- **Trade-off / drawback:** what the recommendation costs or could make worse.
- **When not to apply:** the situation where this advice would become cargo
  culting.
- **Alternative:** the next-best option if the recommended change is not worth
  its cost.

Use source lenses as context, not authority. It is fine to cite Patterns.dev,
language/framework guidance, project conventions, or ideas from John
Ousterhout's *A Philosophy of Software Design*, but the note must still explain
why the advice fits this codebase and this diff.

## Sharded verification

After dedup, verify findings in sharded batches of at most 8 per verifier, all
launched together. A verifier may reject a blocking finding only by quoting
the code that contradicts it, proving the claimed state impossible from a
type, constant, or invariant, citing the in-diff guard that covers the
trigger, or matching a defined exclusion. Anything less certain is downgraded
in confidence rather than deleted — a silently rejected blocker is invisible to every later stage, while a downgraded one still reaches a human. Too speculative is never a valid rejection ground.

## Reverse audit

After verification, run gap-hunters with the cumulative finding list, asking
only what was missed. New candidates go through sharded verification like any
other. Stop after 2 consecutive dry rounds; caps are 10 rounds for a small
diff, 5 for a chunked diff, and 3 for a huge diff with a deadline. A stop at
the cap is reported as capped, never as converged.

## Completeness check

After the reverse audit and before the Decision Packet, name the 3 highest remaining risks even when they sit below the blocking bar.
Record them in residual risk with a belowBarReason from this taxonomy: no reachable trigger, low confidence, Investigate-grade evidence, or Decide-grade trade-off.
Fewer than 3 risks is allowed only with an explicit why-no-more-risks note.
Zero findings on a yellow/red diff, or on any diff over 200 source lines counted with git diff --numstat on source files only, triggers a surprise pass: one more targeted hunt whose target is recorded in the Verification Ledger audit trail.
The low tier is exempt from this check.
At medium effort the surprise pass doubles as the gap-hunt; at high effort it follows the reverse audit.
Skip only for green-lane diffs at or under 200 source lines with a converged audit, with a one-line note.

## Challenger behavior

The challenger is selective and runs after the reverse audit:

- run it by default for red-lane diffs
- run it for high-impact low-confidence findings
- run it when lanes disagree materially
- run it as executor of the surprise pass when a yellow-or-higher diff reports zero design findings (no Q/A Finding Set entries and no report- or finding-disposition Design Quality Notes)

Its job is to disprove weak blockers and surface missed high-impact defects,
not to create a second wall of findings. The surprise-pass execution is an explicit gap-hunting mode, ordered after the reverse audit.

Blind re-check discipline: the challenger receives only `title + description + code` for each challenged finding — never the originating lane's reasoning or evidence text. Agreement by copying is not verification; the challenger must reproduce the judgment from the code or drop/downgrade it. A verifier confidence drop of more than one tier (e.g. High → Low) auto-escalates the finding to the challenger for arbitration instead of dying silently.

## Decision packet

Phase 7 produces a `Decision Packet`, the internal verdict bundle that justifies
the final outcome. It is not a second user-facing report contract; Phase 8
projects from it.

Inputs:

- evidence-pack summary
- Architecture Map digest (shape overview for the verdict)
- surviving findings
- design-quality notes with `report`, `finding`, or meaningful `defer`
- verification-ledger summary
- residual unknowns
- project-fit and spec-fit judgment

Outputs:

- verdict: `READY TO SHIP` | `NEEDS REVISION` | `BLOCKED`
- short verdict rationale
- evidence summary
- blocking findings
- blocking findings per axis (Standards vs Spec) plus worst issue within each axis — do not merge or rerank across axes
- non-blocking / deferred findings
- report-facing design strengths and design-risk notes
- verification coverage summary
- dismissedLedger summary (Considered and dismissed projection)
- residual risk and unknowns
- learning notes for the most instructive findings or non-findings
- recommended next step

When relevant, note provenance such as:

- risk lane
- whether challenger ran
- whether audit independence was structural or instructional
- which major lanes were skipped or unavailable

## Reporting-term mapping

Map the internal statuses into final-report terms like this:

- `fixed` stays `fixed`
- `deferred` stays `deferred`
- `blocking`, `non-blocking`, and `contested` remain `unresolved` until they
  are fixed, deferred, or dropped
- surviving findings whose recommended action is `Decide` surface as
  `needs user decision`
- `candidate` is working state only and should not appear in the final report
  unless the review stopped before validation
- `dropped` reaches the final report only through the dismissedLedger list: title plus one-line reason each, ex-blockers first then by severity and confidence, maximum 5

## Quick checklist

- [ ] Blocking items survived the trigger test.
- [ ] Every surviving finding has severity, confidence, action, trigger or
      evidence, and status.
- [ ] Speculative issues are marked `Investigate`, not inflated to blockers.
- [ ] Systemic issues are not solved by broad surprise refactors during
      `moes`.
- [ ] Human trade-offs are surfaced as `Decide`, not guessed.
- [ ] The `Decision Packet` reflects verified findings and actual coverage, not
      optimistic narration.
