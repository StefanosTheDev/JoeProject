from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg

from app.config import settings

pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    """Create asyncpg pool. Use Supabase direct URL (port 5432) with asyncpg."""
    global pool
    pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        command_timeout=60,
    )
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    return pool


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None


async def get_conn() -> AsyncIterator[asyncpg.Connection]:
    assert pool is not None, "Database pool not initialised"
    async with pool.acquire() as conn:
        yield conn
