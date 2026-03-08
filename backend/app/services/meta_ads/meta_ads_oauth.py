"""Meta (Facebook) OAuth — connect URL, token exchange, long-lived token, connection status."""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

META_GRAPH_BASE = "https://graph.facebook.com"
DEFAULT_SCOPES = ["ads_read", "ads_management", "business_management", "pages_read_engagement", "pages_manage_ads"]


def get_oauth_connect_url(firm_id: str) -> str:
    """Build the Meta OAuth authorization URL. Redirect user here to start connect flow."""
    params = {
        "client_id": settings.meta_app_id,
        "redirect_uri": settings.meta_redirect_uri,
        "scope": ",".join(DEFAULT_SCOPES),
        "state": firm_id,
        "response_type": "code",
    }
    return f"https://www.facebook.com/{settings.meta_api_version}/dialog/oauth?{urlencode(params)}"


async def exchange_code_for_long_lived_token(code: str) -> tuple[str, int]:
    """
    Exchange authorization code for short-lived token, then for long-lived token (60 days).
    Returns (access_token, expires_in_seconds).
    """
    base = META_GRAPH_BASE
    version = settings.meta_api_version

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: code -> short-lived token
        r1 = await client.get(
            f"{base}/{version}/oauth/access_token",
            params={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "redirect_uri": settings.meta_redirect_uri,
                "code": code,
            },
        )
        r1.raise_for_status()
        data1 = r1.json()
        short_lived = data1.get("access_token")
        if not short_lived:
            raise ValueError("No access_token in OAuth response")

        # Step 2: short-lived -> long-lived (60 days)
        r2 = await client.get(
            f"{base}/{version}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": short_lived,
            },
        )
        r2.raise_for_status()
        data2 = r2.json()
        long_lived = data2.get("access_token")
        expires_in = int(data2.get("expires_in", 5184000))  # default 60 days in seconds
        if not long_lived:
            raise ValueError("No access_token in long-lived exchange response")
        return long_lived, expires_in


async def fetch_me_adaccounts(access_token: str) -> list[dict]:
    """Fetch /me/adaccounts for the token. Returns list of {id, name, account_id}."""
    version = settings.meta_api_version
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{META_GRAPH_BASE}/{version}/me/adaccounts",
            params={
                "fields": "id,name,account_id",
                "access_token": access_token,
            },
        )
        r.raise_for_status()
        data = r.json()
        return data.get("data", [])


async def fetch_me_pages(access_token: str) -> list[dict]:
    """Fetch /me/accounts (Pages) for the token. Returns list of {id, name}."""
    version = settings.meta_api_version
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{META_GRAPH_BASE}/{version}/me/accounts",
            params={
                "fields": "id,name",
                "access_token": access_token,
            },
        )
        r.raise_for_status()
        data = r.json()
        return data.get("data", [])


def token_expires_at_from_expires_in(expires_in_seconds: int) -> datetime:
    """Convert expires_in (seconds) to absolute token_expires_at UTC."""
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
