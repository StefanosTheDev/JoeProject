"""Calendly API — OAuth callback, webhooks (Phase 3)."""
from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app import db
from app.config import settings
from app.services.calendly import (
    exchange_code_for_tokens,
    get_current_user,
    get_event_types,
)
from app.services.messaging import get_or_create_contact_by_email
# Zoom API not used: advisor connects Zoom in Calendly; Calendly creates the meeting and sends the link.
# from app.services.resend import resend_send_email
# from app.services.sendblue import sendblue_send_message
# from app.services.zoom import create_meeting, delete_meeting

logger = logging.getLogger(__name__)


def _normalize_phone_e164(phone: str) -> str:
    """Normalize to E.164 for SendBlue."""
    s = phone.strip()
    if not s:
        return s
    if s.isdigit() and len(s) == 10:
        return f"+1{s}"
    if s.isdigit() and len(s) == 11 and s.startswith("1"):
        return f"+{s}"
    if not s.startswith("+"):
        return f"+{s}"
    return s

router = APIRouter(prefix="/calendly", tags=["calendly"])


@router.get("/oauth/callback")
async def calendly_oauth_callback(
    code: str | None = None,
    state: str | None = None,
):
    """
    OAuth callback. Exchange code for tokens and store in calendly_connections.
    state can be firm_id (so we know which firm to attach the connection to).
    """
    if not code:
        raise HTTPException(400, "Missing code")
    firm_id = (state or "").strip() or settings.messaging_default_firm_id
    if not firm_id:
        raise HTTPException(400, "Missing state (firm_id)")

    result = await exchange_code_for_tokens(code)
    if not result.get("ok"):
        raise HTTPException(400, result.get("error", "Token exchange failed"))

    access_token = result.get("access_token")
    refresh_token = result.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(500, "No tokens in response")

    user_info = await get_current_user(access_token)
    if not user_info.get("ok"):
        raise HTTPException(500, user_info.get("error", "Failed to get user"))
    user_uri = user_info.get("uri")

    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO calendly_connections (firm_id, access_token, refresh_token, calendly_user_uri)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (firm_id) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                calendly_user_uri = EXCLUDED.calendly_user_uri
            """,
            firm_id,
            access_token,
            refresh_token,
            user_uri,
        )

    return {
        "status": "ok",
        "message": "Calendly connected. You can close this window.",
        "advisor_note": "Connect Zoom in Calendly (Integrations → Zoom) so booked calls get a video link. We do not use a Zoom API in this app.",
    }


def _verify_calendly_webhook(payload: bytes, signature: str | None) -> bool:
    """Verify Calendly webhook signature if key is configured."""
    if not settings.calendly_webhook_signing_key or not signature:
        return True
    expected = hmac.new(
        settings.calendly_webhook_signing_key.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected)


@router.post("/webhooks/calendly")
async def webhook_calendly(request: Request):
    """
    Calendly webhook: invitee.created, invitee.canceled.
    Create/update contact and opportunity; on invitee.created set pipeline to booked.
    """
    body = await request.body()
    signature = request.headers.get("Calendly-Webhook-Signature") or request.headers.get("X-Calendly-Signature")
    if not _verify_calendly_webhook(body, signature):
        raise HTTPException(401, "Invalid signature")

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    event = payload.get("event")
    if event not in ("invitee.created", "invitee.canceled"):
        return {"status": "ok"}

    payload_data = payload.get("payload", {})
    invitee = payload_data.get("invitee", {})
    event_data = payload_data.get("event", {})
    email = invitee.get("email")
    name = invitee.get("name", "").strip().split(None, 1)
    first_name = name[0] if name else None
    last_name = name[1] if len(name) > 1 else None
    uri = invitee.get("uri")
    event_uri = event_data.get("uri")
    start_time = (event_data.get("start_time") or "").replace("Z", "+00:00")

    firm_id = settings.messaging_default_firm_id
    if not firm_id or not db.pool:
        return {"status": "ok"}

    async with db.pool.acquire() as conn:
        if not email:
            return {"status": "ok"}
        contact = await get_or_create_contact_by_email(
            conn,
            firm_id=firm_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        if not contact:
            return {"status": "ok"}
        contact_id = contact["id"]

        if event == "invitee.created":
            # We do NOT use the Zoom API. Advisor must connect Zoom in Calendly (Calendly → Integrations → Zoom).
            # Calendly then creates the Zoom meeting and sends the link in its confirmation email.
            await conn.execute(
                """
                INSERT INTO opportunities (firm_id, contact_id, pipeline_stage, booked_at, zoom_join_url, zoom_meeting_id)
                VALUES ($1, $2, 'booked', $3::timestamptz, NULL, NULL)
                """,
                firm_id,
                contact_id,
                start_time or datetime.now(timezone.utc),
            )
            if uri:
                await conn.execute(
                    "UPDATE contacts SET calendly_invitee_uri = $1 WHERE id = $2",
                    uri,
                    contact_id,
                )
            # Zoom link is sent by Calendly when advisor has Zoom connected in Calendly.
        elif event == "invitee.canceled":
            # Zoom API not used; no meeting to cancel in our system.
            await conn.execute(
                """
                UPDATE opportunities SET pipeline_stage = 'canceled', updated_at = now()
                WHERE id = (
                    SELECT id FROM opportunities
                    WHERE firm_id = $1 AND contact_id = $2
                    ORDER BY booked_at DESC NULLS LAST
                    LIMIT 1
                )
                """,
                firm_id,
                contact_id,
            )

    return {"status": "ok"}


@router.get("/event-types")
async def list_event_types(firm_id: str):
    """List Calendly event types for the firm's connection (for embed URL)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT access_token, refresh_token, calendly_user_uri FROM calendly_connections WHERE firm_id = $1",
            firm_id,
        )
    if not row:
        raise HTTPException(404, "Calendly not connected for this firm")
    result = await get_event_types(row["access_token"], row["calendly_user_uri"] or "")
    if not result.get("ok"):
        raise HTTPException(502, result.get("error", "Failed to fetch event types"))
    return {"event_types": result.get("event_types", [])}
