# merijn-skills

A personal collection of agent skills for AI coding CLIs — installable across [Claude Code](https://code.claude.com), [OpenAI Codex CLI](https://developers.openai.com/codex), [GitHub Copilot CLI](https://docs.github.com/en/copilot), and [50+ other agents](https://github.com/vercel-labs/skills) with a single `npx skills` command.

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

Install with the [`skills`](https://github.com/vercel-labs/skills) CLI — one command, no clone, works across Claude Code, Codex, Copilot, and 50+ other agents:

```bash
npx skills add MerijnMoes/skills
```

That prompts for which agent(s) to install into. To skip the prompt, target agents directly or install globally:

```bash
npx skills add MerijnMoes/skills -a claude-code -a codex -a github-copilot
npx skills add MerijnMoes/skills -g        # global (~/<agent>/skills) — available in every project
npx skills add MerijnMoes/skills --copy    # copy the files instead of symlinking
```

Then invoke it:

- **Claude Code** — `/finalize`
- **Codex CLI** — `$finalize`, or pick `finalize` from the `/skills` list
- **Copilot CLI** — ask "use the finalize skill" (Copilot has no custom slash commands)

## Repository structure

```
.
└── skills/
    └── finalize/
        ├── SKILL.md
        └── references/   # progressive-disclosure guidance loaded on demand
```

## Adding another skill

Create `skills/<name>/SKILL.md` (plus an optional folder of reference files beside it) and commit it. `npx skills add MerijnMoes/skills` will discover and offer it automatically.

## License

[MIT](LICENSE) — use it, fork it, adapt it.
