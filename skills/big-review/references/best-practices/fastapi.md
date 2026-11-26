# FastAPI best-practices

Loaded in `big-review` Phase 1 when the diff lives in a FastAPI project (`fastapi` in deps, `FastAPI()` app setup, router modules, Pydantic API schemas). Layers on top of `python.md` — every generic Python rule still applies. This file adds FastAPI-specific route, dependency, validation, and async guidance. The Phase-0 project context capsule and standing project instructions always override these generic rules.

## Routes and dependencies
- Keep route handlers thin. Parsing, persistence, authorization checks, and business rules should live behind dependencies or services, not inline in the route body.
- Use dependencies for request-scoped resources and contextual checks: DB sessions, current user, tenant, feature flag, resource existence, ownership.
- `yield`-style dependencies that manage resources must clean up on success and failure.
- Prefer the app's established dependency alias pattern (`Annotated[..., Depends(...)]` or local equivalent) rather than mixing styles.

## Schemas and validation boundaries
- Separate input schemas, output schemas, and persistence models. Do not accept or return raw ORM models if that can expose internal fields or client-settable server fields.
- Validate external input at the boundary with constrained Pydantic fields and explicit models; do not pass ad-hoc dicts deep into the app.
- Use distinct create/update schemas when partial updates differ from required create payloads.
- Response models should reflect the public contract and filter out internal fields deliberately.

```python
# Bad: ORM model used as response contract
@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int, session: SessionDep):
    return session.get(User, user_id)

# Good: public schema stays intentional
@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: int, session: SessionDep):
    row = session.get(User, user_id)
    return UserOut.model_validate(row)
```

## Async and I/O correctness
- Never call blocking I/O inside async routes or async dependencies. Use native-async clients/drivers, or the project's established offload pattern only when an async alternative is unavailable.
- Keep app-wide clients/pools long-lived where the project expects that, rather than recreating them per request.
- Avoid hidden sequential waits when independent I/O can be run concurrently and the resulting code stays clear.

```python
# Bad: sync client blocks the event loop
@router.get("/proxy")
async def proxy():
    return requests.get("https://example.com/data").json()

# Good: await native-async I/O
@router.get("/proxy")
async def proxy(client: httpx.AsyncClient = Depends(get_client)):
    response = await client.get("https://example.com/data")
    return response.json()
```

## Persistence and transactions
- Make DB session lifecycle explicit and consistent with the project's unit-of-work pattern.
- Watch for N+1 query patterns, especially when serializing related objects in list endpoints.
- Related writes that must succeed together should share an explicit transaction boundary.
- Do not mix business decisions into ORM or response serialization hooks if the codebase keeps those elsewhere.

## Auth, security, and API behavior
- Authentication is not authorization. Resource ownership, tenant boundaries, and role checks need explicit enforcement.
- Use typed, intentional error responses. Do not leak internal exceptions or stack details through API responses.
- File upload, redirect, webhook, and outbound HTTP changes must validate untrusted input and safe destinations.
- Rate limits, idempotency keys, or replay protection matter on high-value endpoints where the project/domain expects them.

```python
# Bad: any authenticated user can mutate any document by id
@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int, user: User = Depends(current_user)):
    delete_document_by_id(doc_id)

# Good: caller scope is checked before the mutation
@router.delete("/documents/{doc_id}")
async def delete_document(
    doc: Document = Depends(current_users_document),
):
    delete_document_by_id(doc.id)
```

## Tests and verification
- Endpoint changes should have route-level tests that prove both the happy path and one meaningful failure/permission path.
- Prefer dependency overrides or app fixtures over patch-heavy tests when exercising request flows.
- If the diff changes async/database behavior, ensure tests prove session cleanup, auth boundaries, or retry/error behavior where the risk map says it matters.

## Red flags to look for
- Route body mixes validation, auth, persistence, and business branching inline.
- A sync SDK sneaks into `async def` because "it works locally."
- One schema is reused for create, patch, DB persistence, and response output.
- Auth dependency proves identity but no ownership/tenant check guards the resource.
- Tests only cover 200/201 paths and never 401/403/404/422 behavior.

## Anti-patterns
- Business logic embedded directly in route functions.
- Raw ORM models used as both request and response schema.
- Blocking libraries inside async code paths.
- Authenticated-but-not-authorized endpoints.
- Silent fallback responses hiding a failed dependency or partial write.

## Quick checklist
- [ ] Route handlers are thin; real work sits behind dependencies/services
- [ ] Request, response, and persistence models are separated appropriately
- [ ] Boundary validation is explicit with Pydantic constraints/models
- [ ] Async paths use non-blocking I/O and consistent resource lifecycles
- [ ] Query shaping, transactions, and related writes match the risk of the endpoint
- [ ] Auth, tenant, and ownership checks are explicit
- [ ] Endpoint tests cover the main path and a meaningful failure/permission path
