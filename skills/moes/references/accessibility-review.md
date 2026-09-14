# Accessibility review

Phase 4 and Phase 6 support for `moes`, conditional. Apply when the diff
changes UI, markup, forms, dialogs, navigation, interactions, or visual tokens.

This is the audit and verification companion to
`best-practices/frontend-a11y-i18n.md`. That best-practices file remains the
Phase 1 implementation guide; this lane is where `moes` checks whether the
changed surface was actually built and verified accessibly.

## What to check

- **Automated scan or equivalent configured checker** — run axe, pa11y, a
  framework-native checker, or the project's configured equivalent when one is
  available for the changed surface.
- **Keyboard-only path** — the changed user flow is fully operable without a
  mouse, including activation, escape paths, and any changed composite widgets.
- **Focus order and focus return** — tab order follows the intended flow; focus
  moves intentionally on open/close/navigation; dialogs, popovers, and similar
  surfaces return focus to a sensible trigger or next step.
- **Accessible name, description, and form error messaging** — interactive
  elements expose a usable accessible name, helper/error text is associated
  correctly, and form failures are announced clearly enough for assistive tech.
- **Contrast and reduced motion** — when the changed surface affects visual
  tokens, states, animation, or theming, check contrast and
  `prefers-reduced-motion` behavior rather than assuming existing tokens still
  satisfy them.
- **Table semantics** — when the diff renders tabular data, check real table
  structure (`table`/`th` with `scope`, caption or labelled description, no
  layout tables) with a screen reader in mind: headers must announce correctly
  and the reading order must match the visual order.
- **DOM-id and call-site integrity** — when the diff adds or renames DOM ids,
  `aria-*` targets, or JS hooks, verify every id and every call-site/reference
  matches; a dangling `for`, `aria-labelledby`, or query selector is a finding.

## Concrete prompts

- What exact changed journey should be walked with keyboard only?
- If a dialog, drawer, menu, or route transition changed, where does focus go
  on entry and where does it return on exit?
- Which control names, descriptions, or error messages would a screen reader
  announce for the changed UI?
- Did the diff alter colors, emphasis, disabled states, or motion in a way that
  needs contrast or reduced-motion verification?

## Common blockers

- Clickable custom elements without correct semantics, name, or keyboard
  support.
- Focus trapped incorrectly, lost after close, or moved in an order that does
  not match the interaction.
- Validation errors rendered visually but not associated to inputs or announced.
- Token or animation changes that reduce contrast or ignore reduced-motion
  preferences.

## Mutability

- Mutability mode: `small-fix-allowed`
- `small-fix-allowed` for labels, roles, semantics, focus wiring, and obvious
  token-level fixes.

## Output

Use this lane for Phase 4 findings and for Phase 6 verification notes tied to
the changed UI surface only.
