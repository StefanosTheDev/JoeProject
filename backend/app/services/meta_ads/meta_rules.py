"""Meta Ads rules engine scaffolding — alert-only rules, conditions, audit."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import asyncpg

logger = logging.getLogger(__name__)


async def list_rules(pool: asyncpg.Pool, firm_id: str) -> list[dict]:
    """Return active rules for the firm."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, rule_type, condition_json, action_type, is_active, last_triggered_at, created_at
            FROM meta_rules
            WHERE firm_id = $1
            ORDER BY created_at DESC
            """,
            firm_id,
        )
    return [
        {
            "id": r["id"],
            "rule_type": r["rule_type"],
            "condition_json": r["condition_json"],
            "action_type": r["action_type"],
            "is_active": r["is_active"],
            "last_triggered_at": r["last_triggered_at"].isoformat() if r["last_triggered_at"] else None,
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


async def create_rule(
    pool: asyncpg.Pool,
    firm_id: str,
    rule_type: str,
    condition_json: dict,
    action_type: str,
) -> str:
    """Insert a rule and return its id."""
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """
            INSERT INTO meta_rules (firm_id, rule_type, condition_json, action_type)
            VALUES ($1, $2, $3::jsonb, $4)
            RETURNING id
            """,
            firm_id,
            rule_type,
            condition_json,
            action_type,
        )


async def set_rule_active(pool: asyncpg.Pool, rule_id: str, is_active: bool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE meta_rules SET is_active = $1 WHERE id = $2",
            is_active,
            rule_id,
        )


async def record_rule_triggered(pool: asyncpg.Pool, rule_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE meta_rules SET last_triggered_at = $1 WHERE id = $2",
            datetime.now(timezone.utc),
            rule_id,
        )
