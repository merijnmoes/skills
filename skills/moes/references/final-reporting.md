# Final reporting

Phase 8 of `moes`. The job of the final report is not just to "summarize
the work." It is to make the outcome **easy to trust** and **easy to hand off**
into a commit, PR, or review conversation.

The user should not need to reconstruct:

- what changed;
- what was actually verified;
- which findings are real versus speculative;
- which project-specific conventions, boundaries, and domain rules were checked;
- what remains risky;
- what they should do next.

## Output principles

- **Lead with the decision.** Verdict first, then the evidence that supports it.
- **Evidence over reassurance.** Prefer "ran `pnpm test`, exercised create+edit
  flow, added regression test for duplicate submit" over "tests looked good."
- **Show project fit.** If the verdict relies on repo-specific architecture,
  domain, tooling, or release conventions, name what was checked and any
  unknowns.
- **Show design quality when it teaches something real.** Use `Design Quality
  Notes` to call out meaningful examples of good design and concrete design
  risks. A "What went right" section is optional and must be omitted when there
  are no evidence-backed examples worth preserving.
- **Reviewer-ready, not diary-like.** Keep chronology out unless it matters for
  risk or debugging.
- **Reference, don't paste.** Point at specs, issues, artifacts, and commits by
  path or URL instead of duplicating their content. Scratch (harnesses, HTML
  sketches, dumps) goes to the OS temp dir, never into the repo.
- **Redact.** Strip secrets, tokens, and PII from everything shown.
- **Separate facts from confidence from gaps.** What you know, how sure you are,
  and what you could not verify are different things.
- **Don't bury the user.** Include everything important, but compress repeated
  detail. The report is a decision artifact, not raw notes.

The final report is the human-readable projection of the `decision packet`. It
should not invent a new structure at the end of the run; it should summarize the
evidence pack, surviving findings, verification ledger, and residual unknowns in
a decision-ready format.

## Canonical layout

The canonical Phase 8 section layout lives in `skills/moes/SKILL.md` under
`### Phase 8 — Final report & retro`. Use that template as-is. This reference
is guidance for filling that template well, not a second competing output
contract.

## Filling the template well

- **Executive summary** — keep it to 2-4 sentences on what changed, whether it
  is shippable, and why the verdict is what it is. It should read like the top
  of a strong PR description.
- **What changed** — summarize scope, major files or surfaces touched,
  intent/spec source, and the project context that materially affected the
  review. Embed the Architecture Map overview (boundaries, touched edges,
  layering notes) so the reviewer sees the shape of the change on one page.
  Omit the Map embed when the architecture lane was `N/A`.
  Avoid file-by-file churn unless the diff is tiny.
- **Evidence** — treat this as the heart of the report. For every relevant
  lane, say what evidence exists: static gates, tests, behavioral verification,
  project fit, docs/config, and only the relevant perf/a11y/rollout/security
  checks. Name which audit lanes actually completed, which results arrived late
  (and how they were reconsolidated and re-verified), which findings were
  fixed, and which tests were rerun after the last change. If something could not be run, say that plainly. Do not let absence
  of evidence read like positive evidence.
- **Verification coverage** — separate directly verified from merely reasoned
  about and from environment-blocked/not exercised. Risks that were only
  reasoned about and never runtime-tested must be listed as such, never folded
  into the verified list.
- **Compact metadata matters.** Keep lane availability, specialty lane
  registry, specialty-lane auto-fix notes, and threat-model escalation status
  concise but explicit. This is where readers should learn which lanes ran,
  which were `N/A`, and which were `deferred by environment`.
- **Findings** — split blocking from non-blocking items. For every finding,
  include severity, confidence, action type, concrete trigger or violated spec
  line, and current status. Order findings by business impact, not by phase or
  file order. Keep blocking Standards and blocking Spec findings in separate
  sub-lists and close with a one-line per-axis summary (`Standards: N, worst X / Spec: M, worst Y`); do not pick a single winner across axes.
