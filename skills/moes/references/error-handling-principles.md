# Error-handling principles

Phase 1 / Phase 4 companion to `error-handling-review.md` (the lane). This file is the cross-language pattern catalog — the lane owns verdicts, this file owns *how the code should look*.

## Principles with patterns

1. **Fail fast with actionable messages.** Say what was wrong + how to fix. No silent `None`/`false` sentinels where an exception belongs.
2. **Catch specific, narrow, late.** Catch at the layer that can act; let the rest propagate. Bare `except:` / empty `catch {}` / `.catch(() => {})` that swallows is a defect.
3. **Retry only idempotent work, with a key + backoff + cap.** Retry needs: dedupe key or guard, exponential backoff with jitter, max attempts, dead-letter/quarantine path. Retry on non-idempotent side effects without a key = blocker.
4. **Compensate partial failure.** Multi-step flows: rollback, compensate, or bound the orphan explicitly. No stuck in-between states without a cleanup path.
5. **Degrade predictably; diagnose observably.** User sees actionable scope (not internals); operator sees replay/quarantine signal. Swallowed exception + vague log = finding.

## Examples

```python
# ❌ bare catch, silent
try: charge(user)
except: pass
# ✅ specific + compensation
try: charge(user)
except PaymentError as e:
    order.mark_payment_failed(str(e))
    raise
```

```ts
// ❌ unguarded retry on non-idempotent POST
for (let i = 0; i < 5; i++) await fetch("/orders", { method: "POST", body });
// ✅ idempotency key + backoff + cap
await postWithRetry("/orders", body, { key: orderKey, attempts: 3, backoff: true });
```

```php
// ❌ generic catch-all hides bugs
try { $this->charge($user); } catch (\Exception $e) {}
// ✅ narrow + rethrow unknown
try { $this->charge($user); } catch (PaymentException $e) { $order->fail($e->getMessage()); throw $e; }
```

```go
// ❌ ignored error
_ = db.Save(order)
// ✅ handled
if err := db.Save(order); err != nil { return fmt.Errorf("save order %s: %w", id, err) }
```

## When not a finding

Logging-and-rethrow with context, framework boundary handlers (e.g. FastAPI exception handlers), and deliberate best-effort paths with a comment + metric are fine. Findings need the ungarded retry / swallowed error / orphaned-state quote plus the trigger from `error-handling-review.md`.
