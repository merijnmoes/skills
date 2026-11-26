# Performance specialty router

Load this when the changed surface is performance-sensitive and generic
profiling guidance needs ecosystem detail.

This router does not repeat the measure-first guidance from
`performance-profiling.md`; it only hands off to narrower references when the
changed hotspot needs stack-specific interpretation.

## Local/free QA tools

For QA, Lighthouse and k6 are optional local/free capabilities, not
universal requirements. Use Lighthouse for web UI load/render/accessibility/SEO
signals when the diff affects those surfaces. Use k6 for load-sensitive API or
backend flows only when targets, thresholds, and environment are explicit.

## Suggested routes

- **Web perf / Core Web Vitals** — when the change affects first paint,
  interaction latency, or layout stability in the browser.
- **Runtime or memory analysis** — when the hotspot is CPU, async throughput,
  object retention, or leak behavior.
- **Bundle-size and render-path guidance** — when the regression is client
  payload, hydration, rerender churn, or list/render-path cost.
- **Niche stack refs only when the surface explicitly matches**
