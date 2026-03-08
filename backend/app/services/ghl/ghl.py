"""GHL service — ensure table, upsert connection, get status, disconnect. DB only; OAuth in ghl_oauth."""

from __future__ import annotations

import json
import asyncpg

from app.services.ghl.ghl_oauth import token_expires_at_from_expires_in

GHL_CONNECTIONS_DDL = """
CREATE TABLE IF NOT EXISTS ghl_connections (
    id SERIAL PRIMARY KEY,
    firm_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    location_id TEXT,
    company_id TEXT,
    user_type TEXT DEFAULT 'Location',
    status TEXT NOT NULL DEFAULT 'active',
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""

GHL_CUSTOM_VALUES_DDL = """
CREATE TABLE IF NOT EXISTS ghl_custom_values (
    id SERIAL PRIMARY KEY,
    firm_id TEXT NOT NULL,
    ghl_custom_value_id TEXT NOT NULL,
    key TEXT NOT NULL,
    asset_id TEXT,
    current_value_hash TEXT,
    last_synced_at TIMESTAMPTZ,
    UNIQUE(firm_id, ghl_custom_value_id)
);
CREATE INDEX IF NOT EXISTS idx_ghl_custom_values_firm ON ghl_custom_values(firm_id);
CREATE INDEX IF NOT EXISTS idx_ghl_custom_values_key ON ghl_custom_values(firm_id, key);
"""

GHL_CONTACTS_SYNC_DDL = """
CREATE TABLE IF NOT EXISTS ghl_contacts_sync (
    id SERIAL PRIMARY KEY,
    firm_id TEXT NOT NULL,
    ghl_contact_id TEXT NOT NULL,
    os_lead_id TEXT,
    campaign_id TEXT,
    utm_data JSONB,
    last_synced_at TIMESTAMPTZ,
    UNIQUE(firm_id, ghl_contact_id)
);
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_sync_firm ON ghl_contacts_sync(firm_id);
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_sync_os_lead ON ghl_contacts_sync(firm_id, os_lead_id);
"""

GHL_WEBHOOK_LOG_DDL = """
CREATE TABLE IF NOT EXISTS ghl_webhook_log (
    id SERIAL PRIMARY KEY,
    firm_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'received'
);
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_log_firm ON ghl_webhook_log(firm_id);
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_log_event ON ghl_webhook_log(event_type);
"""


async def ensure_ghl_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_connections table exists (for deployments that have not run schema.sql)."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_CONNECTIONS_DDL)


async def upsert_connection(
    pool: asyncpg.Pool,
    firm_id: str,
    token_data: dict,
) -> None:
    """Store or update GHL tokens for firm_id. Call ensure_ghl_table first if needed."""
    await ensure_ghl_table(pool)
    expires_at = token_expires_at_from_expires_in(token_data["expires_in"])
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_connections (
                firm_id, access_token, refresh_token, token_expires_at,
                location_id, company_id, user_type, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
            ON CONFLICT (firm_id) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                token_expires_at = EXCLUDED.token_expires_at,
                location_id = COALESCE(EXCLUDED.location_id, ghl_connections.location_id),
                company_id = COALESCE(EXCLUDED.company_id, ghl_connections.company_id),
                user_type = COALESCE(EXCLUDED.user_type, ghl_connections.user_type),
                status = 'active',
                updated_at = now()
            """,
            firm_id,
            token_data["access_token"],
            token_data["refresh_token"],
            expires_at,
            token_data.get("location_id"),
            token_data.get("company_id"),
            token_data.get("user_type", "Location"),
        )


async def get_connection_status(pool: asyncpg.Pool, firm_id: str) -> dict:
    """Return connection status for firm_id. Always returns a dict with connected and firm_id."""
    await ensure_ghl_table(pool)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, firm_id, location_id, company_id, status, token_expires_at, connected_at
            FROM ghl_connections
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
        "location_id": row["location_id"],
        "company_id": row["company_id"],
        "status": row["status"],
        "token_expires_at": row["token_expires_at"].isoformat() if row["token_expires_at"] else None,
        "connected_at": row["connected_at"].isoformat() if row["connected_at"] else None,
    }


async def ensure_ghl_custom_values_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_custom_values table exists."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_CUSTOM_VALUES_DDL)


