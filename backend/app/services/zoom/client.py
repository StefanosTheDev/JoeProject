"""Zoom API client — Server-to-Server OAuth and meetings (Phase 3)."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ZOOM_OAUTH_URL = "https://zoom.us/oauth/token"
ZOOM_API_BASE = "https://api.zoom.us/v2"


async def get_access_token() -> dict[str, Any]:
    """
    Get Zoom access token via Server-to-Server OAuth (account_credentials).
    Token is valid for about 1 hour.
    """
    if not all([
        settings.zoom_account_id,
        settings.zoom_client_id,
        settings.zoom_client_secret,
    ]):
        return {"ok": False, "error": "Zoom credentials not configured"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                ZOOM_OAUTH_URL,
                params={
                    "grant_type": "account_credentials",
                    "account_id": settings.zoom_account_id,
                },
                auth=(settings.zoom_client_id, settings.zoom_client_secret),
            )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": data.get("reason", r.text)}
        return {
            "ok": True,
            "access_token": data.get("access_token"),
            "expires_in": data.get("expires_in"),
        }
    except Exception as e:
        logger.exception("Zoom get_access_token failed: %s", e)
        return {"ok": False, "error": str(e)}


async def create_meeting(
    *,
    user_id: str = "me",
    topic: str,
    start_time: str,
    duration_minutes: int = 45,
    timezone: str = "America/New_York",
    agenda: str | None = None,
) -> dict[str, Any]:
    """
    Create a Zoom meeting. user_id can be 'me' (token user) or a Zoom user id.
    start_time: ISO 8601 datetime string.
    """
    token_result = await get_access_token()
    if not token_result.get("ok") or not token_result.get("access_token"):
        return {"ok": False, "error": token_result.get("error", "No token")}
    access_token = token_result["access_token"]
    payload = {
        "topic": topic,
        "type": 2,
        "start_time": start_time,
        "duration": duration_minutes,
        "timezone": timezone,
        "settings": {
            "join_before_host": True,
            "waiting_room": False,
        },
    }
    if agenda:
        payload["agenda"] = agenda
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{ZOOM_API_BASE}/users/{user_id}/meetings",
                json=payload,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": data.get("message", r.text)}
        return {
            "ok": True,
            "id": data.get("id"),
            "join_url": data.get("join_url"),
            "start_url": data.get("start_url"),
        }
    except Exception as e:
        logger.exception("Zoom create_meeting failed: %s", e)
        return {"ok": False, "error": str(e)}


async def delete_meeting(meeting_id: str) -> dict[str, Any]:
    """Cancel/delete a Zoom meeting."""
    token_result = await get_access_token()
    if not token_result.get("ok") or not token_result.get("access_token"):
        return {"ok": False, "error": token_result.get("error", "No token")}
    access_token = token_result["access_token"]
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.delete(
                f"{ZOOM_API_BASE}/meetings/{meeting_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if r.status_code in (204, 200):
            return {"ok": True}
        data = r.json() if r.content else {}
        return {"ok": False, "error": data.get("message", r.text)}
    except Exception as e:
        logger.exception("Zoom delete_meeting failed: %s", e)
        return {"ok": False, "error": str(e)}
