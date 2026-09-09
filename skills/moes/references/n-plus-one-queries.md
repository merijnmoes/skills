# N+1 query prevention

Phase 4 / Phase 6 support for `moes`, loaded when the diff loops over rows and queries inside the loop, touches ORM relations, serializers, GraphQL resolvers, or list endpoints. Performance *and* correctness under load — N+1 turns a list page into a fan-out outage.

## Trigger

Load when the diff contains: loop + query inside it, ORM lazy relation access in a loop/serializer, GraphQL field resolvers hitting the DB per node, or new list/detail endpoints without eager-loading evidence.

## Fix per stack (pick the one in the diff)

- **Django:** `select_related` (FK/one-to-one) / `prefetch_related` (M2M/reverse). Check serializers — nested serializer fields trigger one query per object unless prefetched.
- **SQLAlchemy:** `selectinload` / `joinedload` on the query; `lazy="noload"` audit for hot paths.
- **Prisma / TypeORM:** `include` / relations `eager` or explicit `leftJoinAndSelect`; DataLoader for GraphQL.
- **Laravel:** `with()` eager loads; `lazy()`/`cursor()` for large sets; watch API Resources nesting.
- **Raw SQL:** single `JOIN` or `IN (...)` batch instead of per-row round-trip.

## Examples

```python
# ❌ Django — one query per book
books = Book.objects.all()
return [b.author.name for b in books]
# ✅
books = Book.objects.select_related("author").all()
```

```ts
// ❌ per-row fetch in a loop
for (const o of orders) o.items = await db.item.findMany({ where: { orderId: o.id } });
// ✅ batched
const items = await db.item.findMany({ where: { orderId: { in: orders.map(o => o.id) } } });
```

## Detection / verification

- Grep for `for .* in` near `objects.get|query|find|select|await .*find` in the same hunk; check serializers/resolvers for nested relation fields.
- Phase 6 probe: exercise the list endpoint with N=20+ rows and count queries (Django `assertNumQueries`, query log, Prisma logging). One list render must not scale queries with row count.
- A finding needs the loop + the per-row query quote. No loop, no N+1 — mark `N/A`.