async def upsert_custom_value_mapping(
    pool: asyncpg.Pool,
    firm_id: str,
    ghl_custom_value_id: str,
    key: str,
    asset_id: str | None = None,
    current_value_hash: str | None = None,
) -> None:
    """Upsert a row in ghl_custom_values (OS asset -> GHL custom value id)."""
    await ensure_ghl_custom_values_table(pool)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_custom_values (
                firm_id, ghl_custom_value_id, key, asset_id, current_value_hash, last_synced_at
            ) VALUES ($1, $2, $3, $4, $5, now())
            ON CONFLICT (firm_id, ghl_custom_value_id) DO UPDATE SET
                key = EXCLUDED.key,
                asset_id = COALESCE(EXCLUDED.asset_id, ghl_custom_values.asset_id),
                current_value_hash = EXCLUDED.current_value_hash,
                last_synced_at = now()
            """,
            firm_id,
            ghl_custom_value_id,
            key,
            asset_id,
            current_value_hash,
        )


async def ensure_ghl_contacts_sync_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_contacts_sync table exists."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_CONTACTS_SYNC_DDL)


async def ensure_ghl_webhook_log_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_webhook_log table exists."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_WEBHOOK_LOG_DDL)


async def upsert_contact_sync(
    pool: asyncpg.Pool,
    firm_id: str,
    ghl_contact_id: str,
    os_lead_id: str | None = None,
    campaign_id: str | None = None,
    utm_data: dict | None = None,
) -> None:
    """Upsert a row in ghl_contacts_sync."""
    await ensure_ghl_contacts_sync_table(pool)
    utm_json = json.dumps(utm_data) if utm_data is not None else None
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_contacts_sync (
                firm_id, ghl_contact_id, os_lead_id, campaign_id, utm_data, last_synced_at
            ) VALUES ($1, $2, $3, $4, $5::jsonb, now())
            ON CONFLICT (firm_id, ghl_contact_id) DO UPDATE SET
                os_lead_id = COALESCE(EXCLUDED.os_lead_id, ghl_contacts_sync.os_lead_id),
                campaign_id = COALESCE(EXCLUDED.campaign_id, ghl_contacts_sync.campaign_id),
                utm_data = COALESCE(EXCLUDED.utm_data, ghl_contacts_sync.utm_data),
                last_synced_at = now()
            """,
            firm_id,
            ghl_contact_id,
            os_lead_id,
            campaign_id,
            utm_json,
        )


async def get_firm_id_by_location_id(pool: asyncpg.Pool, location_id: str) -> str | None:
    """Return firm_id for the given GHL location_id, or None."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT firm_id FROM ghl_connections WHERE location_id = $1 AND status = 'active'",
            location_id,
        )
    return row["firm_id"] if row else None


async def ensure_ghl_appointments_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_appointments table exists."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_APPOINTMENTS_DDL)


async def ensure_ghl_opportunities_table(pool: asyncpg.Pool) -> None:
    """Ensure ghl_opportunities table exists."""
    async with pool.acquire() as conn:
        await conn.execute(GHL_OPPORTUNITIES_DDL)


async def upsert_appointment(
    pool: asyncpg.Pool,
    firm_id: str,
    ghl_appointment_id: str,
    ghl_contact_id: str | None = None,
    calendar_id: str | None = None,
    status: str | None = None,
    booked_at=None,
    start_time=None,
    end_time=None,
) -> None:
    """Upsert a row in ghl_appointments. booked_at/start_time/end_time can be datetime or None."""
    await ensure_ghl_appointments_table(pool)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_appointments (
                firm_id, ghl_appointment_id, ghl_contact_id, calendar_id, status,
                booked_at, start_time, end_time, last_updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
            ON CONFLICT (firm_id, ghl_appointment_id) DO UPDATE SET
                ghl_contact_id = COALESCE(EXCLUDED.ghl_contact_id, ghl_appointments.ghl_contact_id),
                calendar_id = COALESCE(EXCLUDED.calendar_id, ghl_appointments.calendar_id),
                status = COALESCE(EXCLUDED.status, ghl_appointments.status),
                booked_at = COALESCE(EXCLUDED.booked_at, ghl_appointments.booked_at),
                start_time = COALESCE(EXCLUDED.start_time, ghl_appointments.start_time),
                end_time = COALESCE(EXCLUDED.end_time, ghl_appointments.end_time),
                last_updated_at = now()
            """,
            firm_id,
            ghl_appointment_id,
            ghl_contact_id,
            calendar_id,
            status,
            booked_at,
            start_time,
            end_time,
        )


async def upsert_opportunity(
    pool: asyncpg.Pool,
    firm_id: str,
    ghl_opportunity_id: str,
    ghl_contact_id: str | None = None,
    pipeline_id: str | None = None,
    stage: str | None = None,
    monetary_value: float | None = None,
) -> None:
    """Upsert a row in ghl_opportunities."""
    await ensure_ghl_opportunities_table(pool)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_opportunities (
                firm_id, ghl_opportunity_id, ghl_contact_id, pipeline_id, stage, monetary_value, last_updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, now())
            ON CONFLICT (firm_id, ghl_opportunity_id) DO UPDATE SET
                ghl_contact_id = COALESCE(EXCLUDED.ghl_contact_id, ghl_opportunities.ghl_contact_id),
                pipeline_id = COALESCE(EXCLUDED.pipeline_id, ghl_opportunities.pipeline_id),
                stage = COALESCE(EXCLUDED.stage, ghl_opportunities.stage),
                monetary_value = COALESCE(EXCLUDED.monetary_value, ghl_opportunities.monetary_value),
                last_updated_at = now()
            """,
            firm_id,
            ghl_opportunity_id,
            ghl_contact_id,
            pipeline_id,
            stage,
            monetary_value,
        )


async def disconnect(pool: asyncpg.Pool, firm_id: str) -> None:
    """Set GHL connection status to revoked for firm_id."""
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE ghl_connections SET status = 'revoked', updated_at = now() WHERE firm_id = $1",
            firm_id,
        )
