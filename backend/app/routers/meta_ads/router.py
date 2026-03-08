"""Meta Ads router — OAuth, connection, insights, launch, CAPI. HTTP only; delegates to services."""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from app import db
from app.config import settings
from app.dependencies import require_meta_cron_secret
from app.models.meta_ads_models import (
    CAPIEventBody,
    LaunchPayloadBody,
    MetaCapiEventResponse,
    MetaCapiLogResponse,
    MetaConnectionStatus,
    MetaDisconnectResponse,
    MetaInsightsLatestResponse,
    MetaInsightsSyncResponse,
    MetaLaunchPreviewResponse,
    MetaLaunchResponse,
    MetaOAuthUrlResponse,
    MetaRulesListResponse,
)
from app.services.meta_ads import meta_ads_oauth as oauth
from app.services.meta_ads import meta_ads_insights as insights_svc
from app.services.meta_ads import meta_ads_launch as launch_svc
from app.services.meta_ads import meta_ads_connection as connection_svc
from app.services.meta_ads import meta_capi as capi_svc
from app.services.meta_ads import meta_rules as rules_svc

logger = logging.getLogger(__name__)
router = APIRouter(tags=["meta_ads"])


# ---------- OAuth ----------


@router.get("/meta/oauth/url", response_model=MetaOAuthUrlResponse)
async def meta_oauth_url(firm_id: str = Query(..., description="Firm ID to link the connection to")):
    """Return the Meta OAuth authorization URL. Frontend redirects user there."""
    if not settings.meta_app_id or not settings.meta_redirect_uri:
        raise HTTPException(503, "Meta OAuth not configured (META_APP_ID, META_REDIRECT_URI)")
    try:
        url = oauth.get_oauth_connect_url(firm_id)
        return MetaOAuthUrlResponse(url=url)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_oauth_url failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/meta/oauth/callback")
async def meta_oauth_callback(
    code: str = Query(..., description="Authorization code from Meta"),
    state: str = Query(..., description="State (firm_id) passed to OAuth"),
):
    """Exchange code for long-lived token, fetch ad account, store connection. Redirects to frontend."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    if not settings.meta_app_id or not settings.meta_redirect_uri:
        raise HTTPException(503, "Meta OAuth not configured")

    firm_id = state
    try:
        access_token, expires_in = await oauth.exchange_code_for_long_lived_token(code)
    except Exception:
        return RedirectResponse(
            url=f"{settings.frontend_origin}/amplify-os/deploy?meta_connect=error&message=exchange_failed",
            status_code=302,
        )

    expires_at = oauth.token_expires_at_from_expires_in(expires_in)
    ad_account_id = None
    page_id = None
    try:
        accounts = await oauth.fetch_me_adaccounts(access_token)
        if accounts:
            ad_account_id = accounts[0].get("id")
        pages = await oauth.fetch_me_pages(access_token)
        if pages:
            page_id = pages[0].get("id")
    except Exception:
        pass

    try:
        await connection_svc.upsert_connection(
            db.pool, firm_id, access_token, expires_at, ad_account_id=ad_account_id, page_id=page_id
        )
        return RedirectResponse(
            url=f"{settings.frontend_origin}/amplify-os/deploy?meta_connect=success",
            status_code=302,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_oauth_callback upsert failed: %s", e)
        return RedirectResponse(
            url=f"{settings.frontend_origin}/amplify-os/deploy?meta_connect=error&message=server_error",
            status_code=302,
        )


@router.get("/meta/connection", response_model=MetaConnectionStatus)
async def meta_connection_status(
    firm_id: str = Query(..., description="Firm ID"),
):
    """Return connection status (no token). Used by frontend to show Connect vs Connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        status = await connection_svc.get_connection_status(db.pool, firm_id)
        return MetaConnectionStatus(**status)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_connection_status failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.post("/meta/disconnect", response_model=MetaDisconnectResponse)
