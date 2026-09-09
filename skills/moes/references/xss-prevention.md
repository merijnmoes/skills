# XSS prevention

Phase 4 support for `moes`, loaded via `security-cheat-sheets.md` when the diff renders HTML, handles rich text/markdown, builds URLs, or returns user-influenced content. Output-encoding half — input validation alone does not fix XSS.

## Trigger

Load when the diff touches: HTML/template rendering, `dangerouslySetInnerHTML` / `v-html` / `{@html}` / `| safe`, markdown-to-HTML, SVG upload, URL building from input (`href`, `src`, redirect `Location`), or JSON embedded in HTML.

## Rules

1. **Encode at the sink, per context.** HTML body, attribute, JS-string, URL, and CSS contexts need different encoding. Framework auto-escaping covers the default case only.
2. **Know your escape hatches (all blocking if fed untrusted input):** React `dangerouslySetInnerHTML`, Vue `v-html`, Svelte `{@html}`, Angular `[innerHTML]` (needs `DomSanitizer` + still review), Django `|safe` / `mark_safe`, Jinja `|safe`, Rails `html_safe` / `raw`.
3. **Markdown/HTML sanitization needs a real sanitizer** (DOMPurify, bleach with allow-list, Rails `sanitize`) — regex stripping is not a sanitizer.
4. **URLs are a sink.** `javascript:` / `data:text/html` in `href`/`src`/redirect targets = XSS. Validate scheme (`http/https` allow-list, relative-only where applicable) and never reflect raw input into redirect targets without validation (open-redirect → token theft).
5. **CSP is defense-in-depth, not a fix.** A missing CSP is hardening (`Plan`), an unsanitized sink fed user input is a defect (`Fix`).

## Examples

```tsx
// ❌ React — raw HTML from input
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
// ✅ sanitize first, or render as text
<div>{comment.body}</div>
```

```py
# ❌ Django — safe filter on user content
{{ user.bio|safe }}
# ✅ default escaping
{{ user.bio }}
```

```ts
// ❌ open redirect / javascript: URL
window.location.href = next;
// ✅ allow-list
const ok = next.startsWith("/") && !next.startsWith("//");
if (!ok) throw new Error("bad redirect");
```

## Detection notes

- Grep for `dangerouslySetInnerHTML|v-html|@html|innerHTML|\|safe|mark_safe|html_safe|\.raw\(|href.*\+|Location:` in the diff; trace each sink to untrusted input.
- Stored XSS counts: sanitizer must run on render *and* survive stored payloads — check both write and read paths.
- Findings must pass `findings-lifecycle.md`: quote sink line + input path + why auto-escaping does not cover it.
