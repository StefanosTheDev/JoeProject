"""Meta Ads launch — create Campaign -> Ad Set -> Ad Creative -> Ad (all PAUSED)."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import asyncpg
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

META_GRAPH_BASE = "https://graph.facebook.com"


@dataclass
class LaunchPayload:
    """Input for launch (from frontend/wizard)."""
    firm_id: str
    campaign_name: str
    daily_budget_cents: int
    age_min: int = 55
    age_max: int = 67
    geography_description: str = ""
    page_id: str | None = None
    primary_text: str = ""
    headline: str = ""
    description: str = ""
    cta: str = "LEARN_MORE"
    link_url: str = ""
    image_url: str | None = None


@dataclass
class LaunchResult:
    """Result of create_paused_campaign_stack."""
    success: bool = False
    meta_campaign_id: str | None = None
    meta_adset_id: str | None = None
    meta_creative_id: str | None = None
    meta_ad_id: str | None = None
    meta_campaigns_row_id: str | None = None
    meta_ads_row_id: str | None = None
    error: str | None = None


def _ad_account_id(raw: str) -> str:
    return raw if str(raw).startswith("act_") else f"act_{raw}"


async def _get_connection(pool: asyncpg.Pool, firm_id: str) -> asyncpg.Record | None:
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT id, access_token, ad_account_id, page_id
            FROM meta_connections
            WHERE firm_id = $1 AND status = 'active'
            """,
            firm_id,
        )


async def _insert_meta_campaign(
    pool: asyncpg.Pool,
    firm_id: str,
    campaign_id: str | None,
    meta_campaign_id: str,
    meta_adset_id: str,
    name: str,
    status: str = "PAUSED",
) -> str:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """
            INSERT INTO meta_campaigns (firm_id, campaign_id, meta_campaign_id, meta_adset_id, name, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """,
            firm_id,
            campaign_id,
            meta_campaign_id,
            meta_adset_id,
            name,
            status,
        )


async def _insert_meta_ad(
    pool: asyncpg.Pool,
    meta_campaigns_row_id: str,
    meta_ad_id: str,
    meta_creative_id: str,
    asset_id: str | None,
    status: str = "PAUSED",
) -> str:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """
            INSERT INTO meta_ads (meta_campaign_id, meta_ad_id, meta_creative_id, asset_id, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            """,
            meta_campaigns_row_id,
            meta_ad_id,
            meta_creative_id,
            asset_id,
            status,
        )


