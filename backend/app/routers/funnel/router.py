"""Funnel API — lead submit, funnel content (Phase 2)."""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app import db
from app.config import settings
from app.models.funnel_models import (
    FunnelContentResponse,
    FunnelSubmitRequest,
    FunnelSubmitResponse,
)
from app.services.messaging import get_or_create_contact_by_email
from app.services.tenant import get_request_base_url
from app.services.meta_ads.meta_capi import send_event
from app.services.resend import resend_send_email
from app.services.sendblue import sendblue_send_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/funnel", tags=["funnel"])


@router.post("/submit", response_model=FunnelSubmitResponse)
async def funnel_submit(request: Request, body: FunnelSubmitRequest):
    """
    Submit funnel form (registration/landing). Creates contact, captures UTM,
    logs page_analytics, and sends Meta CAPI Lead event if firm has connection.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    session_id = None
    webinar_scheduled_at = None
    webinar_join_url = None
    utm_data = {}
    if body.utm_source is not None:
        utm_data["utm_source"] = body.utm_source
    if body.utm_medium is not None:
        utm_data["utm_medium"] = body.utm_medium
    if body.utm_campaign is not None:
        utm_data["utm_campaign"] = body.utm_campaign
    if body.utm_content is not None:
        utm_data["utm_content"] = body.utm_content
    if body.utm_term is not None:
        utm_data["utm_term"] = body.utm_term

    async with db.pool.acquire() as conn:
        contact = await get_or_create_contact_by_email(
            conn,
            firm_id=body.firm_id,
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            phone=body.phone,
        )
        if not contact or not contact.get("id"):
            return FunnelSubmitResponse(ok=False, error="Failed to create contact")
        contact_id = contact["id"]

        # Page analytics (asyncpg expects JSON string for ::jsonb)
        utm_json = json.dumps(utm_data)
        await conn.execute(
            """
            INSERT INTO page_analytics (firm_id, event_type, contact_id, utm_data, referrer)
            VALUES ($1, $2, $3, $4::jsonb, $5)
            """,
            body.firm_id,
            "form_submit",
            contact_id,
            utm_json,
            body.referrer,
        )

        # Assign to next webinar session when campaign_id present
        if body.campaign_id:
            row = await conn.fetchrow(
                """
                SELECT id, scheduled_at FROM webinar_sessions
                WHERE campaign_id = $1 AND is_active = true AND scheduled_at > now()
                ORDER BY scheduled_at ASC
                LIMIT 1
                """,
                body.campaign_id,
            )
            if row:
                session_id = row["id"]
                webinar_scheduled_at = row["scheduled_at"].isoformat() if row.get("scheduled_at") else None
                base_url = await get_request_base_url(request)
                webinar_join_url = f"{base_url}/webinar/watch/{session_id}"
                await conn.execute(
                    """
                    INSERT INTO webinar_registrations (session_id, contact_id)
                    VALUES ($1, $2)
                    ON CONFLICT (session_id, contact_id) DO NOTHING
                    """,
                    session_id,
                    contact_id,
                )

    # Send webinar join link to contact (SMS and/or email)
    if session_id and webinar_join_url and contact:
        msg_body = f"You're registered for our webinar. Join here when it starts: {webinar_join_url}"
        if webinar_scheduled_at:
            msg_body = f"You're registered for our webinar on {webinar_scheduled_at[:10]}. Join here when it starts: {webinar_join_url}"
        phone = contact.get("phone")
        if phone and settings.sendblue_from_number:
            to_number = phone.strip()
            if to_number.isdigit() and len(to_number) == 10:
                to_number = f"+1{to_number}"
            elif to_number.isdigit() and len(to_number) == 11 and to_number.startswith("1"):
                to_number = f"+{to_number}"
            elif not to_number.startswith("+"):
                to_number = f"+{to_number}"
            try:
                sb = await sendblue_send_message(
                    from_number=settings.sendblue_from_number,
                    to_number=to_number,
                    content=msg_body,
                )
                if not sb.get("ok"):
                    logger.warning("Funnel submit: SendBlue webinar link failed: %s", sb.get("error"))
            except Exception as e:
                logger.exception("Funnel submit: SendBlue error: %s", e)
        to_email = contact.get("email")
        if to_email and settings.resend_api_key:
            try:
                res = await resend_send_email(
                    from_email="Amplify <onboarding@resend.dev>",
                    to_email=to_email,
                    subject="You're registered for our webinar",
                    html=msg_body.replace(webinar_join_url, f'<a href="{webinar_join_url}">Join the webinar</a>'),
                    text=msg_body,
                )
                if not res.get("ok"):
                    logger.warning("Funnel submit: Resend webinar link failed: %s", res.get("error"))
            except Exception as e:
                logger.exception("Funnel submit: Resend error: %s", e)

    # Meta CAPI Lead
    event_id = str(uuid.uuid4())
    ok_capi, _ = await send_event(
        db.pool,
        body.firm_id,
        event_name="Lead",
        event_id=event_id,
        email=body.email,
        phone=body.phone or None,
        custom_data={"content_name": body.page_type},
    )
    if not ok_capi:
        logger.debug("Meta CAPI Lead not sent (no connection or error)")

    return FunnelSubmitResponse(
        ok=True,
        contact_id=contact_id,
        session_id=session_id,
        webinar_scheduled_at=webinar_scheduled_at,
        webinar_join_url=webinar_join_url,
    )


@router.get("/campaign-by-slug")
async def get_campaign_by_slug(firm_id: str, slug: str):
    """
    Resolve campaign_id from funnel_pages slug for registration pages.
    Used by /register/:eventSlug to get campaign_id for a pretty URL.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT campaign_id FROM funnel_pages
            WHERE firm_id = $1 AND slug = $2 AND page_type = 'registration' AND is_published
            LIMIT 1
            """,
            firm_id,
            slug.strip(),
        )
    if not row:
        raise HTTPException(404, "Campaign not found for this slug")
    return {"campaign_id": row["campaign_id"]}


@router.get("/content", response_model=FunnelContentResponse)
async def get_funnel_content(
    firm_id: str,
    campaign_id: str,
    page_type: str = "registration",
):
    """
    Return funnel page copy for a campaign. Uses funnel_pages.content if present,
    else placeholder copy.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT content, slug FROM funnel_pages
            WHERE firm_id = $1 AND campaign_id = $2 AND page_type = $3 AND is_published
            LIMIT 1
            """,
            firm_id,
            campaign_id,
            page_type,
        )
        if row and row.get("content"):
            c = row["content"] if isinstance(row["content"], dict) else {}
            raw_bullets = c.get("bullets")
            bullets = [b for b in (raw_bullets or []) if isinstance(b, str)] if isinstance(raw_bullets, (list, tuple)) else []
            return FunnelContentResponse(
                headline=c.get("headline"),
                subheadline=c.get("subheadline"),
                cta_text=c.get("cta_text"),
                body=c.get("body"),
                hero_image_url=c.get("hero_image_url"),
                logo_url=c.get("logo_url"),
                bullets=bullets,
                video_embed_url=c.get("video_embed_url"),
                secondary_cta_text=c.get("secondary_cta_text"),
                content=c,
            )
        # Placeholder
        return FunnelContentResponse(
            headline="Register for your free session",
            subheadline="Get started today.",
            cta_text="Register",
            body="",
            content={},
        )
