# merijn-skills

A personal collection of [Claude Code](https://code.claude.com) skills, packaged as an installable plugin marketplace.

Currently ships one skill:

## `finalize`

A post-implementation **finalization pipeline**: you run it once a change is functionally complete, and it brings the change up to shippable standard, then gives a go/no-go verdict. It is an *orchestrator* — where Claude Code already has an independent-check command (`/code-review`, `/security-review`, `/verify`) it delegates to it, and carries its own guidance for the improve work and the remaining gaps (language best-practices, simplification, refactor assessment, spec-conformance, doc updates, the validation gate). (`/simplify` isn't delegated to — it's just `/code-review --fix`, so Phase 2 owns its guidance.)

**It never commits, pushes, or opens a PR** — it stops at a verdict and a summary, and leaves all git actions to you.

### The pipeline

```
0  Scope & baseline    detect diff/languages, read CLAUDE.md, pin the spec/intent, confirm green start (commit first!)
1  Best-practices      apply language/framework idioms to the changed code
2  Simplify            local clarity pass on the diff (behavior-obvious cleanups)
3  Refactor            fix structural problems worth fixing now (test-gated)
4  Audit               /code-review + /security-review + secret scan + dependency audit + consistency + spec-conformance + structural regression
5  Update docs         sync README/CLAUDE.md/API docs/changelog with the change
6  Verify              lint + type-check + tests + run the app + a11y/perf where relevant
7  Validation gate     12-point critical review (incl. business-risk lanes) → READY TO SHIP / NEEDS REVISION / BLOCKED
8  Report              summary + next-step suggestion (no git writes)
```

Findings in the audit and gate phases are adversarially verified — each must survive a trigger test (a concrete, reproducible failure) before it can block, so the punch list stays trustworthy rather than noisy.

Best-practices coverage (loaded only for the languages in your diff): general OOP/backend, JavaScript, TypeScript, Python, PHP, Laravel, Vue, SQL, PostgreSQL, plus accessibility & i18n. Cross-cutting: simplify (local clarity), refactoring (incl. structural-regression), codebase-fit, spec-conformance, finding-verification, test quality, docs, dependency/license audit, performance profiling, and the validation gate.

## Install

**As a plugin** (invoked as `/finalize:finalize`):

```
/plugin marketplace add MerijnMoes/skills
/plugin install finalize@merijn-skills
```

**As a personal skill** (invoked as the bare `/finalize`) — copy the skill folder into your Claude config:

```bash
cp -R plugins/finalize/skills/finalize ~/.claude/skills/finalize
```

or symlink it so it stays in sync with this repo:

```bash
ln -s "$(pwd)/plugins/finalize/skills/finalize" ~/.claude/skills/finalize
```

> Plugins are namespaced (`plugin:skill`) to avoid collisions, so the plugin install gives `/finalize:finalize`. Personal skills are invoked by bare name, so the copy/symlink route gives the cleaner `/finalize`.

## Repository structure

```
.
├── .claude-plugin/marketplace.json   # the "merijn-skills" marketplace catalog
└── plugins/
    └── finalize/
        ├── .claude-plugin/plugin.json
        └── skills/finalize/
            ├── SKILL.md
            └── references/            # progressive-disclosure guidance loaded on demand
```

## Adding another skill

Create `plugins/<plugin>/.claude-plugin/plugin.json` and `plugins/<plugin>/skills/<skill>/SKILL.md`, then add an entry to `plugins` in `.claude-plugin/marketplace.json`.

## License

[MIT](LICENSE) — use it, fork it, adapt it.
