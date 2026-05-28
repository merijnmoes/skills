# Python best-practices — config & worked examples

Deep reference for `python.md`. Read this when you need concrete tooling config or a worked pattern; the rules themselves live in `python.md`. Treat these as starting points — match the project's existing config and conventions.

## Recommended tooling config (`pyproject.toml`)

```toml
[tool.ruff]
line-length = 88
target-version = "py310"
select = [
  "E", "W", "F",   # pycodestyle + pyflakes
  "I",             # isort
  "N",             # pep8-naming
  "UP",            # pyupgrade
  "B",             # bugbear
  "A", "C4",       # builtins, comprehensions
  "SIM", "RET",    # simplify, return
  "PTH",           # use pathlib
  "PT",            # pytest style
  "RUF",           # ruff-specific
]
ignore = ["E501"]  # line length handled by the formatter

[tool.mypy]
python_version = "3.10"
strict = true
warn_unused_ignores = true
warn_redundant_casts = true
warn_unreachable = true
no_implicit_optional = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false   # tests can be looser

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"           # no per-test @pytest.mark.asyncio needed
addopts = ["--strict-markers", "--cov=myproject", "--cov-report=term-missing"]
markers = ["slow: slow tests", "integration: integration tests"]
```

`strict = true` turns on `disallow_untyped_defs`, `disallow_any_generics`, `check_untyped_defs`, and friends — start there and relax per-module rather than enabling flags one at a time.

## Typing patterns

```python
from collections.abc import Callable, Sequence
from typing import Generic, TypeVar

UserId = int                      # type alias names a recurring shape
UserData = dict[str, object]

def find_user(user_id: UserId) -> "User | None": ...
def apply(fn: Callable[[int, int], int], x: int, y: int) -> int: return fn(x, y)

T = TypeVar("T")
class Container(Generic[T]):
    def __init__(self, value: T) -> None:
        self._value = value
    def get(self) -> T:
        return self._value
```

Use `Protocol` for structural typing when you want "anything with these methods" without a base-class hierarchy.

## Validation with Pydantic

```python
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class User(BaseModel):
    id: int
    username: str = Field(min_length=3, max_length=50)
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tags: list[str] = Field(default_factory=list)   # not a bare [] default

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("invalid email address")
        return v.lower()
```

Validate at the boundary, then pass the typed model inward — never thread raw dicts through the app.

## Async patterns

```python
import asyncio

# Concurrent, not serial:
async def fetch_all(urls: list[str]) -> list[dict]:
    return await asyncio.gather(*(fetch(u) for u in urls))

# Retry with exponential backoff:
async def fetch_with_retry(url: str, retries: int = 3, backoff: float = 1.0) -> dict:
    for attempt in range(retries):
        try:
            return await fetch(url)
        except TimeoutError:
            if attempt == retries - 1:
                raise
            await asyncio.sleep(backoff * 2 ** attempt)
    raise RuntimeError("unreachable")

# Async context manager + generator:
from contextlib import asynccontextmanager

@asynccontextmanager
async def resource():
    r = await acquire()
    try:
        yield r
    finally:
        await r.close()        # cleanup on every path

async def stream(n: int):
    for i in range(n):
        await asyncio.sleep(0)
        yield i
```

## Exception hierarchy

```python
class AppError(Exception): ...
class ValidationError(AppError): ...
class NotFoundError(AppError): ...

def get_user(user_id: int) -> "User":
    if user_id <= 0:
        raise ValidationError(f"invalid user_id: {user_id}")   # fail fast
    user = db.get(user_id)
    if user is None:
        raise NotFoundError(f"user not found: {user_id}")
    return user
```

Give errors actionable messages — say what was wrong and, where useful, how to fix it.

## Logging

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("processing user %s with %d items", user_id, count)  # lazy: formatted only if DEBUG is on
logger.info("login ok", extra={"user_id": user_id, "ip": ip})     # structured context

# NOT: logger.debug(f"processing user {user_id}")  # builds the string every call
```

## Testing (pytest)

```python
import pytest

@pytest.fixture
def user_service():
    return UserService(db=FakeDb())

@pytest.mark.parametrize("username,ok", [
    ("john", True), ("j", False), ("", False), ("a" * 100, False),
])
def test_validate_username(username: str, ok: bool):
    assert validate_username(username) is ok

def test_invalid_id_raises():
    with pytest.raises(ValidationError, match="invalid user_id"):
        get_user(-1)

async def test_fetch(user_service):          # no marker needed with asyncio_mode=auto
    assert (await user_service.get(1)).id == 1
```

## Performance do/don't

```python
# Membership: set is O(1), list is O(n)
valid_ids = {1, 2, 3}            # if user_id in valid_ids  → fast

# Large data: stream, don't slurp
def lines(path):                 # generator, constant memory
    with open(path) as f:
        for line in f:
            yield line.rstrip()

# Defaults: dict.get over hasattr/try
value = config.get("key", default)
```

Profile before optimizing anything non-obvious (`../performance-profiling.md`), and leave a one-line comment explaining *why* a non-obvious optimization exists.
