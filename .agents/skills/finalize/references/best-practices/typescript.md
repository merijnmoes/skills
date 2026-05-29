# TypeScript best-practices

Applies to the changed TypeScript code in `/finalize` Phase 1 (the diff, not the whole repo). Project conventions in CLAUDE.md always override these rules.

## Implementation guidelines

### Naming
- PascalCase for classes, types, and interfaces; camelCase for variables and functions; UPPER_SNAKE_CASE for static/module constants.

### Functions
- Use arrow functions for callbacks and inline logic; use `function` declarations for top-level exports (hoisting, clearer stack traces).
- Always annotate the return type of public-API functions — don't rely on inference at module boundaries, where an accidental type change should be a compile error, not a silent ripple.

### Modules
- Use named exports only. They give better refactors, reliable auto-imports, and consistent import names across the codebase.
- No default exports.
- Order imports external → internal → relative (eslint-plugin-import).
- Use `import type` for type-only imports — zero runtime cost and better tree-shaking.

### Async
- Prefer `async`/`await` over `.then().catch()` chains for readability and easier error flow.
- Use `Promise.all()` for independent work that can run in parallel.
- Type `catch (e)` as `unknown` and narrow before use — caught values aren't guaranteed to be `Error`.

### Classes
- Mark members explicitly `private`/`protected`/`public`.
- Favor composition over inheritance.
- Inject dependencies through the constructor against interfaces rather than reaching for singletons — keeps units testable and decoupled.

### Type safety
- Enable and assume `strict` mode.
- Never use `any`. Reach for `unknown` + narrowing, or a precise type.
- Use `never` for exhaustiveness checks in `switch` / discriminated unions so a new variant fails to compile.
- Prefer discriminated unions + type guards over loosely-typed objects.

### Optional handling
- Use optional chaining `?.` and nullish coalescing `??` instead of manual `undefined`/`null` checks — and note `??` only falls back on null/undefined, unlike `||`.

### Boundary validation
- Validate untrusted input at runtime with Zod (or similar). TS types vanish at runtime, so external data must be checked, not just typed.

## Anti-patterns
- Default exports — inconsistent import names, worse refactors.
- Implicit or explicit `any` — erases type safety.
- Unused locals — dead code and noise.
- `require` instead of ES `import` — breaks tree-shaking and module consistency.
- Empty interfaces — they constrain nothing.
- Unsafe test mocks — cast via `jest.Mocked<T>` or `as unknown as T`, not raw `as`.
- Blanket `eslint-disable` — fix the cause instead of silencing the rule.
- Missing return types on exported functions — boundary types should be explicit.

## Quick checklist
- [ ] Public/exported functions have explicit return types
- [ ] No `any`; `unknown` + narrowing used where needed
- [ ] Named exports only (no default exports)
- [ ] `import type` used for type-only imports
- [ ] `catch` params typed `unknown` and narrowed
- [ ] Independent awaits parallelized with `Promise.all()`
- [ ] Exhaustive `switch`/unions guarded with `never`
- [ ] Untrusted input validated at runtime (Zod or similar)
- [ ] No unused locals, no `require`, no blanket `eslint-disable`
