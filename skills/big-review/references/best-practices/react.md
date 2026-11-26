# React best-practices

Loaded in `big-review` Phase 1 when the diff touches React files or a React app (`.jsx`, `.tsx`, React in deps, client components, hooks). Applies to the changed React code in the diff, not the whole app. Layers on top of `javascript.md`, `typescript.md`, and `frontend-a11y-i18n.md` where relevant. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Hooks and state
- Hooks must be called unconditionally at component top level. No hooks in branches, loops, nested helpers, or callbacks.
- Do not use `useEffect` for synchronous derived state when render-time computation, `useMemo`, or a selector would do. An effect that only copies props into state is usually a smell.
- Avoid storing redundant state. Prefer the smallest state model that makes invalid UI states hard to represent.
- When an update is non-urgent and may cause visible work, consider `startTransition`; when a value should lag a fast-changing input, consider `useDeferredValue` if the project already uses those patterns or the interaction clearly benefits.
- Do not mutate props, cached query results, or shared objects in place.

## Effects and async work
- Every effect must justify itself: syncing to the outside world, subscribing, measuring, imperative bridge code, or async fetch orchestration. If it is not doing one of those, it probably should not be an effect.
- Effect dependencies must match the values actually read. Missing dependencies create stale behavior; unnecessary dependencies create loops and churn.
- Async effects must handle cancellation, staleness, or teardown correctly. Do not let slower responses overwrite newer intent.
- Prefer `useEffectEvent` for event-like logic captured by an effect when the project/runtime supports it; otherwise isolate the unstable callback carefully instead of suppressing dependency warnings.

```tsx
// Bad: derived state copied through an effect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${user.firstName} ${user.lastName}`);
}, [user]);

// Good: derive during render
const fullName = `${user.firstName} ${user.lastName}`;
```

```tsx
// Bad: slower stale request can win
useEffect(() => {
  fetch(`/api/users/${userId}`).then((r) => r.json()).then(setUser);
}, [userId]);

// Good: ignore stale work on cleanup
useEffect(() => {
  let cancelled = false;
  fetch(`/api/users/${userId}`)
    .then((r) => r.json())
    .then((nextUser) => {
      if (!cancelled) setUser(nextUser);
    });
  return () => {
    cancelled = true;
  };
}, [userId]);
```

## Component structure
- Keep components focused. If a component is mixing data fetching, orchestration, rendering branches, and business rules, split by responsibility.
- Do not define components inside components unless the project explicitly prefers that pattern and remount behavior is intentional.
- Prefer clear props over "bag of options" objects unless the prop shape is genuinely shared and stable.
- Keep feature-specific logic out of shared layout or primitive components; push it outward or behind a dedicated hook/helper.

## Composition and boundaries
- Prefer composition over prop bags and feature-flag-heavy shared components.
  If a "reusable" component keeps accumulating workflow-specific switches, the
  boundary is wrong.
- Keep shared primitives and headless pieces free of feature workflow leakage.
  Reusable building blocks should not need to know which product flow invoked
  them.
- Split orchestration from presentation when it clarifies ownership, but do not
  extract components that add only another indirection hop.
- Prefer explicit ownership of derived values and transient UI state. If two
  components both need the same truth, make the owner obvious instead of
  copying it around.
- Treat server/client and async/render boundaries as composition concerns, not
  just syntax constraints. A boundary that forces a large subtree client-side
  or mixes loading concerns into shared UI is usually worth revisiting.

## Rendering and boundaries
- Preserve server/client boundaries. Do not pull client-only hooks or browser APIs into server-rendered modules.
- Wrap Suspenseful or failure-prone async UI in meaningful loading and error states.
- Lists need stable keys from domain identity, not array indexes when reorder/delete/insert can happen.
- Avoid accidental rerender churn from recreated objects/functions only when it materially affects behavior or memoized children. Do not cargo-cult `useMemo`/`useCallback`.

## Forms, actions, and data
- Keep form validation and submission states explicit. Do not let optimistic UI hide irreversible failures.
- For query/mutation libraries, ensure query keys include real inputs, mutations invalidate or update the right caches, and optimistic flows have rollback paths.
- Separate transport shapes from UI/domain shapes when the raw API object leaks backend details into the tree.

## Red flags to look for
- Effects mirroring props into state.
- Fetching/mutation logic that has no stale-response or rollback story.
- A parent `"use client"` boundary pulling a large subtree client-side without a clear need.
- Shared presentational components branching on feature-specific workflow rules.
- Headless or primitive components taking workflow-specific props just to serve
  one feature path.
- Component extraction that spreads one responsibility across more files without
  making ownership clearer.
- Query keys or memo dependencies that omit the value actually controlling the result.

## Anti-patterns
- Hooks in branches or callbacks.
- Effects used as event handlers or derived-state synchronizers.
- Blanket memoization without evidence.
- Client-only code leaking into server components.
- Index keys on dynamic lists.
- "Reusable" components built around prop soup and boolean feature switches.
- Shared mutable state passed through props/context without a clear ownership model.

## Quick checklist
- [ ] Hooks only at top level; no conditional hook calls
- [ ] Effects are for external sync, not redundant derived state
- [ ] Effect dependencies and async cancellation/staleness handling are correct
- [ ] Component responsibilities are focused; feature logic is not leaking into shared primitives
- [ ] Composition boundaries clarify ownership instead of spreading workflow logic across shared components
- [ ] Server/client, loading, and error boundaries are respected
- [ ] Query keys, cache invalidation, and optimistic rollback paths are correct when applicable
- [ ] Stable keys and explicit state ownership preserve predictable rendering
