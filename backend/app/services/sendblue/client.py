"""SendBlue API client — send iMessage/SMS."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SENDBLUE_BASE = "https://api.sendblue.co"


async def send_message(
    *,
    from_number: str,
    to_number: str,
    content: str,
    media_url: str | None = None,
    status_callback: str | None = None,
) -> dict[str, Any]:
    """
    Send iMessage/SMS via SendBlue.
    Numbers must be E.164 (e.g. +19998887777).
    Returns dict with handle/status or error.
    """
    if not settings.sendblue_api_key_id or not settings.sendblue_api_secret:
        return {"ok": False, "error": "SendBlue credentials not configured"}
    payload: dict[str, Any] = {
        "from_number": from_number,
        "number": to_number,
        "content": content,
    }
    if media_url:
        payload["media_url"] = media_url
    if status_callback:
        payload["status_callback"] = status_callback
    headers = {
        "Content-Type": "application/json",
        "sb-api-key-id": settings.sendblue_api_key_id,
        "sb-api-secret-key": settings.sendblue_api_secret,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{SENDBLUE_BASE}/api/send-message",
                json=payload,
                headers=headers,
            )
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if r.status_code >= 400:
            return {
                "ok": False,
                "error": data.get("message", data.get("error", r.text)) or f"HTTP {r.status_code}",
                "status_code": r.status_code,
            }
        return {
            "ok": True,
            "handle": data.get("handle") or data.get("id"),
            "status": data.get("status", "QUEUED"),
        }
    except httpx.TimeoutException:
        logger.exception("SendBlue send_message timeout")
        return {"ok": False, "error": "Request timeout"}
    except Exception as e:
        logger.exception("SendBlue send_message error: %s", e)
        return {"ok": False, "error": str(e)}
