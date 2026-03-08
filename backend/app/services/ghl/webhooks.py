"""GHL webhook receiver — log events and dispatch to handlers (Contact, Appointment, Opportunity)."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

import asyncpg

from app.services.ghl.ghl import (
    ensure_ghl_webhook_log_table,
    get_firm_id_by_location_id,
    upsert_appointment,
    upsert_contact_sync,
    upsert_opportunity,
)

logger = logging.getLogger(__name__)


def _event_type(payload: dict[str, Any]) -> str | None:
    """Extract event type from payload (type, event, or similar)."""
    return (
        payload.get("type")
        or payload.get("event")
        or payload.get("eventType")
        or (payload.get("payload", {}) or {}).get("type")
    )


def _location_id_from_payload(payload: dict[str, Any]) -> str | None:
    """Extract locationId from payload."""
    loc = payload.get("locationId") or payload.get("location_id")
    if loc:
        return str(loc)
    inner = payload.get("payload") or payload.get("data") or {}
    return inner.get("locationId") or inner.get("location_id") or None


def _contact_id_from_payload(payload: dict[str, Any]) -> str | None:
    """Extract contact id from payload for contact events."""
    cid = payload.get("contactId") or payload.get("contact_id") or payload.get("id")
    if cid:
        return str(cid)
    inner = payload.get("payload") or payload.get("data") or payload.get("contact") or {}
    return inner.get("contactId") or inner.get("contact_id") or inner.get("id") or None


def _appointment_id_from_payload(payload: dict[str, Any]) -> str | None:
    """Extract appointment id from payload."""
    aid = payload.get("appointmentId") or payload.get("appointment_id") or payload.get("id")
    if aid:
        return str(aid)
    inner = payload.get("payload") or payload.get("data") or {}
    return inner.get("appointmentId") or inner.get("appointment_id") or inner.get("id") or None


def _opportunity_id_from_payload(payload: dict[str, Any]) -> str | None:
    """Extract opportunity id from payload."""
    oid = payload.get("opportunityId") or payload.get("opportunity_id") or payload.get("id")
    if oid:
        return str(oid)
    inner = payload.get("payload") or payload.get("data") or {}
    return inner.get("opportunityId") or inner.get("opportunity_id") or inner.get("id") or None


def _inner_payload(payload: dict[str, Any]) -> dict:
    """Get inner entity from payload (payload.payload, payload.data, etc.)."""
    return payload.get("payload") or payload.get("data") or {}


async def log_webhook(
    pool: asyncpg.Pool,
    firm_id: str,
    event_type: str,
    payload: dict[str, Any],
    status: str = "received",
) -> None:
    """Insert a row into ghl_webhook_log."""
    await ensure_ghl_webhook_log_table(pool)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ghl_webhook_log (firm_id, event_type, payload, processed_at, status)
            VALUES ($1, $2, $3::jsonb, now(), $4)
            """,
            firm_id,
            event_type,
            json.dumps(payload),
            status,
        )


async def handle_contact_event(
    pool: asyncpg.Pool,
    firm_id: str,
    payload: dict[str, Any],
) -> None:
    """Upsert ghl_contacts_sync for ContactCreate/ContactUpdate. contact_id from payload."""
    contact_id = _contact_id_from_payload(payload)
    if not contact_id:
        logger.warning("[GHL webhook] contact event missing contact id in payload")
        return
    utm = None
    inner = payload.get("payload") or payload.get("data") or payload.get("contact") or {}
    if isinstance(inner, dict):
        utm = inner.get("utmData") or inner.get("utm_data") or inner.get("customFields")
    await upsert_contact_sync(
        pool,
        firm_id=firm_id,
        ghl_contact_id=contact_id,
        os_lead_id=inner.get("os_lead_id") if isinstance(inner, dict) else None,
        campaign_id=inner.get("campaignId") or (inner.get("campaign_id") if isinstance(inner, dict) else None),
        utm_data=utm if isinstance(utm, dict) else None,
    )


