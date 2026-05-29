# merijn-skills

A personal collection of AI-coding-agent skills, authored once and usable across [Claude Code](https://code.claude.com), [OpenAI Codex CLI](https://developers.openai.com/codex), and [GitHub Copilot CLI](https://docs.github.com/en/copilot). The skill lives at `.agents/skills/<skill>/` — the shared convention Codex and Copilot read directly — and Claude Code consumes the same files through a plugin marketplace whose skill path is a symlink into that canonical dir.

Currently ships one skill:

## `finalize`

A post-implementation **finalization pipeline**: you run it once a change is functionally complete, and it brings the change up to shippable standard, then gives a go/no-go verdict. It is a **self-contained orchestrator** — it carries its own guidance for every phase (language best-practices, simplification, refactor assessment, code review, security review, behavioral verification, spec-conformance, doc updates, the validation gate) and depends on no host-agent built-in commands. The independent audit checks (code review, security review) run in fresh-context subagents that follow the skill's own references; behavioral verification runs in the main agent.

**It never commits, pushes, or opens a PR** — it stops at a verdict and a summary, and leaves all git actions to you.

### The pipeline

```
0  Scope & baseline    detect diff/languages, read CLAUDE.md, pin the spec/intent, confirm green start (commit first!)
1  Best-practices      apply language/framework idioms to the changed code
2  Simplify            local clarity pass on the diff (behavior-obvious cleanups)
3  Refactor            fix structural problems worth fixing now (test-gated)
4  Audit               code review + security review (own refs, subagent-run) + secret scan + dependency audit + consistency + spec-conformance + structural regression
5  Update docs         sync README/CLAUDE.md/API docs/changelog with the change
6  Verify              lint + type-check + tests + run the app + a11y/perf where relevant
7  Validation gate     12-point critical review (incl. business-risk lanes) → READY TO SHIP / NEEDS REVISION / BLOCKED
8  Report              summary + next-step suggestion (no git writes)
```

Findings in the audit and gate phases are adversarially verified — each must survive a trigger test (a concrete, reproducible failure) before it can block, so the punch list stays trustworthy rather than noisy.

Best-practices coverage (loaded only for the languages in your diff): general OOP/backend, JavaScript, TypeScript, Python, PHP, Laravel, Vue, SQL, PostgreSQL, plus accessibility & i18n. Cross-cutting: simplify (local clarity), refactoring (incl. structural-regression), code review (correctness), security review (OWASP Top 10:2025 + conditional API & LLM lenses), behavioral verification, codebase-fit, spec-conformance, finding-verification, test quality, docs, dependency/license audit, performance profiling, and the validation gate.

## Install

The skill is authored once at `.agents/skills/finalize/`. Codex CLI and Copilot CLI read that path directly; Claude Code installs the same files via the plugin marketplace.

### Claude Code

**As a plugin** (invoked as `/finalize:finalize`):

```
/plugin marketplace add MerijnMoes/skills
/plugin install finalize@merijn-skills
```

The plugin path is a symlink into `.agents/skills/finalize/`; Claude's installer dereferences it, so the marketplace install copies the real files into its cache.

**As a personal skill** (invoked as the bare `/finalize`) — copy or symlink the canonical folder into your Claude config:

```bash
cp -R .agents/skills/finalize ~/.claude/skills/finalize
# or symlink it so it stays in sync with this repo:
ln -s "$(pwd)/.agents/skills/finalize" ~/.claude/skills/finalize
```

> Plugins are namespaced (`plugin:skill`) to avoid collisions, so the plugin install gives `/finalize:finalize`. Personal skills are invoked by bare name, so the copy/symlink route gives the cleaner `/finalize`.

### Codex CLI & GitHub Copilot CLI

Both read the shared `.agents/skills/` convention — project-level (scanned from the working directory up to the repo root) and personal (`~/.agents/skills/`). Run either CLI from inside a clone of this repo and the skill is already discovered. To make it available in every project, link the canonical folder into your personal skills dir:

```bash
mkdir -p ~/.agents/skills
ln -s "$(pwd)/.agents/skills/finalize" ~/.agents/skills/finalize
```

- **Codex CLI** — run it with `$finalize`, pick it from the `/skills` list, or let Codex select it by description.
- **Copilot CLI** — invoke by name ("use the finalize skill"). Copilot CLI does not support custom slash commands, so there is no `/finalize` there.

## Repository structure

```
.
├── .agents/
│   └── skills/
│       └── finalize/                   # canonical skill — read directly by Codex & Copilot CLI
│           ├── SKILL.md
│           └── references/             # progressive-disclosure guidance loaded on demand
├── .claude-plugin/marketplace.json     # the "merijn-skills" marketplace catalog (Claude Code)
└── plugins/
    └── finalize/
        ├── .claude-plugin/plugin.json
        └── skills/finalize  ->  ../../../.agents/skills/finalize   # symlink into the canonical dir
```

## Adding another skill

1. Author the skill at `.agents/skills/<skill>/SKILL.md` (plus an optional `references/` folder). This is what Codex and Copilot read.
2. To also ship it as a Claude Code plugin, create `plugins/<plugin>/.claude-plugin/plugin.json`, symlink the skill into the plugin, and add an entry to `plugins` in `.claude-plugin/marketplace.json`:

```bash
ln -s ../../../.agents/skills/<skill> plugins/<plugin>/skills/<skill>
```

## License

[MIT](LICENSE) — use it, fork it, adapt it.
