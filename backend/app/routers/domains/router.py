"""Domains API — connect custom domain (Vercel + DB) and verify."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from app import db
from app.cors import invalidate_cors_cache
from app.models.domains_models import ConnectDomainRequest
from app.services.vercel_domains import (
    add_domain_to_project,
    create_dns_record,
    get_domain_config,
    verify_project_domain,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/domains", tags=["domains"])


@router.post("/connect")
async def connect_domain(body: ConnectDomainRequest):
    """
    Connect a custom domain for a firm (BYOD).
    1. Creates/updates a pending row in custom_domains.
    2. Adds the domain to the Vercel project via API.
    3. Returns DNS instructions for the user to set at their registrar.
    """
    hostname = (body.hostname or "").strip().lower()
    firm_id = body.firm_id or ""
    default_campaign_id = body.default_campaign_id
    if not hostname or " " in hostname:
        raise HTTPException(400, "hostname is required and must be a valid hostname")

    if not db.pool:
        raise HTTPException(503, "Database not available")

    async with db.pool.acquire() as conn:
        firm = await conn.fetchrow("SELECT id FROM firm WHERE id = $1 LIMIT 1", firm_id)
        if not firm:
            raise HTTPException(404, "Firm not found")

        # Upsert custom_domains (pending)
        await conn.execute(
            """
            INSERT INTO custom_domains (hostname, firm_id, status, default_campaign_id)
            VALUES ($1, $2, 'pending', $3)
            ON CONFLICT (hostname) DO UPDATE SET
                firm_id = EXCLUDED.firm_id,
                default_campaign_id = EXCLUDED.default_campaign_id,
                updated_at = now()
            """,
            hostname,
            firm_id,
            default_campaign_id,
        )

    # Add domain to Vercel project
    result = await add_domain_to_project(hostname)
    if not result.get("ok"):
        return {
            "status": "pending",
            "hostname": hostname,
            "message": "Domain recorded; add it manually in Vercel project Settings → Domains.",
            "vercel_error": result.get("error"),
        }

    # Get DNS config to show user what to set
    config_result = await get_domain_config(hostname)
    dns_instructions = None
    if config_result.get("ok") and config_result.get("data"):
        dns_instructions = config_result["data"]
    # Fallback: typical Vercel CNAME target
    if not dns_instructions:
        dns_instructions = {
            "note": "In your DNS provider, add a CNAME record pointing this hostname to your Vercel project. In Vercel: Project → Settings → Domains → add this domain to see the exact value.",
        }

    return {
        "status": "pending",
        "hostname": hostname,
        "message": "Domain added to project. Set the DNS record below, then call POST /api/domains/verify to verify.",
        "dns_instructions": dns_instructions,
    }


@router.post("/verify")
async def verify_domain(hostname: str = Query(..., description="Hostname to verify")):
    """
    Verify a custom domain (DNS has propagated and Vercel confirms).
    On success, marks the domain as verified in our DB so tenant resolve works.
    """
    hostname = hostname.strip().lower()
    if not hostname:
        raise HTTPException(400, "hostname is required")

    vercel_result = await verify_project_domain(hostname)
    if not vercel_result.get("ok"):
        return {
            "status": "pending",
            "verified": False,
            "error": vercel_result.get("error", "Verification failed"),
        }

    if not vercel_result.get("verified"):
        return {
            "status": "pending",
            "verified": False,
            "message": "DNS not yet configured or not propagated. Try again in a few minutes.",
            "data": vercel_result.get("data"),
        }

    if not db.pool:
        return {"status": "verified", "verified": True, "message": "Vercel verified; DB not available to update."}

    async with db.pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE custom_domains
            SET status = 'verified', verified_at = now(), updated_at = now()
            WHERE hostname = $1
            """,
            hostname,
        )

    invalidate_cors_cache()

    return {
        "status": "verified",
        "verified": True,
        "hostname": hostname,
        "message": "Domain verified. Funnel will now resolve for this hostname.",
    }


@router.post("/dns-record")
async def add_dns_record(
    domain: str = Query(..., description="Apex domain (e.g. stefanosthedev.com)"),
    name: str = Query(..., description="Subdomain name (e.g. go) or empty for root"),
    type: str = Query("CNAME", description="Record type: CNAME, A, ALIAS, TXT, etc."),
    value: str = Query(..., description="Record value (e.g. cname.vercel-dns.com)"),
    ttl: int = Query(60, ge=60, le=2147483647),
):
    """
    Create a DNS record for a domain via Vercel API.
    Domain must be on Vercel nameservers. Creates the record in Vercel DNS.
    """
    domain = domain.strip().lower()
    name = name.strip().lower() if name else ""
    value = value.strip()
    if not domain:
        raise HTTPException(400, "domain is required")
    if not value:
        raise HTTPException(400, "value is required")
    result = await create_dns_record(
        domain=domain,
        record_type=type,
        name=name,
        value=value,
        ttl=ttl,
    )
    if not result.get("ok"):
        raise HTTPException(
            result.get("code", 502),
            result.get("error", "Failed to create DNS record"),
        )
    return {"ok": True, "hostname": f"{name}.{domain}" if name else domain, "data": result.get("data")}


@router.get("/dns-instructions")
async def dns_instructions(hostname: str = Query(..., description="Hostname")):
    """
    Get DNS instructions for a hostname (what CNAME/A record to set).
    Use after connect to show the user what to add at their registrar.
    """
    hostname = hostname.strip().lower()
    if not hostname:
        raise HTTPException(400, "hostname is required")

    result = await get_domain_config(hostname)
    if not result.get("ok"):
        return {
            "hostname": hostname,
            "message": "Add this domain in Vercel (Project → Settings → Domains) to see exact DNS values.",
            "generic": "Add a CNAME record: Name = your subdomain or @, Value = cname.vercel-dns.com (or the value Vercel shows for your project).",
        }
    return {
        "hostname": hostname,
        "config": result.get("data"),
    }