async def handle_appointment_event(
    pool: asyncpg.Pool,
    firm_id: str,
    payload: dict[str, Any],
) -> None:
    """Upsert ghl_appointments for AppointmentCreate/AppointmentUpdate/AppointmentDelete."""
    appointment_id = _appointment_id_from_payload(payload)
    if not appointment_id:
        logger.warning("[GHL webhook] appointment event missing appointment id in payload")
        return
    inner = _inner_payload(payload)
    status = inner.get("status") if isinstance(inner, dict) else None
    if payload.get("type") == "AppointmentDelete" and not status:
        status = "cancelled"
    await upsert_appointment(
        pool,
        firm_id=firm_id,
        ghl_appointment_id=appointment_id,
        ghl_contact_id=inner.get("contactId") or (inner.get("contact_id") if isinstance(inner, dict) else None),
        calendar_id=inner.get("calendarId") or (inner.get("calendar_id") if isinstance(inner, dict) else None),
        status=status,
    )


async def handle_opportunity_event(
    pool: asyncpg.Pool,
    firm_id: str,
    payload: dict[str, Any],
) -> None:
    """Upsert ghl_opportunities for OpportunityCreate/OpportunityStageUpdate/etc."""
    opportunity_id = _opportunity_id_from_payload(payload)
    if not opportunity_id:
        logger.warning("[GHL webhook] opportunity event missing opportunity id in payload")
        return
    inner = _inner_payload(payload)
    if not isinstance(inner, dict):
        inner = {}
    monetary = inner.get("monetaryValue") or inner.get("monetary_value")
    if monetary is not None and not isinstance(monetary, (int, float)):
        monetary = None
    await upsert_opportunity(
        pool,
        firm_id=firm_id,
        ghl_opportunity_id=opportunity_id,
        ghl_contact_id=inner.get("contactId") or inner.get("contact_id"),
        pipeline_id=inner.get("pipelineId") or inner.get("pipeline_id"),
        stage=inner.get("stage") or inner.get("pipelineStageId") or inner.get("pipeline_stage_id"),
        monetary_value=float(monetary) if monetary is not None else None,
    )


def verify_webhook_signature(raw_body: bytes, signature_header: str | None, secret: str) -> bool:
    """Verify X-HighLevel-Signature (HMAC SHA256) if secret is set. Returns True if valid or no signature to check."""
    if not secret or not signature_header:
        return True
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.strip())


async def process_webhook(pool: asyncpg.Pool, raw_body: bytes) -> tuple[str | None, str | None]:
    """
    Parse webhook body, resolve firm_id from locationId, log to ghl_webhook_log,
    dispatch ContactCreate/ContactUpdate to handle_contact_event.
    Returns (firm_id, event_type) for the logged event, or (None, None) on parse failure.
    """
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.warning("[GHL webhook] invalid JSON: %s", e)
        return (None, None)

    event_type = _event_type(payload)
    location_id = _location_id_from_payload(payload)
    if not location_id:
        logger.warning("[GHL webhook] no locationId in payload")
        return (None, event_type or "unknown")

    firm_id = await get_firm_id_by_location_id(pool, location_id)
    if not firm_id:
        logger.warning("[GHL webhook] no firm_id for location_id=%s", location_id)
        return (None, event_type or "unknown")

    await log_webhook(pool, firm_id, event_type or "unknown", payload, status="received")

    if event_type in ("ContactCreate", "ContactUpdate", "contact.created", "contact.updated"):
        try:
            await handle_contact_event(pool, firm_id, payload)
        except Exception as e:
            logger.exception("[GHL webhook] handle_contact_event failed: %s", e)

    if event_type in ("AppointmentCreate", "AppointmentUpdate", "AppointmentDelete"):
        try:
            await handle_appointment_event(pool, firm_id, payload)
        except Exception as e:
            logger.exception("[GHL webhook] handle_appointment_event failed: %s", e)

    if event_type in (
        "OpportunityCreate",
        "OpportunityUpdate",
        "OpportunityStageUpdate",
        "OpportunityDelete",
    ):
        try:
            await handle_opportunity_event(pool, firm_id, payload)
        except Exception as e:
            logger.exception("[GHL webhook] handle_opportunity_event failed: %s", e)

    return (firm_id, event_type or "unknown")
