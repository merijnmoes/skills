# Vue best-practices

Applies to the changed Vue 3 code in `/finalize` Phase 1 (the diff, not the whole repo). Project conventions in CLAUDE.md always override these rules.

## Implementation guidelines

### Architecture
- Default to Vue 3 + Composition API with `<script setup lang="ts">`. Use Options API only when the project already requires it.
- Keep a single source of truth — data flows props-down, events-up.
- Build small, focused components with self-documenting names and structure.

### Reactivity
- Keep source state minimal with `ref`/`reactive`; derive everything else with `computed` so it stays in sync automatically.
- Use `watch`/`watchEffect` only for genuine side effects (fetching, DOM, logging) — not for deriving values that `computed` should own.
- Never put expensive logic in templates — they re-run on every render.

### Single-file components
- Order blocks `<script>` → `<template>` → `<style>`.
- Keep templates declarative — move branching and computation into the script.
- Be careful with `v-html` — it bypasses escaping and is an XSS vector; always set a `:key` on `v-for`.

### Component splitting
Split a component when any objective trigger fires:
- It owns both state orchestration AND presentational markup.
- It has 3+ distinct UI sections.
- It contains repeatable blocks (extract the repeated unit).
Keep root/route-view components thin. A CRUD feature typically splits into container / form / list-item / footer-actions.

### Data flow
- Default to props-down / events-up.
- Use `v-model` only for genuine two-way contracts, not as a shortcut around explicit events.
- Use `provide`/`inject` only for deep trees, never as a general state bus.
- Type contracts explicitly with `defineProps` / `defineEmits` and `InjectionKey`.

### Composables
- Extract reused, stateful, or side-effect-heavy logic into composables with small, typed, predictable APIs — easier to test and reuse than inlined logic.
- patterns.dev treats composables as the **modern default** that supersedes older logic-reuse approaches (renderless components, data-provider components, HOC-style wrappers): reach for a composable before a renderless component or scoped-slot trick, which add an extra component instance for no gain here.

### Patterns (patterns.dev)
- **State management**: props/events for local state, a shared `reactive()` store for moderate needs, and **Pinia** once you need devtools, plugins, SSR, or typed cross-app state. Don't pull in a global store for state that two components could pass directly.
- **Provide/Inject is the Provider pattern**: use it for genuinely app-wide data (theme, locale, auth) to avoid prop-drilling; keep props when data should stay local and traceable.
- **Container/Presentational**: still valid for separating data/behavior from "how it looks", but a composable feeding a presentational component is usually simpler than a container component.
- **Dynamic components**: switch components at runtime with `<component :is="...">` (tabs, wizards) instead of a chain of `v-if`; wrap in `<KeepAlive>` to preserve state across switches.
- **Render functions** (`h()` / JSX): only for genuinely dynamic, programmatic markup — templates are clearer and the default everywhere else.

### Optional features
- Reach for slots, fallthrough attrs, `KeepAlive`, `Teleport`, `Suspense`, `Transition`, custom directives, and async components only when a real need exists — not speculatively.

### Performance
- Treat performance as a pass done AFTER functionality is correct, then: virtualize long lists, use `v-once`/`v-memo` for static/expensive subtrees, and avoid abstraction overhead in hot loops.
- **Async components** for code-splitting: load heavy or rarely-used components (modals, big features, route views) with `defineAsyncComponent(() => import('...'))`, and supply `loadingComponent`/`errorComponent` for the load/error states. See `javascript.md` for the broader code-splitting / lazy-loading patterns.

## Anti-patterns
- Heavy logic in templates — re-runs every render; move it to script/computed.
- Watchers deriving state that should be `computed` — extra code and stale-value bugs.
- Giant multi-responsibility components — hard to read, test, and reuse.
- Mutating props — breaks one-way data flow; emit an event instead.
- Overusing `provide`/`inject` — hidden coupling that's hard to trace.
- Premature performance micro-optimizations — adds complexity before there's a measured problem.

## Quick checklist
- [ ] `<script setup lang="ts">` used (unless project mandates Options API)
- [ ] Derived values use `computed`, not watchers
- [ ] `watch`/`watchEffect` reserved for real side effects
- [ ] Templates declarative; no expensive logic inline
- [ ] `props`/`emits` typed via `defineProps`/`defineEmits`
- [ ] No prop mutation; two-way only through deliberate `v-model`
- [ ] `v-for` keyed; `v-html` avoided or justified
- [ ] Components split per objective triggers; route views kept thin
- [ ] Reused/stateful logic extracted to typed composables (preferred over renderless/HOC)
- [ ] Heavy/rarely-used components code-split via `defineAsyncComponent` + `import()`
- [ ] Runtime component switching uses `<component :is>` (+ `KeepAlive`), not `v-if` chains
- [ ] Shared state scoped appropriately (local → props, app-wide → Pinia/provide-inject)
- [ ] Optional features and perf tuning added only when needed
