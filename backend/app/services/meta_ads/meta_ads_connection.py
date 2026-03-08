"""Meta Ads connection — upsert, get status, disconnect. DB only; OAuth in meta_ads_oauth."""

from __future__ import annotations

import asyncpg


async def upsert_connection(
    pool: asyncpg.Pool,
    firm_id: str,
    access_token: str,
    expires_at,
    ad_account_id: str | None = None,
    page_id: str | None = None,
) -> None:
    """Store or update Meta connection for firm_id."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO meta_connections (
                firm_id, access_token, token_expires_at, ad_account_id, page_id, status
            ) VALUES ($1, $2, $3, $4, $5, 'active')
            ON CONFLICT (firm_id) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                token_expires_at = EXCLUDED.token_expires_at,
                ad_account_id = COALESCE(EXCLUDED.ad_account_id, meta_connections.ad_account_id),
                page_id = COALESCE(EXCLUDED.page_id, meta_connections.page_id),
                status = 'active',
                updated_at = now()
            """,
            firm_id,
            access_token,
            expires_at,
            ad_account_id,
            page_id,
        )


async def get_connection_status(pool: asyncpg.Pool, firm_id: str) -> dict:
    """Return connection status for firm_id. Always returns a dict with connected and firm_id."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, firm_id, ad_account_id, page_id, status, token_expires_at, connected_at
            FROM meta_connections
            WHERE firm_id = $1
            """,
            firm_id,
        )
    if not row:
        return {"connected": False, "firm_id": firm_id}
    return {
        "connected": row["status"] == "active",
        "firm_id": firm_id,
        "connection_id": row["id"],
        "ad_account_id": row["ad_account_id"],
        "page_id": row["page_id"],
        "status": row["status"],
        "token_expires_at": row["token_expires_at"].isoformat() if row["token_expires_at"] else None,
        "connected_at": row["connected_at"].isoformat() if row["connected_at"] else None,
    }


async def disconnect(pool: asyncpg.Pool, firm_id: str) -> None:
    """Set Meta connection status to revoked for firm_id."""
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE meta_connections SET status = 'revoked', updated_at = now() WHERE firm_id = $1",
            firm_id,
        )
