"""Health service — DB liveness check. No HTTP."""

from __future__ import annotations

import asyncpg


async def check_db(pool: asyncpg.Pool | None) -> dict:
    """
    Run a simple query against the pool. Returns dict with status, and either result (int) or message (str).
    """
    if pool is None:
        return {"status": "error", "message": "Database pool not initialised"}
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchval("SELECT 1")
        return {"status": "ok", "result": row}
    except Exception as e:
        return {"status": "error", "message": str(e)}
