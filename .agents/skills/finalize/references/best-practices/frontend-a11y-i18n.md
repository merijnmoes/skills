# Frontend accessibility & i18n best-practices

Loaded in `/finalize` Phase 1 when the diff touches UI/markup (HTML/JSX/TSX/Vue/Svelte/templates/components), and verified again in Phase 6. Applies to the changed UI code in the diff, not the whole app. Project conventions in CLAUDE.md always override these rules — when they conflict, follow the project and note the deviation.

## Accessibility (a11y)

### Semantics & structure
- Use native semantic elements (`button`, `a`, `nav`, `main`, `ul`/`li`, `header`/`footer`, headings) instead of `div`/`span` with click handlers — native elements bring focus, keyboard activation, and the correct role for free; a styled `div` brings none of it.
- One `h1` per view; keep headings in logical order (no skipping levels) — screen-reader users navigate by heading outline.
- Wrap content in landmark regions (`main`, `nav`, `aside`, `footer`) so assistive tech can jump between them.
- Give meaningful images real `alt` text; use empty `alt=""` for purely decorative images so they're skipped, not announced as noise.
- Write link text that makes sense out of context — "read the report", not "click here" — since users list links in isolation.

### Forms & controls
- Every input has an associated `<label>` (via `for`/`id` or wrapping), or an `aria-label` when no visible label exists.
- Group related controls (radios, address fields) with `fieldset` + `legend` so the group's purpose is announced.
- Associate error messages with their field via `aria-describedby` and announce them (e.g. `aria-live` / `role="alert"`) — a visually-styled error that isn't wired up is invisible to screen readers.
- Don't use placeholder text as the only label — it disappears on input and has poor contrast.

### Keyboard & focus
- Everything operable by mouse must be operable by keyboard (Tab/Enter/Space/arrows) — this falls out for free if you used native elements.
- Preserve a visible focus indicator; never `outline: none` without an equivalent replacement (`:focus-visible` style) — keyboard users lose their place otherwise.
- Manage focus on route changes, modal open/close (trap focus inside, restore it to the trigger on close), and injected dynamic content.
- Keep tab order following the visual/DOM order; never use positive `tabindex` (it hijacks the natural order and is unmaintainable).

### ARIA, contrast & motion
- Prefer native semantics over ARIA — ARIA is a last resort, and incorrect ARIA is worse than none because it actively lies to assistive tech.
- Meet WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and UI/graphics.
- Never convey meaning by color alone (e.g. red = error) — add text, an icon, or a pattern for colorblind users.
- Respect `prefers-reduced-motion`: reduce or remove non-essential animation for users who request it.
- Give icon-only controls an accessible name (`aria-label` or visually-hidden text) so they're not announced as "button" with no purpose.
- Verify with an automated checker (e.g. axe) plus a manual keyboard pass — automated tools catch only a fraction of issues, so the keyboard walkthrough is not optional.

## Internationalization (i18n)
- Never hardcode user-facing strings — route them through the project's i18n framework (i18next, vue-i18n, FormatJS/react-intl, gettext, etc.).
- Don't concatenate translated fragments to build a sentence — word order differs by language. Use one full string with named interpolation (`t('greeting', { name })`).
- Handle pluralization and gender through the framework's plural/select rules, not `if (n === 1)` — many languages have more than two plural forms.
- Format dates, numbers, and currency with `Intl` / locale-aware APIs, never manual string formatting (`1,000.00` vs `1.000,00`, date order, etc.).
- Support RTL where the project targets RTL locales: use logical CSS properties (`margin-inline-start`, `inset-inline`) and honor `dir` instead of hardcoded `left`/`right`.
- Keep locale-aware sorting/collation in mind (`Intl.Collator`) — byte-order sorts produce wrong results for accented and non-Latin text.
- Externalize copy into resource files so translators can work without touching code.

## Anti-patterns
- Clickable `div`/`span` instead of `button`/`a`.
- Inputs without labels; meaningful images without `alt`.
- `outline: none` with no replacement focus style.
- Meaning conveyed by color alone.
- ARIA bolted onto non-semantic markup instead of using the right element.
- Hardcoded user-facing strings.
- String concatenation to assemble translated sentences.
- Manual date/number/currency formatting.
- Custom `n === 1` pluralization that ignores the locale's plural rules.
- No RTL support when the project ships RTL locales.

## Quick checklist
- [ ] Interactive elements are native (`button`/`a`), not clickable `div`/`span`
- [ ] One `h1`, logical heading order, landmark regions present
- [ ] Images have `alt` (empty for decorative); links read meaningfully alone
- [ ] Every input has a label; errors wired via `aria-describedby` and announced
- [ ] Fully keyboard operable; visible focus preserved; no positive `tabindex`
- [ ] Focus managed on route change / modal open & close
- [ ] Native semantics preferred over ARIA; icon-only controls named
- [ ] AA contrast met; meaning never by color alone; `prefers-reduced-motion` honored
- [ ] Verified with axe + a manual keyboard pass
- [ ] No hardcoded strings; full strings with named interpolation (no concatenation)
- [ ] Plurals, dates, numbers, currency handled via framework/`Intl`
- [ ] RTL + logical CSS properties where locales require it
