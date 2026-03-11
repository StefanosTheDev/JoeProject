"""Dynamic CORS: allow origins from env plus verified custom_domains (BYOD). Scales for multiple clients."""
from __future__ import annotations

import time
from typing import List

from app import db
from app.config import settings

_CACHE_TTL_SEC = 60
_cached_origins: List[str] | None = None
_cached_at: float = 0

# Vercel preview URLs (e.g. joe-project-xxx.vercel.app) — allowed without adding to DB
VERCEL_ORIGIN_REGEX = r"^https://[a-zA-Z0-9-]+\.vercel\.app$"


def invalidate_cors_cache() -> None:
    """Call after verifying a custom domain so the new origin is allowed on the next request."""
    global _cached_origins, _cached_at
    _cached_origins = None
    _cached_at = 0


def _static_origins() -> List[str]:
    """Only your own fixed origins (localhost, main app URL). Do not add client BYOD domains here."""
    return [o.strip() for o in settings.cors_origins if o.strip()]


async def get_allowed_origins() -> List[str]:
    """
    Allowed origins: CORS_ORIGINS (env) + every verified custom_domains hostname (http + https).
    Client domains are added automatically from the DB — no need to add them to env.
    Cached 60s; invalidated when a domain is verified.
    """
    global _cached_origins, _cached_at
    now = time.monotonic()
    if _cached_origins is not None and (now - _cached_at) < _CACHE_TTL_SEC:
        return _cached_origins
    static = _static_origins()
    if db.pool is None:
        _cached_origins = static
        _cached_at = now
        return static
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT hostname FROM custom_domains WHERE status = 'verified'"
            )
        # Allow both http and https for each verified hostname (dev and prod)
        from_db: List[str] = []
        for r in rows:
            h = (r["hostname"] or "").strip()
            if h:
                from_db.append(f"https://{h}")
                from_db.append(f"http://{h}")
        combined = list(dict.fromkeys(static + from_db))
        _cached_origins = combined
        _cached_at = now
        return combined
    except Exception:
        _cached_origins = static
        _cached_at = now
        return static
