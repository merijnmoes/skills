# Django / DRF best-practices

Loaded in `big-review` Phase 1 when the diff lives in a Django or Django REST Framework project (`django` / `djangorestframework` in deps, models/views/serializers/viewsets/settings changes). Layers on top of `python.md`. This file adds Django-specific ORM, serializer, view, and security guidance. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## ORM and query shaping
- Shape queries intentionally. Use `select_related` for single-value relations and `prefetch_related` for collections when the changed path would otherwise introduce N+1 behavior.
- Be careful with repeated queryset evaluation, especially in serializers, templates, and loops.
- Keep filtering, annotation, and ordering in the layer the project expects; avoid scattering query behavior across unrelated helpers.
- Use transactions for related writes that must succeed or fail together.

```python
# Bad: serializer/template loop triggers one query per related object
books = Book.objects.all()

# Good: shape the query for the access pattern
books = Book.objects.select_related("publisher").prefetch_related("authors")
```

## Views, viewsets, and serializers
- Keep views/viewsets focused on HTTP orchestration. Heavy business rules should not be buried in serializer `save()` or view method branches unless the codebase explicitly centralizes them there.
- Separate validation concerns from persistence and representation concerns. A serializer that validates, mutates unrelated models, sends side effects, and formats output is doing too much.
- Prefer explicit permissions, queryset scoping, and object-level checks over assuming authentication is enough.
- For DRF, ensure list/detail actions, serializer selection, and permission classes stay coherent rather than special-casing every action inline.

```python
# Bad: "__all__" can expose fields the API should never return
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"

# Good: public contract is explicit
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "display_name", "avatar_url"]
```

## Security and correctness
- Preserve Django's secure defaults unless there is a clear documented reason not to: autoescaping, CSRF protections for session-auth flows, safe cookie/session settings, parameterized ORM/raw SQL usage.
- Any raw SQL must be parameterized and justified.
- File uploads, rich text, redirects, and template rendering paths must treat user input as untrusted.
- Multi-tenant or owner-scoped data must be filtered at the queryset/access layer, not only hidden in templates or serializers.

```python
# Bad: authenticated users can read any order by guessing ids
class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()

# Good: caller scope is enforced in the queryset itself
class OrderViewSet(ModelViewSet):
    def get_queryset(self):
        return Order.objects.filter(account=self.request.user.account)
```

## Async and side effects
- Be careful mixing async views with sync ORM or middleware assumptions; follow the project's established async posture.
- Push slow or retryable side effects into the app's background-task/job mechanism when the project already uses one.
- Avoid hidden side effects in model `save()`, serializer hooks, or signals when the behavior becomes hard to trace.

## Tests and admin/settings changes
- Query-heavy changes should add or update tests that would fail on missing permissions, incorrect queryset scope, or N+1-sensitive behavior when practical.
- Settings, middleware, auth, and security changes should update the relevant tests or operator docs.
- If the diff changes admin/forms/templates, verify that server-side validation still matches what the UI suggests.

## Red flags to look for
- Serializer/viewset does orchestration, side effects, and representation at once.
- Queryset scope is broad, and permissions try to hide the leak later.
- Signals or `save()` hooks hide important business side effects.
- Template/admin/form behavior implies validation that the server does not enforce.
- Query-heavy endpoint grows related fields without changing query shape.

## Anti-patterns
- N+1 queries introduced through serializers or template loops.
- Raw SQL built with string interpolation.
- Authorization enforced only in the template or client.
- Fat serializers/viewsets that mix too many responsibilities.
- Hidden side effects in signals/hooks without clear ownership.

## Quick checklist
- [ ] Related-object access is query-shaped intentionally (`select_related` / `prefetch_related`) where needed
- [ ] Queryset scope, permissions, and object ownership checks are explicit
- [ ] Views/viewsets and serializers keep orchestration, validation, and persistence responsibilities reasonably separated
- [ ] Secure defaults remain intact for templating, CSRF/session flows, uploads, and SQL
- [ ] Async/background side effects follow the project's established model
- [ ] Tests and docs cover the meaningful permission, scope, and settings risks
