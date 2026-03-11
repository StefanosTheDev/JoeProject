"""Tenant API — resolve firm_id from hostname (custom domain or platform subdomain)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from app import db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("/resolve")
async def tenant_resolve(host: str = Query(..., description="Hostname (e.g. go.client.com)")):
    """
    Resolve tenant (firm_id, default_campaign_id) from hostname.
    Used by funnel/webinar pages to determine tenant when on custom domain or platform subdomain.
    """
    if not host or not host.strip():
        raise HTTPException(400, "host is required")
    host = host.strip().lower()

    if not db.pool:
        raise HTTPException(503, "Database not available")

    async with db.pool.acquire() as conn:
        # 1) Custom domain: lookup in custom_domains (verified only)
        row = await conn.fetchrow(
            """
            SELECT firm_id, default_campaign_id
            FROM custom_domains
            WHERE hostname = $1 AND status = 'verified'
            LIMIT 1
            """,
            host,
        )
        if row:
            return {
                "firm_id": row["firm_id"],
                "default_campaign_id": row["default_campaign_id"],
                "source": "custom_domain",
            }

        # 2) Platform subdomain: slug.yourplatform.com -> firm_id = slug (if firm exists)
        base = settings.platform_base_domain
        if base and host.endswith("." + base) and host != base:
            slug = host[: -len(base) - 1].strip().lower()
            if slug and "." not in slug:
                firm_row = await conn.fetchrow(
                    "SELECT id FROM firm WHERE id = $1 LIMIT 1",
                    slug,
                )
                if firm_row:
                    return {
                        "firm_id": firm_row["id"],
                        "default_campaign_id": None,
                        "source": "subdomain",
                    }

    raise HTTPException(404, "Unknown host")