async def meta_disconnect(firm_id: str = Query(...)):
    """Disconnect Meta for the given firm (set status to revoked)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        await connection_svc.disconnect(db.pool, firm_id)
        return MetaDisconnectResponse(ok=True, firm_id=firm_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_disconnect failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Insights ----------


@router.post("/meta/insights/sync", response_model=MetaInsightsSyncResponse)
async def meta_insights_sync(
    firm_id: str = Query(...),
    date_preset: str = Query("last_7d", description="Meta date_preset"),
    dry_run: bool = Query(False),
    _: None = Depends(require_meta_cron_secret),
):
    """Trigger insights sync for the firm's Meta connection. Stores data in meta_insights."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        result = await insights_svc.sync_insights_for_connection(
            db.pool,
            firm_id,
            trigger="manual",
            dry_run=dry_run,
            date_preset=date_preset,
        )
        return MetaInsightsSyncResponse(
            run_id=result.run_id,
            connection_id=result.connection_id,
            total_objects=result.total_objects,
            synced_objects=result.synced_objects,
            failed_objects=result.failed_objects,
            error_text=result.error_text,
            errors=result.errors or [],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_insights_sync failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/meta/insights", response_model=MetaInsightsLatestResponse)
async def meta_insights_latest(
    firm_id: str = Query(..., description="Firm ID"),
):
    """Return latest aggregated insights from DB (no live Meta call)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        data = await insights_svc.get_latest_insights(db.pool, firm_id)
        if data is None:
            return MetaInsightsLatestResponse(connected=False, summary=None)
        return MetaInsightsLatestResponse(connected=True, **data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_insights_latest failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Launch (Phase 3) ----------


@router.get("/meta/launch/preview", response_model=MetaLaunchPreviewResponse)
async def meta_launch_preview(
    firm_id: str = Query(..., description="Firm ID"),
):
    """Return connection and existing launched campaigns for preview."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        data = await launch_svc.get_launch_preview(db.pool, firm_id)
        if data is None:
            return MetaLaunchPreviewResponse(connected=False, campaigns=[])
        return MetaLaunchPreviewResponse(connected=True, **data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_launch_preview failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.post("/meta/launch", response_model=MetaLaunchResponse)
async def meta_launch(body: LaunchPayloadBody):
    """Create paused campaign stack in Meta (Campaign -> Ad Set -> Creative -> Ad)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        payload = launch_svc.LaunchPayload(
            firm_id=body.firm_id,
            campaign_name=body.campaign_name,
            daily_budget_cents=body.daily_budget_cents,
            age_min=body.age_min,
            age_max=body.age_max,
            geography_description=body.geography_description,
            page_id=body.page_id,
            primary_text=body.primary_text,
            headline=body.headline,
            description=body.description,
            cta=body.cta,
            link_url=body.link_url,
            image_url=body.image_url,
        )
        result = await launch_svc.create_paused_campaign_stack(
            db.pool,
            payload,
            campaign_id=body.campaign_id,
            asset_id=body.asset_id,
        )
        if not result.success:
            raise HTTPException(400, result.error or "Launch failed")
        return MetaLaunchResponse(
            success=True,
            meta_campaign_id=result.meta_campaign_id,
            meta_adset_id=result.meta_adset_id,
            meta_creative_id=result.meta_creative_id,
            meta_ad_id=result.meta_ad_id,
            meta_campaigns_row_id=result.meta_campaigns_row_id,
            meta_ads_row_id=result.meta_ads_row_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_launch failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- CAPI & Rules (Phase 4) ----------


@router.post("/meta/capi/event", response_model=MetaCapiEventResponse)
async def meta_capi_send_event(body: CAPIEventBody):
    """Send a single conversion event to Meta CAPI. Event_id must be string for deduplication."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    event_time = None
    if body.event_time:
        try:
            event_time = datetime.fromisoformat(body.event_time.replace("Z", "+00:00"))
        except ValueError:
            pass
    try:
        success, err = await capi_svc.send_event(
            db.pool,
            body.firm_id,
            event_name=body.event_name,
            event_id=body.event_id,
            event_time=event_time,
            email=body.email,
            phone=body.phone,
            fbp=body.fbp,
            fbc=body.fbc,
            action_source=body.action_source,
            custom_data=body.custom_data,
        )
        if not success:
            raise HTTPException(400, err or "CAPI send failed")
        return MetaCapiEventResponse(success=True)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_capi_send_event failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/meta/capi/log", response_model=MetaCapiLogResponse)
async def meta_capi_log(
    firm_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
):
    """Return recent CAPI events for observability."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        events = await capi_svc.get_recent_conversions(db.pool, firm_id, limit=limit)
        return MetaCapiLogResponse(events=events)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_capi_log failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/meta/rules", response_model=MetaRulesListResponse)
async def meta_rules_list(
    firm_id: str = Query(...),
):
    """List rules for the firm."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        rules = await rules_svc.list_rules(db.pool, firm_id)
        return MetaRulesListResponse(rules=rules)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("meta_rules_list failed: %s", e)
        raise HTTPException(500, "Internal server error")
