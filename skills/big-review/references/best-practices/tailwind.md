# Tailwind CSS best-practices

Loaded in `big-review` Phase 1 when the diff touches Tailwind surfaces: `tailwind.config.*`, v4 CSS-first theme (`@import "tailwindcss"`, `@theme` blocks), utility class lists in markup/JSX/Vue/templates, or `cva` / `tailwind-variants` configs. Layers on top of `css.md` (cascade, layout, motion) and `frontend-a11y-i18n.md` (accessibility, i18n). Applies to the changed Tailwind code in the diff, not the whole app. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Version first: v3 config vs v4 CSS-first

Determine where tokens live *before* judging anything: v3 keeps them in `tailwind.config.*` (`theme.extend`); v4 keeps them in CSS `@theme` blocks. Do not look for a config file in a v4 project and conclude "no token system exists" — that is a version-detection failure, not a finding.

Minification is version-dependent and build-owned: v4 minifies automatically (Lightning CSS), so there is nothing to check. On v3, confirm the build actually minifies (`--minify` via the CLI or `cssnano` in PostCSS). If the Tailwind version is not visible from the diff, say nothing rather than guessing — this check stays silent, never speculative.

## Tokens: reuse before inventing, and only where a system exists

- Prefer project tokens over magic values (`p-[123px]`, ad-hoc `15px` / `16px` / `17px` sprawl) — but only when a token system actually exists in this repo. Pushing values into a nonexistent config is architecture work, not final hardening: file it as a `Plan` finding, never auto-fix it.
- A one-off value is sometimes genuinely correct (matching an external asset's exact dimensions, replicating a spec precisely) — flag it and ask whether it should become a token rather than refusing outright.
- Equal values are not the same role. Two tokens may share a hex value while carrying different contracts (`text-error` vs a decorative red). Verify the token *role* the consumer chose, not just the rendered value.
- Flag unused tokens only after checking dynamic usage (template-literal construction, `cva` / `tailwind-variants` configs elsewhere in the repo) — a literal grep misses these. Never auto-delete a token inside `big-review`; report it and let the owner confirm.

## Dynamic class construction breaks the build silently

Tailwind scans source text for class names. Runtime-constructed utilities such as `` `bg-${color}-500` `` or concatenated class fragments may generate no CSS at all — the UI silently loses styling with no build error. Treat this as a correctness issue, not a style nit; it is the highest-value Tailwind finding in a review.

- Prefer a static variant map (full class strings per variant) or the project's safelist.
- Flag any diff that introduces runtime-constructed utilities without a safelist entry or static map, with a concrete trigger: the constructed expression plus the missing generated rule.

## Class lists: dense and ordered, but diff-scoped

- Prefer shorthand within hunks the diff already touches: `py-4` over `pt-4 pb-4` (same for `px` / `mx` / `my`), drop `flex-row` (the CSS default), `border-black/50` over `border-opacity-50`. Fewer, denser classes read faster — but never opportunistically rewrite unrelated class lists elsewhere; that is scope creep with real merge-conflict cost.
- Match the order the project's tooling already enforces: check for a Prettier config with the official Tailwind plugin first and follow whatever it produces. If no such config exists, use the plugin's default layer order for touched lists and recommend the plugin as a `Plan` follow-up — do not mass-reformat the repo to a guessed order.

## Extraction: components over `@apply`, variants over `className` props

- Do not extract repeated utilities with `@apply` into stylesheets — it discards Tailwind's actual advantages (no class naming, style changes isolated to the using component) and grows the CSS bundle. Point at a real component instead. If the codebase is already `@apply`-heavy, flag it as debt and convert on next-touch only; never propose a mass rewrite inside `big-review` (the depth call belongs to Q2 altitude in `design-quality.md`).
- Shared design-system components (imported in more than one place — buttons, badges, inputs) must not accept arbitrary styling via an open `className` prop: every call site inventing its own utility combination erodes visual consistency over time. Require a fixed variant map instead. `tailwind-merge` is an acceptable fallback for resolving class conflicts at runtime, but it adds bundle weight — do not install it or mandate it as the default. One-off single-use components are exempt: an open `className` there is fine.
- Conflicting utilities on one element (`p-4 p-6`, `flex hidden` across breakpoints without clear intent) are a finding: state which rule wins and whether that was intended.

## Red flags to look for

- Magic values or one-off tokens where a real token scale exists.
- Runtime-constructed class strings with no safelist or static variant map.
- `@apply` proposed as "cleaner" for repeated utilities.
- New arbitrary `className` props on shared components instead of variants.
- Conflicting or breakpoint-contradictory utilities on the same element.
- A verdict of "no token system" reached without checking the Tailwind version first.

## Anti-patterns

- `p-[123px]`-style magic values bypassing existing tokens.
- Ad-hoc token sprawl (`15px`, `16px`, `17px`) instead of reusing the scale.
- `@apply`-heavy stylesheets presented as tidier than components.
- Shared components restyleable from every call site via `className`.
- Template-literal class construction invisible to Tailwind's scanner.
- Mass reformatting of untouched class lists for ordering or shorthand.

## Quick checklist

- [ ] Tailwind version identified (v3 config vs v4 CSS-first) before any token judgement
- [ ] Shared values reuse project tokens where a token system exists; missing-system cases filed as `Plan`, not auto-fixed
- [ ] No runtime-constructed utilities without a safelist entry or static variant map
- [ ] Shorthand and ordering applied to touched hunks only; project tooling order matched
- [ ] No new `@apply` extractions; existing `@apply` debt flagged, not rewritten
- [ ] Shared components use fixed variants, not arbitrary `className` props; one-offs exempt
- [ ] No conflicting utilities on one element without demonstrated intent
- [ ] Minification checked only when the version is visible (v3 build step; v4 automatic)
