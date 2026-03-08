"""GoHighLevel (GHL) OAuth — connect URL, token exchange, refresh, valid token for API calls."""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token"
GHL_AUTH_BASE = "https://marketplace.gohighlevel.com"

# Scopes per GHL_Integration_Developer_Guide.docx.md §2 "Required Scopes". Must match Marketplace app.
DEFAULT_SCOPES = [
    "contacts.readonly",
    "contacts.write",
    "locations.readonly",
    "locations/customValues.readonly",
    "locations/customValues.write",
    "locations/customFields.readonly",
    "locations/customFields.write",
    "calendars.readonly",
    "calendars/events.readonly",
    "conversations.readonly",
    "conversations/message.write",
    "workflows.readonly",
    "opportunities.readonly",
    "opportunities.write",
    "campaigns.readonly",
    "funnels/funnel.readonly",
    "funnels/page.readonly",
    "snapshots.readonly",
]


def get_oauth_connect_url(firm_id: str) -> str:
    """Build the GHL OAuth authorization (Install) URL. Redirect user here to connect their sub-account."""
    params = {
        "client_id": settings.ghl_client_id,
        "redirect_uri": settings.ghl_redirect_uri,
        "scope": " ".join(DEFAULT_SCOPES),
        "response_type": "code",
        "state": firm_id,
    }
    return f"{GHL_AUTH_BASE}/oauth/chooselocation?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict:
    """
    Exchange authorization code for access_token and refresh_token.
    Uses user_type=Location so we get locationId (sub-account) in the response.
    Returns dict with: access_token, refresh_token, expires_in, location_id, company_id, user_type.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            GHL_TOKEN_URL,
            json={
                "client_id": settings.ghl_client_id,
                "client_secret": settings.ghl_client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "user_type": "Location",
                "redirect_uri": settings.ghl_redirect_uri,
            },
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    if not access_token or not refresh_token:
        raise ValueError("GHL token response missing access_token or refresh_token")
    expires_in = int(data.get("expires_in", 86400))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
        "location_id": data.get("locationId"),
        "company_id": data.get("companyId"),
        "user_type": data.get("userType", "Location"),
    }


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Exchange refresh_token for new access_token. GHL returns a new refresh_token each time.
    Returns same shape as exchange_code_for_tokens (access_token, refresh_token, expires_in, ...).
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            GHL_TOKEN_URL,
            data={
                "client_id": settings.ghl_client_id,
                "client_secret": settings.ghl_client_secret,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "user_type": "Location",
                "redirect_uri": settings.ghl_redirect_uri,
            },
            headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        data = r.json()
    access_token = data.get("access_token")
    new_refresh = data.get("refresh_token")
    if not access_token or not new_refresh:
        raise ValueError("GHL refresh response missing access_token or refresh_token")
    expires_in = int(data.get("expires_in", 86400))
    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "expires_in": expires_in,
        "location_id": data.get("locationId"),
        "company_id": data.get("companyId"),
        "user_type": data.get("userType", "Location"),
    }


def token_expires_at_from_expires_in(expires_in_seconds: int) -> datetime:
    """Convert expires_in (seconds) to absolute token_expires_at UTC."""
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)


def is_token_expiring_soon(expires_at: datetime | None, buffer_minutes: int = 60) -> bool:
    """True if token is missing or expires within buffer_minutes (default 1 hour)."""
    if not expires_at:
        return True
    return datetime.now(timezone.utc) >= expires_at - timedelta(minutes=buffer_minutes)


async def get_valid_access_token(pool, firm_id: str):
    """
    Load GHL connection for firm_id; refresh token if expiring soon; return (access_token, location_id).
    Use this before any GHL API call. Returns (access_token, location_id) or (None, None) if not connected.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT access_token, refresh_token, token_expires_at, location_id
            FROM ghl_connections
            WHERE firm_id = $1 AND status = 'active'
            """,
            firm_id,
        )
    if not row:
        return None, None
    expires_at = row["token_expires_at"]
    if is_token_expiring_soon(expires_at):
        try:
            new_data = await refresh_access_token(row["refresh_token"])
            new_expires = token_expires_at_from_expires_in(new_data["expires_in"])
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE ghl_connections
                    SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = now()
                    WHERE firm_id = $4
                    """,
                    new_data["access_token"],
                    new_data["refresh_token"],
                    new_expires,
                    firm_id,
                )
            return new_data["access_token"], new_data.get("location_id") or row["location_id"]
        except Exception as e:
            logger.warning("GHL token refresh failed for firm_id=%s: %s", firm_id, e)
            return None, None
    return row["access_token"], row["location_id"]
