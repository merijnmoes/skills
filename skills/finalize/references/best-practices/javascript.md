# JavaScript best-practices

Applies to the changed JavaScript code in `/finalize` Phase 1 (the diff, not the whole repo). For TypeScript *type* idioms see `typescript.md`; for SOLID/composition/layering see `general-oop.md`; for UI accessibility & i18n see `frontend-a11y-i18n.md`. The pattern catalogues below are distilled from patterns.dev. Project conventions in CLAUDE.md always override these rules.

## Core language hygiene
- `const` by default, `let` when reassigned, never `var` (function-scoped, hoisted — a footgun).
- Strict equality `===`/`!==` only; `==` has surprising coercion.
- Prefer immutable updates (spread, `map`/`filter`/`reduce`) over mutating shared objects/arrays in place — mutation causes spooky action at a distance.
- ES modules with **named exports** (consistent names, better tree-shaking); avoid default exports.
- `async`/`await` over callback nesting; run independent awaits with `Promise.all`. Never leave a **floating promise** — `await` it or explicitly handle rejection, or errors vanish silently.
- Optional chaining `?.` and nullish coalescing `??` over manual `&&`/`||` guards (`??` only falls back on null/undefined).

## Design patterns — a vocabulary, not a mandate
Use these to *recognize* what the changed code is reaching for and judge whether a named pattern would read clearer. Reach for one only to solve a real, present problem — imposing a pattern speculatively is the over-engineering `general-oop.md` warns against.

- **Module** — a file encapsulating its own scope, exposing an explicit API. The default unit of encapsulation in JS; use it for native privacy instead of hand-rolled closures.
- **Singleton** — one shared instance app-wide (DB pool, socket, flag client). Caveat: an ES module is already evaluated once, so a module-scoped value usually beats a hand-built singleton.
- **Factory** — a function that builds and returns objects without `new`. Use to capture config, return different shapes by input, or inject dependencies for testability.
- **Observer** — a subject notifies a list of subscribers on change. Use when several decoupled consumers must react to the same repeated event without the source knowing them.
- **Proxy** — intercepts property access/mutation. Use for validation, formatting, or logging without touching the target.
- **Mediator** — a central coordinator components talk *through*, cutting N×N coupling to N. Use with 3+ interacting parts and non-trivial wiring.
- **Mixin** — folds orthogonal behavior into a class without inheritance. Use sparingly (logging, serialization); modern code prefers composition/utility modules.
- **Flyweight** — share intrinsic state across many similar objects to cut memory. Use when rendering huge counts (virtualized lists, canvas loops) or when construction is expensive.
- **Prototype** — share behavior via the prototype chain / cloning. Use to reuse behavior across many similar objects.

## Performance patterns — the most actionable for frontend diffs
- **Bundle & code splitting**: keep only render-critical code in the main bundle; split the rest into chunks loaded on demand. Check a large new feature isn't bloating the entry bundle.
- **Dynamic `import()`**: defer genuinely-optional modules (modals, editors, heavy libs) until needed; give them a loading/error state.
- **Route-based splitting**: lazy-load per-route bundles (`React.lazy`/`defineAsyncComponent` + Suspense/fallback) so a route only ships its own code.
- **Static vs dynamic imports**: for each new import, ask whether it's needed at startup or should load on interaction/visibility.
- **Import on interaction / on visibility**: load a feature's code on first click/hover, or when it scrolls into view (`IntersectionObserver`) — not at page load.
- **Tree shaking**: use ES `import`/`export`, import only what you use, and keep `"sideEffects"` accurate in `package.json` so dead code is dropped.
- **Preload vs prefetch**: `<link rel="preload">` for assets needed within ~1s of first paint (use sparingly); `<link rel="prefetch">` for likely-next-route assets during idle. Don't preload everything — it competes with critical resources.
- **List virtualization**: render only viewport-visible rows of long lists instead of thousands of DOM nodes.
- **Minify & compress**: ensure production minification (Terser) and Brotli/Gzip; watch that excessive chunking doesn't hurt compression.

## Rendering patterns — architectural vocabulary
Mostly app-architecture decisions rather than per-line checks, but useful to name: **CSR** (client builds UI; slow first paint), **SSR** (HTML per request; better first paint/SEO), **SSG** (HTML at build time; fast/cheap, same for all), **ISR** (refresh static pages without full rebuild), **streaming SSR** (flush shell first, stream the rest), **progressive hydration** (hydrate in pieces), **islands** (hydrate only interactive regions), **React Server Components** (server-only components ship no client JS).

## Anti-patterns
- `var`; loose `==`; mutating shared state in place.
- Default exports; importing whole libraries for one helper (defeats tree shaking).
- Floating promises (unawaited, unhandled) — silent failures.
- Speculative pattern/abstraction with one caller — indirection without payoff.
- Everything in one bundle; heavy optional features imported statically at startup.
- Preloading everything (starves the critical path); huge un-virtualized lists.

## Quick checklist
- [ ] `const`/`let` only (no `var`); strict `===`; no in-place mutation of shared data
- [ ] Named ES exports; no default exports; imports are tree-shakeable (no unused members)
- [ ] No floating promises; independent awaits parallelized with `Promise.all`
- [ ] Heavy/optional code is code-split (dynamic `import()` / route or interaction/visibility loading) with loading states
- [ ] Long lists virtualized; `preload`/`prefetch` used deliberately, not blanket
- [ ] Any design pattern introduced solves a present problem (not speculative)
- [ ] Production build minified and compressed (Brotli/Gzip)
