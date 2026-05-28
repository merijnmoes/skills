# Update docs

Phase 5 of `/finalize`. Sync documentation with the change you just made. Update
**only** what the diff actually affects — never invent docs, never pad with
narration, never document behavior that isn't there. A stale or fictional doc is
worse than no doc, because it actively misleads the next reader.

Project conventions in CLAUDE.md / AGENTS.md always override the generic rules
below. If the project documents its own doc style, format, or changelog process,
follow it and say so.

## What to check

Walk each of these against the diff. Touch one only if the change actually
affected it.

- **README / getting-started**: Did setup steps, commands, env vars,
  configuration, or usage examples change? If the diff renamed a flag, added a
  required env var, or changed how you run the thing, the README must reflect it.
- **CLAUDE.md / AGENTS.md**: Did the change add a convention, a new command, a
  new architectural area, or invalidate something stated there? Keep it current —
  it is the project's standing instructions to future AI sessions, so drift here
  silently corrupts every later session.
- **API / usage docs**: Public function/endpoint signatures, request/response
  shapes, CLI flags, and config keys that changed must be reflected. Internal-only
  helpers usually don't need doc updates unless the project documents them.
- **Inline docstrings/comments**: Update docstrings on changed *public*
  signatures — params, return type, raised errors. Update any comment the change
  made stale or wrong. Do NOT add comments that restate what the code does or
  reference the task/PR ("added for ticket X", "fix for the bug"); those rot the
  moment context moves on. Keep or add a comment only when it explains a
  non-obvious *why*.
- **Examples / sample code / fixtures** that exercise the changed behavior — if
  the new signature breaks an example, fix the example.
- **Migration / upgrade notes** if the change is breaking: tell users what to do.

## How to write the updates

- Match the surrounding doc's voice, format, and heading style. An edit should be
  invisible as an edit.
- Keep edits minimal and scoped to what changed. Don't rewrite a section you only
  needed to touch one line of.
- Be truthful. Document what the code *does now*, never intended-but-unimplemented
  behavior and never aspirational wording.
- If the change makes existing docs wrong, fix them. Do not leave a doc that
  contradicts the code — pick the truth (the code) and make the doc agree.

## Changelog

If the project keeps a changelog — `CHANGELOG.md`, Keep a Changelog format,
conventional-commits-driven, or release notes — add one entry under the
unreleased / next section describing the **user-facing** change (what changed for
someone using it), not the implementation detail. Match the existing entry style.

If the repo has no changelog convention, do **not** create one unprompted. Note
in your summary that none exists.

## Anti-patterns

- Documenting code that didn't change in this diff.
- Inventing docs for behavior that doesn't exist (or doesn't exist *yet*).
- Comments that narrate the obvious or pin to the current task/fix.
- Leaving a stale doc, docstring, or comment that now contradicts the code.
- Creating new doc files the project never asked for.
- Expanding scope: "while I'm here" doc rewrites unrelated to the change.

## Quick checklist

- [ ] README updated iff setup/commands/env/config/usage changed.
- [ ] CLAUDE.md / AGENTS.md updated iff a convention, command, or area changed or
      was invalidated.
- [ ] Public signatures' docstrings match params, return, and raised errors.
- [ ] Changed flags / config keys / response shapes reflected in API docs.
- [ ] Stale comments fixed; no new narration or task-reference comments added.
- [ ] Examples / fixtures for changed behavior still run and are correct.
- [ ] Migration notes added for breaking changes.
- [ ] Changelog entry added (user-facing) — or noted that no changelog exists.
- [ ] No new doc files created beyond what the change requires.
- [ ] No doc now contradicts the code.
