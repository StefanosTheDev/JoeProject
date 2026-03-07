from __future__ import annotations

from fastapi import APIRouter
from app import db

router = APIRouter(tags=["health"])


@router.get("/health/db")
async def health_db():
    if db.pool is None:
        return {"status": "error", "message": "Database pool not initialised"}
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchval("SELECT 1")
        return {"status": "ok", "result": row}
    except Exception as e:
        return {"status": "error", "message": str(e)}
