"""Messaging API — contacts, messages, send, webhooks (Phase 1)."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app import db
from app.config import settings
from app.models.messaging_models import (
    Contact,
    ContactListResponse,
    Message,
    MessageListResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.messaging import (
    create_contact,
    create_message,
    get_contact,
    get_contact_by_phone_any_firm,
    get_or_create_contact_by_phone,
    list_contacts_by_firm,
    list_messages_by_contact,
)
from app.services.sendblue import sendblue_send_message
from app.services.resend import resend_send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.get("/contacts", response_model=ContactListResponse)
async def list_contacts(
    firm_id: str,
    limit: int = 50,
    offset: int = 0,
):
    """List contacts for a firm (Conversations inbox)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        rows, total = await list_contacts_by_firm(conn, firm_id, limit=limit, offset=offset)
    return ContactListResponse(
        contacts=[Contact.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact_by_id(contact_id: str):
    """Get a single contact."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await get_contact(conn, contact_id)
    if not row:
        raise HTTPException(404, "Contact not found")
    return Contact.model_validate(row)


@router.get("/contacts/{contact_id}/messages", response_model=MessageListResponse)
async def get_contact_messages(
    contact_id: str,
    limit: int = 100,
    offset: int = 0,
):
    """Get message thread for a contact."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        contact = await get_contact(conn, contact_id)
        if not contact:
            raise HTTPException(404, "Contact not found")
        rows, total = await list_messages_by_contact(
            conn, contact_id, limit=limit, offset=offset
        )
    return MessageListResponse(
        messages=[Message.model_validate(r) for r in rows],
        total=total,
    )


@router.post("/send", response_model=SendMessageResponse)
async def send_message(body: SendMessageRequest):
    """Send iMessage/SMS (SendBlue) or email (Resend) to a contact."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        contact = await get_contact(conn, body.contact_id)
        if not contact:
            raise HTTPException(404, "Contact not found")
        firm_id = contact["firm_id"]

        if body.channel in ("imessage", "sms"):
            from_number = body.from_number or settings.sendblue_from_number
            if not from_number:
                return SendMessageResponse(
                    ok=False,
                    error="from_number required for iMessage/SMS (or set SENDBLUE_FROM_NUMBER in .env)",
                )
            to_number = contact.get("phone")
            if not to_number:
                return SendMessageResponse(
                    ok=False, error="Contact has no phone number"
                )
            # Normalize to E.164: if 10 digits, assume US +1
            to_number = to_number.strip()
            if to_number.isdigit() and len(to_number) == 10:
                to_number = f"+1{to_number}"
            elif to_number.isdigit() and len(to_number) == 11 and to_number.startswith("1"):
                to_number = f"+{to_number}"
            elif not to_number.startswith("+"):
                to_number = f"+{to_number}"
            result = await sendblue_send_message(
                from_number=from_number,
                to_number=to_number,
                content=body.content,
            )
            if not result.get("ok"):
                return SendMessageResponse(
                    ok=False, error=result.get("error", "Send failed")
                )
            msg = await create_message(
                conn,
                firm_id=firm_id,
                contact_id=body.contact_id,
                channel="imessage" if body.channel == "imessage" else "sms",
                direction="outbound",
                content=body.content,
                sendblue_handle=result.get("handle"),
                status=result.get("status", "sent"),
            )
            return SendMessageResponse(ok=True, message_id=msg.get("id"))

        if body.channel == "email":
            to_email = contact.get("email")
            if not to_email:
                return SendMessageResponse(
                    ok=False, error="Contact has no email"
                )
            from_email = body.from_email or "Amplify <onboarding@resend.dev>"
            subject = body.subject or "Message from your advisor"
            result = await resend_send_email(
                from_email=from_email,
                to_email=to_email,
                subject=subject,
                html=body.content,
                text=body.content,
            )
            if not result.get("ok"):
                return SendMessageResponse(
                    ok=False, error=result.get("error", "Send failed")
                )
            msg = await create_message(
                conn,
                firm_id=firm_id,
                contact_id=body.contact_id,
                channel="email",
                direction="outbound",
                content=body.content,
                resend_email_id=result.get("id"),
                status="sent",
            )
            return SendMessageResponse(ok=True, message_id=msg.get("id"))

    return SendMessageResponse(ok=False, error="Unsupported channel")


@router.post("/webhooks/sendblue")
async def webhook_sendblue(request: Request):
    """
    SendBlue webhook: inbound messages and outbound status updates.
    Persist inbound messages to messages table; optionally update status for outbound.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    # Inbound: number, content, media_url, etc.
    number = payload.get("number") or payload.get("from_number") or payload.get("sender_number")
    content = payload.get("content") or payload.get("message") or ""
    media_url = payload.get("media_url")
    # Status update: handle, status
    handle = payload.get("handle")
    status = payload.get("status")

    firm_id = settings.messaging_default_firm_id
    if not firm_id:
        # Try to find contact by phone to get firm_id
        async with db.pool.acquire() as conn:
            if number:
                existing = await get_contact_by_phone_any_firm(conn, number)
                if existing:
                    firm_id = existing["firm_id"]
        if not firm_id:
            logger.warning("SendBlue webhook: no firm_id (set MESSAGING_DEFAULT_FIRM_ID or create contact first)")
            return {"status": "ok"}

    async with db.pool.acquire() as conn:
        if number and content and not handle:
            # Inbound message
            contact_row = await get_contact_by_phone_any_firm(conn, number)
            if not contact_row:
                if not firm_id:
                    return {"status": "ok"}
                contact_row = await get_or_create_contact_by_phone(
                    conn, firm_id, number
                )
            channel = "imessage" if payload.get("is_imessage") else "sms"
            await create_message(
                conn,
                firm_id=contact_row["firm_id"],
                contact_id=contact_row["id"],
                channel=channel,
                direction="inbound",
                content=content,
                media_url=media_url,
                status="delivered",
            )
        # Outbound status: could UPDATE messages SET status WHERE sendblue_handle = $1
        # Skip for MVP; inbox still shows sent.

    return {"status": "ok"}


@router.post("/webhooks/resend")
async def webhook_resend(request: Request):
    """
    Resend webhook: email.sent, email.delivered, email.bounced, etc.
    Persist delivery events; for bounces/complaints we could mark contact or update message.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    # Resend sends type: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
    event_type = payload.get("type") or payload.get("event")
    email_id = payload.get("data", {}).get("email_id") if isinstance(payload.get("data"), dict) else payload.get("email_id")
    # We could look up message by resend_email_id and update status/read_at
    logger.info("Resend webhook: type=%s email_id=%s", event_type, email_id)
    return {"status": "ok"}