- **Considered and dismissed** — list Finding Set members dropped after challenge or verification: title plus one-line reason each, ex-blockers first then by severity and confidence, maximum 5. Omit when empty.
- **What went right** — include this only for meaningful examples from `Design
  Quality Notes`. Tie each note to a changed surface and explain the mechanism:
  what knowledge became hidden, which interface became deeper, what coupling or
  change amplification fell, or which unknown unknowns became explicit. Do not
  include generic praise, morale filler, or a default empty section; if no
  meaningful examples exist, the section must be omitted.
- **Learning notes** — include compact teaching notes for the most instructive
  findings, fixes, positive design notes, and rejected recommendations. Explain
  the principle/source lens, the mechanism, why it matters, the drawback or
  trade-off, when not to apply it, and a plausible alternative. Use sources such
  as Patterns.dev, project conventions, SOLID, clean architecture, or
  Ousterhout-style complexity/design lenses only when they clarify the judgment;
  never present them as rules to obey blindly.
- **What each phase did** — keep this terse. It is a handoff aid, not a second
  narrative report.
- **Residual risk / open questions** — this section is mandatory even when
  empty. Include environment limits, probes you still want, deferred refactors
  with risk implications, ambiguous product/spec questions, and rollout or
  operational assumptions that were not exercised. For each environment deferral, state whether it became a Plan follow-up or an accepted gap. If there is truly no
  residual risk worth naming, say that explicitly.
- **Recommended next step** — tailor it to the verdict. For `READY TO SHIP`,
  suggest commit/PR framing, reviewer attention points, and any rollout note
  worth carrying forward. For `NEEDS REVISION` or `BLOCKED`, state the exact
  fixes required before rerunning `moes`. Shape multi-part `Plan` follow-ups as
  tracer-bullet slices (each a vertical, demoable behavior, single-context
  sized) with blocking edges — unblocked slices first (the frontier). A wide
  mechanical refactor is the exception: sequence it expand–contract (new form
  beside old → migrate in batches → delete old). Refer to specs/issues/artifacts
  by name and path instead of pasting them; name suggested skills or lanes for
  the follow-up.
- **Threat-model escalation** — if the run triggered a red-lane trust-boundary
  escalation, say whether it produced a blocking finding, a follow-up plan, or
  no additional action.
- **Retro** — keep it to a few lines on durable lessons or conventions worth
  remembering, not a second report.

## PR-ready framing

When the verdict is `READY TO SHIP`, the report should leave the user with
material they can reuse directly in a PR:

- a one-paragraph change summary;
- the highest-signal verification bullets;
- reviewer attention points for the riskiest surfaces;
- any rollout/migration/config note that belongs in the PR body.

You do not need to write a full PR description unless the host or user asked for
it, but the report should make that description easy to derive.

## Anti-patterns

- Verdict without evidence.
- A giant wall of phase-by-phase narration that hides the actual result.
- Mixing speculative worries with confirmed findings.
- Claiming verification you did not actually perform.
- "No issues found" without saying what was checked.
- Listing every touched file when a few surfaces would communicate better.
- Hiding environment limitations in a footnote.

## Quick checklist

- [ ] Verdict appears immediately and is justified.
- [ ] Scope, touched surfaces, and intent source are stated clearly.
- [ ] Project-specific context that mattered is stated clearly.
- [ ] Evidence is listed per relevant lane, not implied.
- [ ] Report names completed vs pending/late lanes, fixed findings, and tests rerun after the last change.
- [ ] Reasoned-about-only risks are listed separately from directly verified ones.
- [ ] Findings carry severity/confidence/action/trigger/status.
- [ ] Learning notes explain the mechanism, why, trade-off, when-not-to-apply,
      and alternative for instructive advice.
- [ ] Optional "What went right" section appears only for meaningful examples
      backed by `Design Quality Notes`; otherwise it is omitted.
- [ ] Residual risk/open questions are explicit, even if empty.
- [ ] Recommended next step matches the verdict.
- [ ] Output is concise but reusable in a PR or review handoff.
