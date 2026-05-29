# Dependency & license audit

Phase 4 of `/finalize`, conditional. Run **only** when the diff adds or bumps dependencies — i.e. it touches a manifest or lockfile. Audit only the dependencies that **changed in the diff**, not the whole tree (the existing tree was vetted before; re-auditing it is noise and slows shipping). If `CLAUDE.md` or a documented project policy specifies allowed licenses, audit tools, or version rules, that wins over everything here — follow it and note the override.

## When to run
Trigger when the diff modifies any of:
- JS: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`
- Python: `requirements*.txt`, `pyproject.toml`, `poetry.lock`, `uv.lock`
- PHP: `composer.json`, `composer.lock`
- Go: `go.mod`, `go.sum`
- Rust: `Cargo.toml`, `Cargo.lock`
- Ruby: `Gemfile`, `Gemfile.lock`

If the diff changes none of these, this phase is **N/A** — say so explicitly and move on.

## What to check

### Known vulnerabilities
Run the ecosystem's audit tool (table below) and focus on the deps that changed. Treat known **critical/high** CVEs in added/bumped deps as a **blocker**, not a warning. The vulnerable package is often a *transitive* dep, so inspect the lockfile, not just the manifest — a one-line manifest bump can pull in a whole subtree.

### License compatibility
Identify each new dep's license. Flag any license incompatible with the project's own license — e.g. GPL/AGPL **copyleft** pulled into proprietary or permissively-licensed (MIT/Apache) code that is distributed. That is a **legal blocker**, not a style nit. Also flag **missing/unknown** licenses: an unlicensed dep is unsafe to ship by default. AGPL is especially aggressive (network use counts as distribution).

### Necessity & supply-chain hygiene
- Is the dep actually needed, or does it duplicate something already in the tree (or replace ~a few lines of inline code)? Don't add a package to avoid writing a one-liner.
- Is it actively maintained, reasonably popular, and from a trusted publisher? Be wary of brand-new or near-zero-adoption packages.
- Watch for **typosquatting** — a name a hair off a popular package (`lodahs`, `reqeusts`). Verify the exact name and publisher.
- Frontend: weigh **bundle-size impact**; a heavy lib for a small feature is a smell.

### Pinning & reproducibility
Dependencies must be pinned/locked so installs are reproducible. A manifest change **must** be accompanied by an updated, committed lockfile. Flag a manifest bump with no corresponding lockfile update — installs will silently drift across machines and CI.

## Tooling by ecosystem

| Ecosystem | Vulnerability audit | License scan |
|-----------|--------------------|--------------|
| npm / pnpm / yarn | `npm audit` / `pnpm audit` / `yarn npm audit` | `license-checker` |
| Python | `pip-audit` (also `safety`) | `pip-licenses` |
| PHP / Composer | `composer audit` | `composer licenses` |
| Rust | `cargo audit` | `cargo-license` |
| Go | `govulncheck ./...` | `go-licenses` |
| Ruby | `bundle audit` | `license_finder` |

Run audits against the lockfile state that includes the new deps.

## Anti-patterns
- Adding a heavy dependency for a trivial need.
- Unpinned/floating versions (`^`, `~`, `*`, `latest`) where the project pins.
- Changing a manifest without committing the updated lockfile.
- Ignoring transitive vulnerabilities because the direct dep "looks fine."
- Pulling copyleft (GPL/AGPL) into incompatible or proprietary code.
- Adding an unmaintained, near-unused, or typosquat-risk package.

## Quick checklist
- [ ] If no dependency files changed, phase is **N/A** — stop here.
- [ ] Audit tool run; no new critical/high CVEs (direct or transitive).
- [ ] Each new/bumped dep's license identified and compatible with the project license.
- [ ] No missing/unknown licenses among the changed deps.
- [ ] Each new dep is justified (not duplicate / not inline-able) and from a trusted, maintained source.
- [ ] No typosquat or brand-new/low-adoption red flags; bundle-size acceptable (frontend).
- [ ] Versions pinned/locked; lockfile updated and committed alongside the manifest.
- [ ] `CLAUDE.md` / project dependency policy honored (noted where it overrides this guide).
