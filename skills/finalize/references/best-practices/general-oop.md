# General OOP & backend best-practices

Loaded in `/finalize` Phase 1 for any backend/business-logic change, regardless of language (a language-specific file may load alongside this one). Applies to the changed code in the diff, not the whole repo. Project conventions in CLAUDE.md always override these rules.

## Implementation guidelines

### SOLID, applied
Apply these pragmatically — they describe forces, not commandments.
- **Single responsibility**: a class or module should have one reason to change. When a class accumulates several reasons (formatting *and* persistence *and* validation), a change to one concern risks breaking the others. Keep classes small and focused.
- **Open/closed**: extend behavior by adding new types, not by editing a growing `switch`/`if-else` over a type tag. When you see a conditional that everyone has to touch each time a variant is added, that's the signal to reach for polymorphism or a strategy — the existing code stays closed to modification while the system stays open to extension.
- **Liskov substitution**: a subtype must honor the base contract — same preconditions (or weaker), same postconditions (or stronger), no surprise exceptions. If a subclass can't stand in for its parent without callers special-casing it, the inheritance is wrong; prefer composition.
- **Interface segregation**: keep interfaces narrow and role-based. Fat interfaces force implementers to stub methods they don't need and couple unrelated callers to one another. Split by the role each consumer actually uses.
- **Dependency inversion**: high-level policy should depend on abstractions, not on concrete low-level details. Depend on an interface so the concrete implementation can change (or be swapped in a test) without touching the policy.

### Dependencies & composition
- Inject dependencies through the constructor, against interfaces — not by reaching for singletons, globals, or `new`-ing collaborators inside a method. This keeps each unit decoupled and testable in isolation.
- Favor composition over inheritance. Inheritance is for a genuine, stable *is-a* relationship; most "reuse" is better served by holding a collaborator and delegating. Composition avoids the fragile-base-class problem and lets behavior vary at runtime.
- Program to interfaces so modules can evolve and be tested independently of each other's internals.

### Layering & boundaries
- Separate concerns into layers: transport/controller/handler → service/domain → repository/data-access. Each layer talks only to the one beneath it.
- Keep business logic out of controllers (they wire HTTP/CLI to the domain) and out of the data layer (it persists, it doesn't decide). Logic that drifts into either becomes untestable and hard to find.
- Validate and translate at boundaries: parse untrusted input into domain types on the way in, map domain types to DTOs on the way out.
- Don't leak persistence or transport types into the domain. If an ORM entity or an HTTP request object reaches the core logic, the domain is now coupled to a framework it shouldn't know about.

### Functions, methods & control flow
- Write small, single-purpose functions. A function that needs a "and" to describe it is doing two things.
- Prefer guard clauses and early returns over deep nesting — handle the edge/exit cases up front so the happy path reads top-to-bottom without an arrow of indentation.
- Avoid long parameter lists; when several params travel together they're usually a concept — group them into a value object or DTO. This also makes call sites self-documenting.
- No magic numbers or bare string literals with meaning — name them so the intent (and the place to change them) is explicit.
- Make illegal states unrepresentable where the language allows (sum types, non-nullable fields, smart constructors). A state that can't be constructed can't be a bug.

### Domain modeling
- Prefer rich, well-named domain types over passing primitives and raw maps/dicts around. `Money`, `EmailAddress`, and `UserId` carry meaning and validation that `string`/`decimal` don't — primitive obsession scatters the same checks across every caller.
- Keep invariants inside the object that owns them. The type that holds the data is the one place that can guarantee it's always valid; validation spread across callers will eventually miss a path.

### A note on balance
Don't over-engineer. Abstractions and patterns earn their place by removing real duplication or real change-risk that exists *now* — not by anticipating a future that may never arrive. An interface with a single implementation, a strategy with one strategy, or a layer that only forwards calls adds indirection without buying anything. This ties directly to the refactoring file's DRY-is-knowledge rule: introduce structure when two things genuinely share a concept and will change together, not because two things momentarily look alike.

## Anti-patterns
- **God class/service** — one type that knows and does everything; impossible to change safely or test.
- **Anemic domain with scattered logic** — data-only objects while the rules live spread across controllers; the model can't enforce its own invariants.
- **Deep inheritance hierarchies** — fragile base classes and behavior smeared across levels; prefer composition.
- **Primitive obsession** — meaning and validation encoded in bare strings/numbers instead of domain types.
- **Long parameter lists** — usually a hidden value object; also a sign a function does too much.
- **Magic numbers** — unexplained literals nobody dares change.
- **Business logic in the data-access or transport layer** — untestable, mislocated, and coupled to a framework.
- **Speculative abstractions** — interfaces, hooks, and config "for the future" with one caller today; pure cost, no payoff.

## Quick checklist
- [ ] Each changed class/module has a single clear responsibility
- [ ] New variants added via polymorphism/strategy, not a growing conditional
- [ ] Dependencies injected through the constructor against interfaces
- [ ] Composition preferred; inheritance only for genuine, stable is-a
- [ ] Business logic lives in the domain/service layer, not controllers or data access
- [ ] No persistence/transport types leaking into the domain
- [ ] Guard clauses over deep nesting; functions are small and single-purpose
- [ ] No long parameter lists (grouped into value objects/DTOs)
- [ ] No magic numbers; meaningful literals are named
- [ ] Domain concepts modeled as types, not primitives/raw maps; invariants owned by their type
- [ ] No speculative abstraction added without a present need