async def create_paused_campaign_stack(
    pool: asyncpg.Pool,
    payload: LaunchPayload,
    *,
    campaign_id: str | None = None,
    asset_id: str | None = None,
) -> LaunchResult:
    """
    Create Campaign -> Ad Set -> Ad Creative -> Ad in Meta (all PAUSED).
    Persist mapping in meta_campaigns and meta_ads.
    """
    result = LaunchResult()
    conn_row = await _get_connection(pool, payload.firm_id)
    if not conn_row:
        result.error = "No active Meta connection for this firm"
        return result

    connection_id = conn_row["id"]
    access_token = conn_row["access_token"]
    ad_account_id = _ad_account_id(conn_row["ad_account_id"] or "")
    page_id = payload.page_id or conn_row["page_id"]

    if not ad_account_id or ad_account_id == "act_":
        result.error = "Meta connection has no ad account"
        return result
    if not page_id:
        result.error = "Page ID required for lead ads (connect Meta or pass page_id)"
        return result

    version = settings.meta_api_version
    params = {"access_token": access_token}

    async with httpx.AsyncClient(timeout=60.0) as client:
        # Step 1: Create Campaign
        try:
            r1 = await client.post(
                f"{META_GRAPH_BASE}/{version}/{ad_account_id}/campaigns",
                params=params,
                json={
                    "name": payload.campaign_name[:200],
                    "objective": "OUTCOME_LEADS",
                    "status": "PAUSED",
                    "special_ad_categories": [],
                    "daily_budget": payload.daily_budget_cents,
                },
            )
            r1.raise_for_status()
            data1 = r1.json()
            meta_campaign_id = data1.get("id")
            if not meta_campaign_id:
                result.error = "No campaign id in Meta response"
                return result
        except httpx.HTTPStatusError as e:
            result.error = f"Meta campaign create: {e.response.status_code} {e.response.text}"
            return result

        # Step 2: Create Ad Set
        targeting = {
            "age_min": payload.age_min,
            "age_max": payload.age_max,
            "genders": [0],
            "publisher_platforms": ["facebook", "instagram"],
        }
        if payload.geography_description:
            targeting["geo_locations"] = {"regions": [{"key": payload.geography_description}]}

        try:
            r2 = await client.post(
                f"{META_GRAPH_BASE}/{version}/{ad_account_id}/adsets",
                params=params,
                json={
                    "name": f"{payload.campaign_name[:150]} — Ad Set",
                    "campaign_id": meta_campaign_id,
                    "billing_event": "IMPRESSIONS",
                    "optimization_goal": "LEAD_GENERATION",
                    "daily_budget": payload.daily_budget_cents,
                    "targeting": targeting,
                    "promoted_object": {"page_id": str(page_id)},
                    "status": "PAUSED",
                },
            )
            r2.raise_for_status()
            data2 = r2.json()
            meta_adset_id = data2.get("id")
            if not meta_adset_id:
                result.error = "No ad set id in Meta response"
                return result
        except httpx.HTTPStatusError as e:
            result.error = f"Meta ad set create: {e.response.status_code} {e.response.text}"
            return result

        # Step 3: Image or link creative
        image_hash = None
        if payload.image_url:
            try:
                r_img = await client.post(
                    f"{META_GRAPH_BASE}/{version}/{ad_account_id}/adimages",
                    params=params,
                    data={"url": payload.image_url},
                )
                r_img.raise_for_status()
                imgs = r_img.json()
                if "images" in imgs:
                    image_hash = list(imgs["images"].values())[0].get("hash")
            except Exception as e:
                logger.warning("Meta ad image upload failed: %s", e)

        # Build object_story_spec for link ad (no image) or image ad
        if image_hash:
            object_story_spec = {
                "page_id": str(page_id),
                "link_data": {
                    "message": payload.primary_text[:2000] or "Learn more",
                    "name": payload.headline[:200] or "Offer",
                    "description": payload.description[:200] or "",
                    "link": payload.link_url or "https://www.facebook.com",
                    "call_to_action": {"type": payload.cta, "value": {"link": payload.link_url or "https://www.facebook.com"}},
                    "image_hash": image_hash,
                },
            }
        else:
            object_story_spec = {
                "page_id": str(page_id),
                "link_data": {
                    "message": payload.primary_text[:2000] or "Learn more",
                    "name": payload.headline[:200] or "Offer",
                    "description": payload.description[:200] or "",
                    "link": payload.link_url or "https://www.facebook.com",
                    "call_to_action": {"type": payload.cta, "value": {"link": payload.link_url or "https://www.facebook.com"}},
                },
            }

        # Step 4: Create Ad Creative
        try:
            r3 = await client.post(
                f"{META_GRAPH_BASE}/{version}/{ad_account_id}/adcreatives",
                params=params,
                json={
                    "name": f"{payload.campaign_name[:150]} — Creative",
                    "object_story_spec": object_story_spec,
                },
            )
            r3.raise_for_status()
            data3 = r3.json()
            meta_creative_id = data3.get("id")
            if not meta_creative_id:
                result.error = "No creative id in Meta response"
                return result
        except httpx.HTTPStatusError as e:
            result.error = f"Meta ad creative create: {e.response.status_code} {e.response.text}"
            return result

        # Step 5: Create Ad
        try:
            r4 = await client.post(
                f"{META_GRAPH_BASE}/{version}/{ad_account_id}/ads",
                params=params,
                json={
                    "name": f"{payload.campaign_name[:150]} — Ad",
                    "adset_id": meta_adset_id,
                    "creative": {"creative_id": meta_creative_id},
                    "status": "PAUSED",
                },
            )
            r4.raise_for_status()
            data4 = r4.json()
            meta_ad_id = data4.get("id")
            if not meta_ad_id:
                result.error = "No ad id in Meta response"
                return result
        except httpx.HTTPStatusError as e:
            result.error = f"Meta ad create: {e.response.status_code} {e.response.text}"
            return result

    # Persist mapping
    try:
        meta_campaigns_row_id = await _insert_meta_campaign(
            pool,
            payload.firm_id,
            campaign_id,
            meta_campaign_id,
            meta_adset_id,
            payload.campaign_name,
            "PAUSED",
        )
        meta_ads_row_id = await _insert_meta_ad(
            pool,
            meta_campaigns_row_id,
            meta_ad_id,
            meta_creative_id,
            asset_id,
            "PAUSED",
        )
    except Exception as e:
        result.error = f"DB insert: {e}"
        return result

    result.success = True
    result.meta_campaign_id = meta_campaign_id
    result.meta_adset_id = meta_adset_id
    result.meta_creative_id = meta_creative_id
    result.meta_ad_id = meta_ad_id
    result.meta_campaigns_row_id = meta_campaigns_row_id
    result.meta_ads_row_id = meta_ads_row_id
    return result


async def get_launch_preview(pool: asyncpg.Pool, firm_id: str) -> dict | None:
    """Return connection status and any existing launched campaigns for preview."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT mc.id, mc.ad_account_id, mc.page_id, mc.status
            FROM meta_connections mc
            WHERE mc.firm_id = $1 AND mc.status = 'active'
            """,
            firm_id,
        )
    if not row:
        return None
    async with pool.acquire() as conn:
        campaigns = await conn.fetch(
            """
            SELECT id, name, meta_campaign_id, meta_adset_id, status, created_at
            FROM meta_campaigns
            WHERE firm_id = $1
            ORDER BY created_at DESC
            LIMIT 10
            """,
            firm_id,
        )
    return {
        "connection_id": row["id"],
        "ad_account_id": row["ad_account_id"],
        "page_id": row["page_id"],
        "status": row["status"],
        "campaigns": [
            {
                "id": c["id"],
                "name": c["name"],
                "meta_campaign_id": c["meta_campaign_id"],
                "meta_adset_id": c["meta_adset_id"],
                "status": c["status"],
                "created_at": c["created_at"].isoformat() if c["created_at"] else None,
            }
            for c in campaigns
        ],
    }
