---
name: engineering-principles
description: Apply these engineering principles when exploring a codebase, reasoning about requirements, designing solutions, writing or modifying code, debugging, refactoring, and reviewing changes. Use throughout software development, not only when explicitly asked for a code review.
user-invocable: true
disable-model-invocation: false
---

# Engineering Principles

Use these principles as your default engineering mindset. They should influence decisions throughout development, not become a checklist that must be mechanically completed for every task.

The goal is to produce software that is correct, understandable, maintainable and appropriately simple.

## 1. Laziness Protocol

Prefer the solution that achieves the desired outcome with the least unnecessary work and complexity.

- Reuse existing functionality, conventions and abstractions before introducing new ones.
- Avoid unnecessary dependencies, configuration, files, abstractions and indirection.
- Don't generalise a solution for hypothetical future requirements.
- Don't introduce frameworks or patterns when a straightforward implementation is sufficient.
- Avoid changing unrelated code just because it could be improved.
- Prefer a small, complete solution over a large, elaborate one.

Being lazy does not mean taking shortcuts that compromise correctness. It means avoiding work that doesn't create value.

## 2. Foundational Thinking

Understand the problem before choosing a solution.

- Investigate how the relevant part of the application currently works.
- Understand the underlying data, business rules, constraints and dependencies.
- Follow existing behaviour through the relevant layers instead of reasoning from a single function or component.
- Distinguish the actual problem from its symptoms.
- Question whether the proposed approach is the simplest way to achieve the intended outcome.
- Don't assume a familiar pattern is appropriate merely because it worked elsewhere.

When uncertain, investigate rather than inventing assumptions.

## 3. Attack the Premise

Treat requirements and proposed solutions as things that can be questioned.

- Identify ambiguous, contradictory or unnecessary requirements.
- Challenge assumptions that could lead to incorrect or unnecessarily complicated implementations.
- Point out when the requested approach introduces avoidable technical debt.
- Consider whether an existing feature or behaviour already solves the problem.
- Ask for clarification when an unresolved decision materially affects correctness or the user experience.

Don't blindly implement a flawed premise. Explain the concern and suggest a better alternative. Don't manufacture objections when the request is already clear and reasonable.

## 4. Subtract Before Adding

Before introducing something new, consider whether the existing system can be simplified instead.

- Look for redundant logic, duplicated state and unnecessary layers.
- Prefer extending or improving an existing abstraction over creating a competing one.
- Remove obsolete code when it is made redundant by the change.
- Avoid maintaining two ways of doing the same thing.
- Preserve existing behaviour unless changing it is intentional.

Do not perform unrelated cleanup or broad refactoring under the guise of simplification.

## 5. Minimize Reader Load

Optimize code for the next developer who needs to understand it.

- Prefer clear names and straightforward control flow.
- Make important assumptions and business rules explicit.
- Avoid clever tricks, unnecessary nesting and excessive indirection.
- Keep functions and components focused.
- Follow established project conventions unless there is a compelling reason to improve them.
- Add comments to explain non-obvious reasoning, constraints or intent, not to narrate obvious code.
- Avoid unnecessary documentation that merely restates the implementation.

Readable code is usually more valuable than code that is superficially concise or impressive.

## 6. Fix Root Causes

Solve the underlying problem rather than masking its symptoms.

- Trace unexpected behaviour to its actual source.
- Understand why a failure occurs before applying a fix.
- Avoid special cases, fallbacks or defensive code that merely conceal incorrect behaviour.
- Don't suppress errors or weaken validation to make a problem disappear.
- Consider downstream effects before changing shared logic.
- Prefer addressing an invariant at its source rather than compensating for it in multiple places.

A workaround is acceptable only when the underlying cause cannot reasonably be fixed, and its limitations are understood.

## 7. Prove It Works

Treat implementation and verification as separate responsibilities.

