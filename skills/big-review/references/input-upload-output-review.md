# Input, upload, and output review

Phase 4 support for `big-review`, conditional. Apply when the diff accepts untrusted input, parses files, builds commands/queries/URLs, renders rich output, redirects users, or handles uploads/downloads.

## What to check

- **Input validation** — untrusted input is validated for shape, range, encoding, and semantics at the boundary, not only deeper in the stack.
- **Injection** — SQL, shell, template, path, and query builders use safe APIs rather than string concatenation or interpolation.
- **Upload safety** — file type, size, count, storage path, and executable handling are bounded; user-controlled names cannot escape intended directories.
- **Parsing / deserialization** — file parsers, YAML/JSON/XML deserializers, and archive extractors are safe for untrusted content.
- **Rendered output** — HTML/Markdown/template output is escaped or sanitized correctly for its sink.
- **Redirects and URLs** — redirect targets and fetch URLs are validated; internal or privileged destinations are not attacker-controlled.
- **Download safety** — response headers, content type, and filename handling do not create active-content surprises or path issues.

## Concrete prompts

- Where does this input first enter trusted code, and what validates it there?
- Is any untrusted string later used in SQL, shell, HTML, path, or URL construction?
- If the uploaded file is large, malformed, nested, compressed, or misleadingly named, what happens?
- What exact sink receives this output: HTML, shell, SQL, filesystem, redirect, or outbound fetch?

## Common blockers

- Path built from user input without normalization and allowlisting.
- HTML or Markdown rendered into the page without safe sanitization/escaping.
- File upload accepted based only on filename or client-provided MIME type.
- Shell or SQL built by interpolation from request parameters.

## Output

Fold findings into the Phase-4 punch list with the exact input shape and sink that makes the issue real.
