"""Shared FastAPI dependencies (e.g. auth headers)."""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.config import settings


async def require_cron_secret(
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret"),
) -> None:
    """If CRON_SECRET is set, require it in X-Cron-Secret. Raise 401 otherwise."""
    if not settings.cron_secret:
        return
    if x_cron_secret != settings.cron_secret:
        raise HTTPException(401, "Missing or invalid X-Cron-Secret")


async def require_meta_cron_secret(
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret"),
) -> None:
    """If META_CRON_SECRET is set, require it in X-Cron-Secret. Raise 401 otherwise."""
    if not settings.meta_cron_secret:
        return
    if x_cron_secret != settings.meta_cron_secret:
        raise HTTPException(401, "Missing or invalid X-Cron-Secret")
