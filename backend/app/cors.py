"""Dynamic CORS: allow origins from env plus verified custom_domains (BYOD)."""
from __future__ import annotations

import time
from typing import List

from app.config import settings
from app.db import pool

_CACHE_TTL_SEC = 60
_cached_origins: List[str] | None = None
_cached_at: float = 0


def invalidate_cors_cache() -> None:
    """Call after verifying a custom domain so the new origin is allowed on the next request."""
    global _cached_origins, _cached_at
    _cached_origins = None
    _cached_at = 0


def _static_origins() -> List[str]:
    return [o.strip() for o in settings.cors_origins if o.strip()]


async def get_allowed_origins() -> List[str]:
    """Origins from CORS_ORIGINS env plus https:// for each verified custom_domains hostname. Cached 60s."""
    global _cached_origins, _cached_at
    now = time.monotonic()
    if _cached_origins is not None and (now - _cached_at) < _CACHE_TTL_SEC:
        return _cached_origins
    static = _static_origins()
    if pool is None:
        _cached_origins = static
        _cached_at = now
        return static
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT hostname FROM custom_domains WHERE status = 'verified'"
            )
        from_db = [f"https://{r['hostname']}" for r in rows]
        combined = list(dict.fromkeys(static + from_db))
        _cached_origins = combined
        _cached_at = now
        return combined
    except Exception:
        _cached_origins = static
        _cached_at = now
        return static
