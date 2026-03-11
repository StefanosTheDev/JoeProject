"""Resend API client — send email."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_BASE = "https://api.resend.com"


async def send_email(
    *,
    from_email: str,
    to_email: str | list[str],
    subject: str,
    html: str | None = None,
    text: str | None = None,
    reply_to: str | None = None,
) -> dict[str, Any]:
    """
    Send email via Resend.
    from_email can be "Name <email@domain.com>". to_email can be string or list.
    Returns dict with id or error.
    """
    if not settings.resend_api_key:
        return {"ok": False, "error": "Resend API key not configured"}
    if not html and not text:
        return {"ok": False, "error": "Either html or text body is required"}
    payload: dict[str, Any] = {
        "from": from_email,
        "to": to_email if isinstance(to_email, list) else [to_email],
        "subject": subject,
    }
    if html:
        payload["html"] = html
    if text:
        payload["text"] = text
    if reply_to:
        payload["reply_to"] = reply_to
    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{RESEND_BASE}/emails",
                json=payload,
                headers=headers,
            )
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if r.status_code >= 400:
            return {
                "ok": False,
                "error": data.get("message", data.get("name", r.text)) or f"HTTP {r.status_code}",
                "status_code": r.status_code,
            }
        return {
            "ok": True,
            "id": data.get("id"),
        }
    except httpx.TimeoutException:
        logger.exception("Resend send_email timeout")
        return {"ok": False, "error": "Request timeout"}
    except Exception as e:
        logger.exception("Resend send_email error: %s", e)
        return {"ok": False, "error": str(e)}
