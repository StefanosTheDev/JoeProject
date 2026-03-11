"""Vercel API client for adding and verifying custom domains on the frontend project."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

VERCEL_API_BASE = "https://api.vercel.com"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.vercel_api_token}",
        "Content-Type": "application/json",
    }


def _params() -> dict[str, str]:
    p: dict[str, str] = {}
    if settings.vercel_team_id:
        p["teamId"] = settings.vercel_team_id
    return p


async def add_domain_to_project(hostname: str) -> dict[str, Any]:
    """
    Add a domain to the Vercel project. Returns Vercel response.
    Uses v9 API; 200/201 = success, 409 = already in use, 403 = wrong team.
    """
    if not settings.vercel_api_token or not settings.vercel_project_id:
        return {"ok": False, "error": "VERCEL_API_TOKEN and VERCEL_PROJECT_ID must be set"}
    url = f"{VERCEL_API_BASE}/v9/projects/{settings.vercel_project_id}/domains"
    params = _params()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            url,
            json={"name": hostname},
            params=params,
            headers=_headers(),
        )
    data = r.json() if r.content else {}
    if r.status_code in (200, 201):
        return {"ok": True, "data": data}
    err_msg = data.get("error")
    if isinstance(err_msg, dict):
        err_msg = err_msg.get("message", r.text or f"HTTP {r.status_code}")
    else:
        err_msg = err_msg or r.text or f"HTTP {r.status_code}"
    return {"ok": False, "error": str(err_msg), "code": r.status_code}


async def verify_project_domain(hostname: str) -> dict[str, Any]:
    """
    Trigger domain verification on Vercel. Returns verification status.
    """
    if not settings.vercel_api_token or not settings.vercel_project_id:
        return {"ok": False, "verified": False, "error": "VERCEL_API_TOKEN and VERCEL_PROJECT_ID must be set"}
    url = f"{VERCEL_API_BASE}/v9/projects/{settings.vercel_project_id}/domains/{hostname}/verify"
    params = _params()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, params=params, headers=_headers())
    data = r.json() if r.content else {}
    if r.status_code != 200:
        return {
            "ok": False,
            "verified": False,
            "error": data.get("error", {}).get("message", r.text or f"HTTP {r.status_code}"),
        }
    # Vercel returns { "verified": true } or verification details
    verified = data.get("verified", False)
    return {"ok": True, "verified": verified, "data": data}


async def create_dns_record(
    domain: str,
    record_type: str,
    name: str,
    value: str,
    ttl: int = 60,
) -> dict[str, Any]:
    """
    Create a DNS record for a domain (domain must use Vercel nameservers).
    POST /v2/domains/{domain}/records
    name: subdomain (e.g. "go" for go.example.com) or "" for root.
    """
    if not settings.vercel_api_token:
        return {"ok": False, "error": "VERCEL_API_TOKEN must be set"}
    domain = domain.strip().lower()
    url = f"{VERCEL_API_BASE}/v2/domains/{domain}/records"
    params = _params()
    body: dict[str, Any] = {
        "type": record_type.upper(),
        "name": name.strip().lower() if name else "",
        "value": value.strip(),
        "ttl": max(60, min(2147483647, ttl)),
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, json=body, params=params, headers=_headers())
    data = r.json() if r.content else {}
    if r.status_code in (200, 201):
        return {"ok": True, "data": data}
    err_msg = data.get("error")
    if isinstance(err_msg, dict):
        err_msg = err_msg.get("message", r.text or f"HTTP {r.status_code}")
    else:
        err_msg = err_msg or r.text or f"HTTP {r.status_code}"
    return {"ok": False, "error": str(err_msg), "code": r.status_code}


async def get_domain_config(hostname: str) -> dict[str, Any]:
    """
    Get DNS configuration for the domain (what CNAME/A record to set).
    Returns suggested records so we can show the user what to add.
    """
    if not settings.vercel_api_token:
        return {"ok": False, "error": "VERCEL_API_TOKEN must be set"}
    url = f"{VERCEL_API_BASE}/v6/domains/{hostname}/config"
    params = _params()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, params=params, headers=_headers())
    data = r.json() if r.content else {}
    if r.status_code != 200:
        return {
            "ok": False,
            "error": data.get("error", {}).get("message", r.text or f"HTTP {r.status_code}"),
        }
    # Vercel returns { "configuredBy": "vercel"|"external", "misconfigured": bool, ... }
    return {"ok": True, "data": data}
