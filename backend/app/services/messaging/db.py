"""DB layer for contacts and messages (Phase 1)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import asyncpg


async def create_contact(
    conn: asyncpg.Connection,
    *,
    firm_id: str,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
    phone: str | None = None,
    source: str | None = None,
    utm_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    utm_json = json.dumps(utm_data or {})
    row = await conn.fetchrow(
        """
        INSERT INTO contacts (firm_id, first_name, last_name, email, phone, source, utm_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING id, firm_id, first_name, last_name, email, phone, imessage_capable,
                  source, utm_data, tags, pipeline_stage, calendly_invitee_uri, created_at
        """,
        firm_id,
        first_name,
        last_name,
        email,
        phone,
        source,
        utm_json,
    )
    return dict(row) if row else {}


async def get_contact(conn: asyncpg.Connection, contact_id: str) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT id, firm_id, first_name, last_name, email, phone, imessage_capable,
               source, utm_data, tags, pipeline_stage, calendly_invitee_uri, created_at
        FROM contacts WHERE id = $1
        """,
        contact_id,
    )
    return dict(row) if row else None


async def list_contacts_by_firm(
    conn: asyncpg.Connection,
    firm_id: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    total = await conn.fetchval(
        "SELECT count(*) FROM contacts WHERE firm_id = $1",
        firm_id,
    )
    rows = await conn.fetch(
        """
        SELECT id, firm_id, first_name, last_name, email, phone, imessage_capable,
               source, utm_data, tags, pipeline_stage, calendly_invitee_uri, created_at
        FROM contacts
        WHERE firm_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        """,
        firm_id,
        limit,
        offset,
    )
    return [dict(r) for r in rows], total or 0


async def get_or_create_contact_by_phone(
    conn: asyncpg.Connection,
    firm_id: str,
    phone: str,
    *,
    first_name: str | None = None,
    last_name: str | None = None,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, firm_id, first_name, last_name, email, phone, created_at FROM contacts WHERE firm_id = $1 AND phone = $2",
        firm_id,
        phone,
    )
    if row:
        return dict(row)
    return await create_contact(
        conn,
        firm_id=firm_id,
        phone=phone,
        first_name=first_name,
        last_name=last_name,
    )


async def get_contact_by_phone_any_firm(
    conn: asyncpg.Connection, phone: str
) -> dict[str, Any] | None:
    """Return contact by phone in any firm (for webhooks)."""
    row = await conn.fetchrow(
        "SELECT id, firm_id, first_name, last_name, email, phone, created_at FROM contacts WHERE phone = $1 LIMIT 1",
        phone,
    )
    return dict(row) if row else None


async def get_or_create_contact_by_email(
    conn: asyncpg.Connection,
    firm_id: str,
    email: str,
    *,
    first_name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, firm_id, first_name, last_name, email, phone, created_at FROM contacts WHERE firm_id = $1 AND email = $2",
        firm_id,
        email.lower(),
    )
    if row:
        return dict(row)
    return await create_contact(
        conn,
        firm_id=firm_id,
        email=email.lower(),
        first_name=first_name,
        last_name=last_name,
        phone=phone,
    )


async def create_message(
    conn: asyncpg.Connection,
    *,
    firm_id: str,
    contact_id: str,
    channel: str,
    direction: str,
    content: str,
    media_url: str | None = None,
    sendblue_handle: str | None = None,
    resend_email_id: str | None = None,
    status: str = "sent",
    sent_at: datetime | None = None,
    read_at: datetime | None = None,
) -> dict[str, Any]:
    sent_at = sent_at or datetime.now(timezone.utc)
    row = await conn.fetchrow(
        """
        INSERT INTO messages (firm_id, contact_id, channel, direction, content, media_url,
                              sendblue_handle, resend_email_id, status, sent_at, read_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, firm_id, contact_id, channel, direction, content, media_url,
                  sendblue_handle, resend_email_id, status, read_at, sent_at, created_at
        """,
        firm_id,
        contact_id,
        channel,
        direction,
        content,
        media_url,
        sendblue_handle,
        resend_email_id,
        status,
        sent_at,
        read_at,
    )
    return dict(row) if row else {}


async def list_messages_by_contact(
    conn: asyncpg.Connection,
    contact_id: str,
    *,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    total = await conn.fetchval(
        "SELECT count(*) FROM messages WHERE contact_id = $1",
        contact_id,
    )
    rows = await conn.fetch(
        """
        SELECT id, firm_id, contact_id, channel, direction, content, media_url,
               sendblue_handle, resend_email_id, status, read_at, sent_at, created_at
        FROM messages
        WHERE contact_id = $1
        ORDER BY created_at ASC
        LIMIT $2 OFFSET $3
        """,
        contact_id,
        limit,
        offset,
    )
    return [dict(r) for r in rows], total or 0
