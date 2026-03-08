"""Meta Conversions API — server-side event tracking (Lead, Schedule, Contact, etc.)."""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone

import asyncpg
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

META_GRAPH_BASE = "https://graph.facebook.com"


def hash_sha256(value: str) -> str:
    """Meta requires SHA-256 hashed PII (lowercase, trimmed)."""
    if not value or not value.strip():
        return ""
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


async def get_pixel_and_token(pool: asyncpg.Pool, firm_id: str) -> tuple[str, str] | None:
    """Return (pixel_id, access_token) for the firm's Meta connection, or None."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT pixel_id, access_token
            FROM meta_connections
            WHERE firm_id = $1 AND status = 'active'
            """,
            firm_id,
        )
    if not row or not row["pixel_id"] or not row["access_token"]:
        return None
    return (str(row["pixel_id"]), str(row["access_token"]))


async def send_event(
    pool: asyncpg.Pool,
    firm_id: str,
    *,
    event_name: str,
    event_id: str,
    event_time: datetime | None = None,
    email: str | None = None,
    phone: str | None = None,
    fbp: str | None = None,
    fbc: str | None = None,
    action_source: str = "website",
    custom_data: dict | None = None,
) -> tuple[bool, str | None]:
    """
    Send one conversion event to Meta CAPI. Logs to meta_conversions_log.
    event_id must be a string and match the pixel event_id for deduplication.
    Returns (success, error_message).
    """
    pair = await get_pixel_and_token(pool, firm_id)
    if not pair:
        return False, "No Meta connection with pixel_id for this firm"

    pixel_id, access_token = pair
    version = settings.meta_api_version
    event_time = event_time or datetime.now(timezone.utc)
    event_time_unix = int(event_time.timestamp())

    user_data = {}
    if email:
        user_data["em"] = hash_sha256(email)
    if phone:
        user_data["ph"] = hash_sha256(phone)
    if fbp:
        user_data["fbp"] = fbp
    if fbc:
        user_data["fbc"] = fbc
    if not user_data:
        user_data["client_user_agent"] = "Server"

    payload = {
        "data": [
            {
                "event_name": event_name,
                "event_time": event_time_unix,
                "event_id": str(event_id),
                "action_source": action_source,
                "user_data": user_data,
            }
        ]
    }
    if custom_data:
        payload["data"][0]["custom_data"] = custom_data

    url = f"{META_GRAPH_BASE}/{version}/{pixel_id}/events"
    params = {"access_token": access_token}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, params=params, json=payload)
            resp_json = r.json() if r.content else {}
    except Exception as e:
        logger.exception("CAPI request failed: %s", e)
        await _log_conversion(pool, firm_id, event_name, event_id, event_time, None, {"error": str(e)})
        return False, str(e)

    if r.status_code != 200:
        err = resp_json.get("error", {}).get("message", r.text)
        await _log_conversion(pool, firm_id, event_name, event_id, event_time, user_data, resp_json)
        return False, err

    events_received = resp_json.get("events_received", 0)
    await _log_conversion(
        pool,
        firm_id,
        event_name,
        event_id,
        event_time,
        user_data,
        {"events_received": events_received, "fbtrace_id": resp_json.get("fbtrace_id")},
    )
    return True, None


async def _log_conversion(
    pool: asyncpg.Pool,
    firm_id: str,
    event_name: str,
    event_id: str,
    event_time: datetime,
    user_data_hash: dict | None,
    meta_response: dict,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO meta_conversions_log (firm_id, event_name, event_id, event_time, user_data_hash, meta_response)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            """,
            firm_id,
            event_name,
            event_id,
            event_time,
            json.dumps(user_data_hash) if user_data_hash else None,
            json.dumps(meta_response),
        )


async def get_recent_conversions(
    pool: asyncpg.Pool, firm_id: str, limit: int = 20
) -> list[dict]:
    """Return recent CAPI events for the firm (for observability UI)."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, event_name, event_id, event_time, meta_response, sent_at
            FROM meta_conversions_log
            WHERE firm_id = $1
            ORDER BY sent_at DESC
            LIMIT $2
            """,
            firm_id,
            limit,
        )
    return [
        {
            "id": r["id"],
            "event_name": r["event_name"],
            "event_id": r["event_id"],
            "event_time": r["event_time"].isoformat() if r["event_time"] else None,
            "meta_response": r["meta_response"],
            "sent_at": r["sent_at"].isoformat() if r["sent_at"] else None,
        }
        for r in rows
    ]
