# Spec & intent conformance

Used in `/finalize` Phase 0 (pin the spec) and Phase 4 (check the diff against it). A change can be correct, clean, and idiomatic yet still be the *wrong* change — it implements something other than what was asked, leaves a requirement half-built, or quietly adds behavior nobody requested. Every other phase asks "is this code good?"; this one asks "is this the change we were supposed to make?" Those are different questions, and code that passes the first can fail the second.

## Pinning the spec (Phase 0)

Establish *what was asked for* before you can check the diff against it. Look in this order and stop at the first usable source:

1. **Issue references in commit messages** — `#123`, `Closes #45`, `Fixes ORG-12`, GitLab `!67`. If found and `gh` is available, fetch the issue body with `gh issue view <n>`. This is the strongest signal because it is the request in the author's own words.
2. **A spec/PRD file** under `docs/`, `specs/`, `.scratch/`, or similar, whose name matches the branch or feature.
3. **The branch name** as a weak hint (`fix/login-rate-limit` tells you the intent even with no doc).
4. **Ask the user** — if 1–3 turn up nothing, ask for a one-line statement of intent or a path to the spec. One question, then move on.
5. **No spec at all** — if the user has none either, record *"no external spec available; internal-consistency check only"* and fall back to the lighter pass below. Do not block on a missing spec, and do not invent acceptance criteria the user never stated.

Record the pinned intent (and its source) so Phase 4 can cite it.

## The three checks (Phase 4, read-only)

Compare the diff against the pinned intent. Report findings in three buckets:

1. **Missing or partial requirements** — something the spec asked for that the diff does not deliver, or delivers only part of. Quote the spec line and name what is absent. **This is a blocking finding → NEEDS REVISION.** `/finalize` *flags* the gap; it does **not** implement the missing feature itself — closing it is new feature work, outside a QA pipeline's remit.
2. **Scope creep** — behavior in the diff that the spec did not ask for. This is the spec-side mirror of the minimality principle. Usually non-blocking (flag it, and note if it carries its own risk or maintenance cost), but escalate if the unrequested behavior is risky, changes a public contract, or buries the actual change.
3. **Implemented-but-wrong** — a requirement that looks handled but where the implementation doesn't actually satisfy what was asked (off-by-one against the stated rule, wrong default, the happy path only, a misread of the acceptance criteria). Quote the spec line and the diverging code. Blocking if it means the feature doesn't meet its stated bar.

Keep the spec axis separate from the quality/standards findings of the other lanes — do not let "the code is clean" mask "the code does the wrong thing," or vice versa. Report it as its own lane.

## Internal-consistency fallback (no external spec)

When no spec was pinned, you cannot judge completeness against an external bar — so judge the diff against *itself*. Flag:
- **Half-built paths** — a function/flag/branch introduced but never called, a config key read but never set, an interface method left throwing `NotImplemented`.
- **Dead or unreachable branches** the change added.
- **Leftover scaffolding** — `TODO`/`FIXME`/`XXX` markers, commented-out code, debug logging, placeholder copy or stub return values shipped in the diff.
- **Internal contradictions** — a validation rule applied in one path but not its sibling, a renamed concept only half-propagated, a comment that now disagrees with the code.

State plainly that this was an internal-consistency pass, not a requirements check, so the verdict isn't read as "matches the spec."

## Output
A short per-bucket list. For each finding: the bucket, the spec line (or "internal"), the diverging code location, and whether it is blocking. If everything lines up, say so — "diff matches the pinned intent; no missing requirements or scope creep" is a valid and valuable result.
