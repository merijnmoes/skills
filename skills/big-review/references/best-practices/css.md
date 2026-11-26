# CSS best-practices

Loaded in `big-review` Phase 1 when the diff changes `.css`, `.scss`, `.sass`, `.less`, CSS modules, or substantial style blocks in components/templates. Layers on top of `frontend-a11y-i18n.md`, which still owns accessibility and i18n concerns. This file focuses on maintainability, cascade discipline, responsiveness, and style performance. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Tokens, reuse, and scope
- Prefer the project's design tokens or CSS variables for shared colors, spacing, radii, typography, and motion values. Repeated hard-coded values are usually a maintainability smell.
- Scope styles deliberately. Avoid selectors that depend on fragile DOM depth or leak across component boundaries when the project uses modules, BEM, utility classes, or another explicit system.
- Reuse the existing naming/cascade strategy instead of introducing a second style architecture in the same codebase.

```css
/* Bad: repeated hard-coded values create a second token system */
.card { border-radius: 14px; padding: 18px; color: #2f6fed; }
.badge { border-radius: 14px; padding: 18px; color: #2f6fed; }

/* Good: shared values come from project tokens/variables */
.card { border-radius: var(--radius-md); padding: var(--space-4); color: var(--color-accent); }
.badge { border-radius: var(--radius-md); padding: var(--space-4); color: var(--color-accent); }
```

## Cascade and specificity
- Treat `!important` as an exception for utilities, third-party overrides, or similarly constrained cases. If it appears in ordinary component styling, ask why the cascade is fighting itself.
- Prefer predictable specificity over selector arms races. If a style only works because the selector became huge, the structure likely needs cleanup.
- Keep state styles explicit and local: hover/focus/selected/disabled variants should read as part of one component story, not scattered overrides.

## Layout and responsiveness
- Favor resilient layout primitives (`flex`, `grid`, logical sizing, min/max constraints) over brittle pixel-perfect positioning when the component must adapt.
- Use responsive behavior that matches the project's breakpoint/container-query strategy.
- Avoid fixed heights/widths that will clip real content unless the design truly requires it and overflow is handled intentionally.
- Prefer logical properties when the project supports RTL or multiple writing modes.

## Motion and performance
- Do not use `transition: all` unless the project explicitly allows it for a narrow reason. Transition only the properties meant to animate.
- Prefer `transform` and `opacity` for motion over layout-triggering properties when the animation matters for performance.
- Be careful with large blur/filter/shadow animations, huge paint areas, and unnecessary `will-change`.
- Keep layered backgrounds, masks, and advanced effects intentional; if they are purely decorative, make sure they do not harm legibility or interaction.

```css
/* Bad: animates everything, including expensive layout changes */
.panel {
  transition: all 200ms ease;
}

/* Good: only animate the intended cheap properties */
.panel {
  transition: opacity 200ms ease, transform 200ms ease;
}
```

## UI quality
- Match hover, focus, active, disabled, and error states to the component's actual behavior. Visual state drift is a correctness issue, not just polish.
- Preserve readability: contrast, spacing, line length, and overflow handling need to survive real data, not just the happy-path mock.
- If the diff adds styles for interactive controls, make sure the visuals still support keyboard, touch, and reduced-motion expectations from `frontend-a11y-i18n.md`.

```css
/* Bad: fixed height clips translated or user-generated content */
.toast {
  height: 40px;
}

/* Good: size flexes with content while keeping a minimum target */
.toast {
  min-height: 40px;
  padding-block: var(--space-2);
}
```

## Red flags to look for
- New styles introduce a second token/naming strategy.
- Huge selectors or `!important` are compensating for a cascade problem.
- Fixed dimensions assume mock-length content.
- Animation choices look decorative first and user-readable second.
- Component states look clickable/disabled/error-like in ways the behavior does not match.

## Anti-patterns
- Repeated hard-coded tokens where project variables exist.
- `!important` used to fight local styles.
- `transition: all`.
- Fragile descendant selectors tied to incidental markup structure.
- Fixed dimensions that clip realistic content.
- Heavy decorative effects that degrade readability or scrolling.

## Quick checklist
- [ ] Shared values use project tokens/variables where appropriate
- [ ] Selector scope and specificity match the repo's styling strategy
- [ ] Responsive/layout behavior is resilient to real content and viewport changes
- [ ] Motion is deliberate; no blanket `transition: all` or unnecessary paint-heavy effects
- [ ] Visual states match real component behavior
- [ ] Accessibility/i18n implications still pass through `frontend-a11y-i18n.md`
