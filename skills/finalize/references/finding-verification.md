# Finding verification

Used wherever `/finalize` produces findings that could gate the verdict — Phase 4 (Audit consolidation) and Phase 7 (Validation gate). A review that reports every suspicion erodes its own authority: the user stops trusting the punch list and starts re-checking each item by hand, which defeats the point of running the gate. This reference is the discipline that keeps the blocking list *small and true* — a finding earns the right to block only by surviving challenge.

The model is adversarial, borrowed from a hunter→skeptic→referee pipeline but collapsed into one disciplined pass: you raise the finding (hunter), then you try to *disprove your own finding* (skeptic) before you let it stand (referee). Be your own skeptic.

## The trigger test (the core rule)

Before a finding is marked **blocking**, state a concrete, reachable trigger: a specific input or scenario that produces the wrong behavior, and the path by which untrusted/real data reaches it.

- **Concrete trigger exists and is reachable** → it can block. Record the trigger with the finding so the user can reproduce it.
- **No trigger you can state** → it is not blocking. Demote it to a non-blocking observation ("worth a look") or drop it. "This feels fragile" without a reproduction is a hunch, not a defect.
- **Trigger requires impossible or self-contradictory preconditions** → drop it. A bug that can't be reached isn't one.
- **Trigger is reachable only under unusual, low-likelihood conditions** → keep it, but rate it low severity; don't let it gate shipping on its own.

This applies to *every* lane — correctness, security, structural, spec. A "missing requirement" needs the spec line it violates; a "race condition" needs the interleaving; a "structural regression" needs the concrete maintenance hazard it creates, not just an aesthetic objection.

## Known false-positive classes (auto-downgrade)

These recur as false alarms. When a finding matches one, downgrade it from blocking unless there is *specific* evidence the general protection is absent or bypassed here. Don't re-litigate each from scratch — name the rule and move on.

- **Framework already handles it** — "missing CSRF / escaping / parameterization / validation" when the framework or an ORM/schema layer (e.g. an ORM's parameterized queries, an auto-escaping template engine, a `zod`/`pydantic`/`joi` schema, framework CSRF middleware) provides it. *Verify the protection is actually wired up before dismissing — see below.*
- **Auth enforced elsewhere** — "missing authorization" on a handler that sits behind auth middleware or a gateway; "client-side-only check" when the server also enforces it.
- **Runtime/language guarantee** — "race condition" in genuinely single-threaded code with no async interleaving on the shared state; "null deref" on a value the type system already narrowed; "overflow" in an arbitrary-precision numeric type; "buffer overflow" in a memory-safe language.
- **Trusted input treated as untrusted** — environment variables, CLI flags, and committed config are trusted by definition; opaque IDs (UUID/ULID/CUID) are not "guessable" in the enumeration sense.
- **Informational, not a runtime defect** — missing rate limiting, missing audit logging, log verbosity, DoS/resource-exhaustion with no demonstrated amplification or external path. Note them; don't block on them.
- **Test-only / fixture** — behavior reported only in test files, or a "hardcoded secret" that is a public key or test fixture.

This list downgrades; it never *upgrades*. A finding that escapes every exclusion still has to pass the trigger test.

## Verify framework/library claims before they decide a finding

If the *existence* or *dismissal* of a finding hinges on how a library or framework behaves — "the ORM parameterizes this", "this decorator already validates", "this API throws on failure" — verify it against current docs rather than memory. Training data drifts and APIs change. If a documentation MCP such as **Context7** is available, resolve the library and query the specific behavior; otherwise say you couldn't verify and lower your confidence accordingly. An unverified framework assumption is a gamble in both directions: it can wave through a real bug or block on an imagined one.

## Label every surviving finding

Attach to each finding that reaches the report:
- **Severity** — Critical / High / Medium / Low, by impact (see the validation gate's calibration).
- **Confidence** — High / Medium / Low, your certainty it is real after the challenge. A low-confidence finding may still be worth surfacing, but it should not *block* on its own.
- **Reachability** (for anything input-driven) — external / authenticated / internal / unreachable. External + easy trigger is what makes something urgent; unreachable shouldn't be a confirmed defect at all.

## The bias to encode

When you're genuinely unsure whether something is real, **say so with low confidence rather than dropping it silently or inflating it to blocking.** The asymmetry to respect: wrongly blocking a good change wastes the user's time now and trains them to ignore the gate; wrongly clearing a real defect ships a bug. Neither is free. The trigger test and the exclusion list exist to resolve most uncertainty with evidence; for what remains, surface it honestly at the confidence it deserves and let the verdict reflect that.
