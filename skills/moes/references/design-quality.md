# Design quality review

Used in `moes` Phases 4, 7, and 8. This reference turns design principles
into diff-scoped review practice. It is not a broad architecture audit and not a
license to rewrite working code because another shape is imaginable.

The goal is to produce compact `Design Quality Notes`: evidence-backed notes
about design strengths worth preserving and design risks worth fixing,
deferring, or surfacing. Use this lens only where it explains the current diff
better than generic correctness, security, or style review.

## Source lenses

Use these as thinking tools, not authority:

- John Ousterhout's *A Philosophy of Software Design*: complexity is anything
  that makes software hard to understand or modify. Look for change
  amplification, cognitive load, unknown unknowns, information hiding, deep
  modules, shallow modules, tactical programming, and strategic programming.
- SOLID and clean architecture: translate the label into the actual mechanism
  in this codebase. Do not say "good dependency inversion" without explaining
  what concrete detail is now hidden behind which stable interface.
- Project conventions: the repository's existing boundaries and domain language
  outrank generic advice.

## Mechanism-level probes

Ask these about the changed code:

- What knowledge did the diff hide, expose, duplicate, or scatter?
- What must a caller know now to use the changed module correctly: types,
  ordering, invariants, errors, config, performance, or side effects? Name the
  specific interface fact that leaked or grew (type / invariant / ordering /
  error mode / config / performance) — findings must cite it, not just "interface grew".
- Did the interface become deeper by hiding meaningful implementation detail
  behind a smaller surface, or shallower by adding pass-through ceremony?
- Did the change reduce cognitive load, or did it move complexity to another
  caller, test, config file, or runtime convention?
- Did it reduce or increase change amplification: how many places must change
  for the next likely variant?
- Did it improve locality so related decisions, bugs, and verification stay in
  one coherent module?
- Did it reduce unknown unknowns by naming invariants, making states explicit,
  or adding tests that document behavior?
- Is the change strategic simplification, or tactical patching that solves
  today's request while making the next change harder?

## Pattern Fit

Use Pattern Fit when the diff exposes a recurring design problem, a likely
change point, or a half-formed pattern that could be made clearer. The job is
not to find a pattern for every change; it is to decide whether a known pattern
would make this code deeper, more local, easier to extend, or easier to reason
about.

Source lenses:

- Use Patterns.dev for frontend, web-app, JavaScript, React, Vue, rendering, and
  performance patterns. Treat it as especially strong for web architecture,
  component structure, rendering strategy, loading, splitting, and performance
  trade-offs.
- Use broader architecture and design patterns where relevant, including
  Strategy, Adapter, Repository, Factory, Observer, Provider, Command, Unit of
  Work, CQRS, state machines, ports/adapters, and composition-oriented
  patterns.
- Use project conventions first. A pattern recommendation must not introduce a
  second competing way to solve a problem the repo already solves consistently.

Ask:

- What recurring design problem or likely change point does this diff expose?
- Is the code already half-implementing a known pattern without naming or
  completing it?
- Would a pattern make the module deeper, improve locality, reduce coupling, or
  reduce change amplification?
- Would the pattern add ceremony without hiding real complexity?
- Does the pattern match the stack and the codebase's existing conventions?
- What trade-off does the pattern introduce?
- When would this recommendation become over-engineering?

Pattern recommendations must be mechanism-level, not label-level. A useful note
explains:

- pattern name and source lens when helpful;
- problem in the diff;
- why the pattern fits this problem;
- how it changes coupling, knowledge hiding, interface depth, locality, or
  change amplification;
- trade-off or drawback;
- when not to apply it;
- a simpler alternative if the pattern is not worth its cost.

Positive Pattern Fit notes are allowed when the diff already uses a pattern
well. Explain why the pattern is appropriate here, not just that the pattern is
present.

Reject:

- pattern shopping: recommending a pattern because it is recognizable rather
  than because it solves this diff's problem;
- generic advice such as "use Strategy" or "this is clean architecture" without
  a mechanism;
- pattern recommendations that ignore existing project conventions;
- broad rewrites during final hardening;
- treating Patterns.dev as universal authority outside its strongest web,
  frontend, rendering, and performance context;
- pattern-shaped ceremony that adds indirection without hiding complexity.