- Never assume code works simply because it looks correct.
- Establish what observable behaviour should change and what must remain unchanged.
- Prefer independently established expectations over assumptions derived from the implementation itself.
- Investigate failures instead of immediately changing tests or expectations.
- Distinguish verified behaviour from plausible but untested behaviour.
- Be explicit about limitations, unavailable test environments and remaining uncertainty.

Follow the repository's existing testing and verification requirements. Do not invent a parallel verification process when the project already defines one.

## 8. Test Behaviour, Not Implementation

Tests should protect meaningful application behaviour.

- Test externally observable outcomes and important invariants.
- Avoid coupling tests unnecessarily to internal implementation details.
- Cover normal use, relevant boundaries, unexpected inputs and failure behaviour.
- Prefer realistic scenarios over excessive mocking.
- Make tests deterministic and independently understandable.
- Ensure tests would detect the class of regression they are intended to prevent.

A passing test is only useful when it meaningfully demonstrates the expected behaviour.

## 9. Minimize Blast Radius

Make changes that are as local and predictable as possible.

- Understand which consumers and dependent systems could be affected.
- Prefer targeted changes over broad rewrites.
- Be particularly careful with shared abstractions, public interfaces, persisted data and business-critical calculations.
- Preserve compatibility unless a breaking change is intentional.
- Consider migrations, imports, exports, caching and other downstream effects where relevant.

The scope of verification should reflect the potential impact of the change, not merely the number of files modified.

## 10. Encode Lessons in Structure

When a mistake reveals a missing safeguard, consider whether the system can prevent it from recurring.

- Prefer automated checks over relying on memory.
- Put reusable conventions in the appropriate project documentation or configuration.
- Add tests for important invariants.
- Improve existing tooling when it can prevent recurring mistakes.
- Avoid introducing process or tooling for a one-off problem.

The best process improvement is often a small structural change that makes the correct behaviour the natural default.




# Applying These Principles

Use judgement rather than treating these principles as a rigid sequence.

For a small, straightforward change, apply them implicitly and get the work done.

For larger or ambiguous changes:

1. Understand the existing system and the actual problem.
2. Challenge questionable assumptions.
3. Identify the simplest appropriate solution.
4. Consider downstream effects and existing conventions.
5. Implement with clarity and minimal unnecessary complexity.
6. Verify the resulting behaviour using the project's established procedures.
7. Explain important decisions, trade-offs and remaining uncertainty.

When principles conflict, prioritize correctness, user intent and maintainability over superficial simplicity.

**The standard:** Make the smallest change that correctly solves the real problem, is easy to understand, and can be demonstrated to work.

## Applying design heuristics

Use familiar principles as questions that help choose a design, not as rules to satisfy mechanically. The project's conventions, the actual requirements, and the simplest correct solution take precedence.

- **KISS and YAGNI:** Prefer the least complex design that handles today's requirements and evidenced edge cases. Do not add generality, extension points, or configuration solely for hypothetical future needs.
- **DRY:** Share knowledge that represents the same concept and must evolve together. Similar-looking code may have different reasons to change; keeping it separate can be clearer and safer than forcing it behind a generic helper.
- **SOLID, selectively:** Keep responsibilities cohesive when they have distinct reasons to change; use clear, small interfaces when callers need different capabilities; preserve substitutability where real subtypes exist; and invert dependencies at meaningful boundaries such as volatile or external systems. Do not add interfaces, wrappers, or layers just to follow a letter of SOLID.
- **Look for structural simplification:** For a meaningful change, ask whether the same behavior can be expressed with fewer concepts, branches, flags, or indirection. Keep feature logic in the module that owns it; prefer explicit contracts over casts or fallbacks that hide uncertainty; and avoid partial updates when an atomic operation is practical. Treat these as prompts to investigate, not defects by themselves.
- **Treat complexity signals as evidence to examine:** New special cases in a busy flow, pass-through abstractions, unnecessary serialization, or pushing a file past roughly 1,000 lines may indicate a better structure. None is an automatic violation; identify the concrete cost and a proportionate remedy before changing or flagging it.
