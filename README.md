# merijnmoes/skills

Standalone skills for thorough code review and practical engineering guidance.
They install across [Claude Code](https://code.claude.com), [OpenAI Codex
CLI](https://developers.openai.com/codex), [GitHub Copilot
CLI](https://docs.github.com/en/copilot), and other agents supported by the
[`skills`](https://github.com/vercel-labs/skills) CLI.

## Big Review

`big-review` is a final-hardening review for a functionally complete change. It
reviews the current diff against the base branch, using parallel audit lanes,
an advisory architecture lane, and verified findings.

Use `/big-review` for the current diff, or `/big-review against <branch>` to
choose a comparison base. The review covers scope and intent, code quality,
security, verification, and a final evidence-backed verdict.

## Engineering Principles

`engineering-principles` applies practical guidance for understanding a
codebase, choosing simple designs, preserving behavior, and verifying changes.
It treats heuristics such as KISS, DRY, and SOLID as context-sensitive tools,
not rigid rules.

## Install

```bash
npx skills add merijnmoes/skills
```

Choose the skills and agent(s) in the CLI prompt. To skip the prompt, target
agents directly or install globally:

```bash
npx skills add merijnmoes/skills -a claude-code -a codex -a github-copilot
npx skills add merijnmoes/skills -g
npx skills add merijnmoes/skills --copy
```

Invoke `big-review` as `/big-review` in Claude Code, `$big-review` in Codex,
or ask Copilot to use the `big-review` skill. The engineering-principles skill
can be selected from the agent's available skills.

## Repository structure

```text
.
└── skills/
    ├── big-review/
    │   ├── SKILL.md
    │   └── references/   # review lanes, verification, and reporting
    └── engineering-principles/
        └── SKILL.md
```

## License

[MIT](LICENSE) — use it, fork it, adapt it.