## Positive design notes

Emit a positive `Design Quality Notes` item only for meaningful examples. A
meaningful example:

- names a specific changed surface;
- explains the mechanism that reduces complexity, risk, or future work;
- states the trade-off, drawback, or when not to apply the advice;
- gives the user a pattern worth preserving or repeating.

Do not emit generic praise, morale filler, or a default "what went right"
section. If no meaningful examples exist, record no positive note and the final
report section must be omitted.

Good shape:

- Surface: `PaymentWebhookHandler`
- Principle: information hiding / deep module
- Evidence: the handler now delegates signature parsing and timestamp tolerance
  to `WebhookVerifier.verify(request)`.
- Mechanism: callers no longer need to know the header names, clock skew rule,
  or HMAC comparison detail; those invariants stay local to one verifier.
- Trade-off: the verifier is worth keeping only while it hides those details; a
  one-line pass-through wrapper would be shallow.
- Disposition: report

Bad shape:

- "Nice clean architecture."
- "Good SOLID."
- "This follows Ousterhout."

## Design risk notes

Emit a design risk only when the diff creates or exposes a concrete future bug,
maintenance hazard, or delivery risk:

- A shallow wrapper adds interface surface without hiding complexity.
- Feature-specific logic leaks into a general module.
- Knowledge duplication means a future rule change must be made in several
  places.
- A boundary leak makes high-level policy depend on transport, framework, ORM,
  or vendor details.
- A tactical patch increases the number of files that must change for the next
  likely variant.

If the risk is localized, safe, and verifiable, convert it into a normal
finding with `Fix`. If the risk is real but broader than final hardening,
classify it as `Plan`, `Investigate`, or `Decide` through
`findings-lifecycle.md`.

Do not block on aesthetics. A design-quality blocker needs the concrete
maintenance hazard it creates for this change, not a preferred architecture
style.

## Red-team presumption (quality lanes)

Assume the change degrades the design and attempt to prove it, staying within diff scope and the mechanism bar above: no taste-hunting, no broad audits, no scope expansion.
When the case cannot be sustained, record the strongest unsustained critique as a Design Quality Note with disposition drop, with cross-pointers instead of duplicates (one steelman per unique mechanism).
Steelmans never go through sharded verification; mechanism-complete ones project into the dismissed ledger behind ex-blocking dropped items.
Link each steelman to its mechanism with a steelmanOf pointer.

## Artifact schema

Each `Design Quality Notes` item should carry:

- kind: `strength` or `risk`
- surface: file, module, function, command, or behavior area
- principle: the lens in play; for pattern guidance use
  `Pattern Fit / <pattern name>`
- evidence: what the diff actually did
- mechanism: how complexity, knowledge, coupling, locality, or change
  amplification changed — including which interface fact (type / invariant /
  ordering / error mode / config / performance) the caller must now know
- trade-off: cost, drawback, or when not to apply this advice
- disposition: `report`, `finding`, `defer`, or `drop`

Phase 7 should carry `report`, `finding`, and meaningful `defer` items into the
`Decision Packet`. Phase 8 should summarize them under Learning notes, Findings,
or an optional "What went right" section depending on disposition and kind.

## Q2 altitude (Phase 4 fan-out)

In the parallel fan-out, this file owns the **Q2 altitude** lane: is the fix
at the right depth, or a bandaid on shared infrastructure, a downstream
compensation for an upstream bug, or an abstraction serving one call site.
Reuse/duplication (Q1) and consistency/clarity (Q3) belong to
`codebase-fit.md` — do not re-walk them. Altitude findings need the same
mechanism-level evidence as any design risk: what the right layer would be,
why this depth is wrong for it, and the trade-off of moving it.

Testability pre-check (apply to changed modules before judging depth):

- **Accept dependencies, don't create them** — `processOrder(order, paymentGateway)` tests clean; `processOrder(order) { const gateway = new StripeGateway(); }` does not.
- **Return results, don't produce side effects** — `calculateDiscount(cart): Discount` tests clean; `applyDiscount(cart): void { cart.total -= discount; }` does not.
- **Small surface area** — fewer methods = fewer tests needed; fewer params = simpler setup. Ask the deepening questions: fewer methods? simpler params? more complexity hidden?
