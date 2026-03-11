"""Calendly API client — OAuth and event types (Phase 3)."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

CALENDLY_AUTH_BASE = "https://auth.calendly.com"
CALENDLY_API_BASE = "https://api.calendly.com"


def _auth_headers() -> dict[str, str]:
    return {
        "Content-Type": "application/x-www-form-urlencoded",
    }


async def exchange_code_for_tokens(
    code: str,
    redirect_uri: str | None = None,
) -> dict[str, Any]:
    """Exchange authorization code for access_token and refresh_token.
    redirect_uri must match EXACTLY what was used in the authorize request and in Calendly app settings.
    """
    uri = (redirect_uri or settings.calendly_redirect_uri).strip().rstrip("/")
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.calendly_client_id,
        "client_secret": settings.calendly_client_secret,
        "code": code,
        "redirect_uri": uri,
    }
    logger.info("Calendly token exchange: redirect_uri=%r", uri)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{CALENDLY_AUTH_BASE}/oauth/token",
                data=data,
                headers=_auth_headers(),
            )
        resp = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": resp.get("error_description", r.text)}
        return {
            "ok": True,
            "access_token": resp.get("access_token"),
            "refresh_token": resp.get("refresh_token"),
            "expires_in": resp.get("expires_in"),
        }
    except Exception as e:
        logger.exception("Calendly token exchange failed: %s", e)
        return {"ok": False, "error": str(e)}


async def refresh_access_token(refresh_token: str) -> dict[str, Any]:
    """Refresh Calendly access token."""
    data = {
        "grant_type": "refresh_token",
        "client_id": settings.calendly_client_id,
        "client_secret": settings.calendly_client_secret,
        "refresh_token": refresh_token,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{CALENDLY_AUTH_BASE}/oauth/token",
                data=data,
                headers=_auth_headers(),
            )
        resp = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": resp.get("error_description", r.text)}
        return {
            "ok": True,
            "access_token": resp.get("access_token"),
            "refresh_token": resp.get("refresh_token", refresh_token),
            "expires_in": resp.get("expires_in"),
        }
    except Exception as e:
        logger.exception("Calendly refresh failed: %s", e)
        return {"ok": False, "error": str(e)}


async def get_current_user(access_token: str) -> dict[str, Any]:
    """Get current Calendly user (for user_uri)."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{CALENDLY_API_BASE}/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if r.status_code >= 400:
            return {"ok": False, "error": r.text}
        data = r.json()
        resource = data.get("resource", {})
        return {
            "ok": True,
            "uri": resource.get("uri"),
            "name": resource.get("name"),
            "email": resource.get("email"),
        }
    except Exception as e:
        logger.exception("Calendly get_current_user failed: %s", e)
        return {"ok": False, "error": str(e)}


async def get_event_types(access_token: str, user_uri: str) -> dict[str, Any]:
    """List event types for the user (for embed/scheduling). Only active so we don't show unavailable calendars."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{CALENDLY_API_BASE}/event_types",
                params={"user": user_uri, "active": "true"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if r.status_code >= 400:
            return {"ok": False, "error": r.text}
        data = r.json()
        return {"ok": True, "event_types": data.get("collection", [])}
    except Exception as e:
        logger.exception("Calendly get_event_types failed: %s", e)
        return {"ok": False, "error": str(e)}
