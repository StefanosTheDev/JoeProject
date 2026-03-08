"""GHL router — OAuth URL, callback, connection status, disconnect, test API call."""
from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.requests import Request

from app import db
from app.config import settings
from app.models.ghl_models import (
    CreateContactRequest,
    CreateCustomValueRequest,
    DisconnectResponse,
    GHLConnectionStatus,
    OAuthUrlResponse,
    SearchContactsRequest,
    UpdateContactRequest,
    UpdateCustomValueRequest,
)
from app.services.ghl import ghl_oauth as oauth
from app.services.ghl import ghl_api
from app.services.ghl import disconnect as ghl_disconnect_svc
from app.services.ghl import get_connection_status as ghl_get_status
from app.services.ghl import upsert_connection as ghl_upsert
from app.services.ghl.webhooks import process_webhook, verify_webhook_signature

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ghl"])

GHL_API_BASE = "https://services.leadconnectorhq.com"
GHL_API_VERSION = "2021-07-28"


@router.get("/connect/oauth/url", response_model=OAuthUrlResponse)
async def ghl_oauth_url(firm_id: str = Query(..., description="Firm ID to link the connection to")):
    """Return the GHL OAuth authorization URL. Frontend redirects user there to connect their sub-account."""
    logger.info("[GHL] oauth/url requested firm_id=%s redirect_uri=%s", firm_id, settings.ghl_redirect_uri)
    if not settings.ghl_client_id or not settings.ghl_redirect_uri:
        raise HTTPException(503, "GHL OAuth not configured (GHL_CLIENT_ID, GHL_REDIRECT_URI)")
    try:
        url = oauth.get_oauth_connect_url(firm_id)
        logger.info("[GHL] oauth/url returning URL (user should open this in browser and approve)")
        return OAuthUrlResponse(url=url)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ghl_oauth_url failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/connect/oauth/callback")
async def ghl_oauth_callback(
    code: str = Query(..., description="Authorization code from GHL"),
    state: str = Query(..., description="State (firm_id) passed to OAuth"),
):
    """Exchange code for tokens, store in ghl_connections, redirect to frontend."""
    firm_id = state
    logger.info(
        "[GHL] callback RECEIVED firm_id=%s code_len=%s (if you never see this, GHL is not redirecting to our URL)",
        firm_id,
        len(code) if code else 0,
    )
    if not db.pool:
        logger.error("[GHL] callback failed: database not available")
        raise HTTPException(503, "Database not available")
    if not settings.ghl_client_id or not settings.ghl_redirect_uri:
        logger.error("[GHL] callback failed: GHL OAuth not configured")
        raise HTTPException(503, "GHL OAuth not configured")

    try:
        data = await oauth.exchange_code_for_tokens(code)
        logger.info("[GHL] token exchange OK location_id=%s", data.get("location_id"))
    except Exception as e:
        logger.warning("[GHL] token exchange FAILED: %s", e)
        return RedirectResponse(
            url=f"/api/connect/oauth/success?firm_id={firm_id}&error=exchange_failed",
            status_code=302,
        )

    try:
        await ghl_upsert(db.pool, firm_id, data)
        logger.info("[GHL] connection saved for firm_id=%s redirecting to success", firm_id)
        return RedirectResponse(
            url=f"/api/connect/oauth/success?firm_id={firm_id}",
            status_code=302,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GHL] callback upsert failed: %s", e)
        return RedirectResponse(
            url=f"/api/connect/oauth/success?firm_id={firm_id}&error=server_error",
            status_code=302,
        )


@router.get("/connect/oauth/success", response_class=HTMLResponse)
async def ghl_oauth_success(
    firm_id: str = Query("", description="Firm ID from OAuth state"),
    error: str = Query("", description="Error key if callback failed"),
):
    """Simple success (or error) page after OAuth callback. Shown when frontend isn't used."""
    logger.info("[GHL] success page hit firm_id=%s error=%s", firm_id or "-", error or "none")
    if error:
        msg = "Connection failed. Try again or check backend logs."
        if "exchange" in error:
            msg = "Token exchange failed. Check GHL client credentials and redirect URL."
        if "server_error" in error:
            msg = "Server error while saving connection. Check backend logs."
        body = f"<h1>GHL connect failed</h1><p>{msg}</p><p>firm_id: {firm_id or '—'}</p>"
    else:
        _fid = firm_id or "test-firm-1"
        body = (
            f"<h1>GHL connected</h1>"
            f"<p>firm_id: <code>{firm_id or '—'}</code></p>"
            "<p>You can close this window and check connection: "
            f"<a href='/api/connect/connection?firm_id={_fid}'>/api/connect/connection</a></p>"
        )
    return f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>GHL Connect</title></head><body>{body}</body></html>"


@router.get("/connect/connection", response_model=GHLConnectionStatus)
async def ghl_connection_status(
    firm_id: str = Query(..., description="Firm ID"),
):
    """Return GHL connection status (no token). For UI: show Connect vs Connected and location_id."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        status = await ghl_get_status(db.pool, firm_id)
        return GHLConnectionStatus(**status)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ghl_connection_status failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/connect/test")
async def ghl_test_api(
    firm_id: str = Query("firm-1", description="Firm ID to use for the token"),
):
    """
    Test that the stored token works by calling GHL API: GET location (sub-account) details.
    Proves we can hit the API with the connected account.
    """
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    url = f"{GHL_API_BASE}/locations/{location_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Version": GHL_API_VERSION,
                "Accept": "application/json",
            },
        )
    if r.status_code != 200:
        logger.warning("[GHL] test API failed status=%s body=%s", r.status_code, r.text[:300])
        raise HTTPException(r.status_code, f"GHL API error: {r.text[:200]}")
    data = r.json()
    logger.info("[GHL] test API OK location_id=%s name=%s", location_id, data.get("location", {}).get("name"))
    return {"ok": True, "location_id": location_id, "location": data.get("location", data)}


@router.get("/connect/custom-values")
async def ghl_get_custom_values(firm_id: str = Query(..., description="Firm ID")):
    """Return GHL custom values for the connected location. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.get_custom_values(location_id, access_token)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] get_custom_values HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] get_custom_values failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.post("/connect/custom-values")
async def ghl_create_custom_value(body: CreateCustomValueRequest):
    """Create a GHL custom value. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, body.firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.create_custom_value(
            location_id, access_token, body.name, body.value
        )
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] create_custom_value HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] create_custom_value failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.put("/connect/custom-values/{custom_value_id}")
async def ghl_update_custom_value(custom_value_id: str, body: UpdateCustomValueRequest):
    """Update a GHL custom value by id. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, body.firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.update_custom_value(
            location_id, access_token, custom_value_id, body.value, body.name
        )
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] update_custom_value HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] update_custom_value failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.delete("/connect/custom-values/{custom_value_id}")
async def ghl_delete_custom_value(
    custom_value_id: str,
    firm_id: str = Query(..., description="Firm ID"),
):
    """Delete a GHL custom value by id. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        await ghl_api.delete_custom_value(location_id, access_token, custom_value_id)
        return {"ok": True, "id": custom_value_id}
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] delete_custom_value HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] delete_custom_value failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Contacts ----------


@router.post("/connect/contacts")
async def ghl_create_contact(body: CreateContactRequest):
    """Create a GHL contact. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, body.firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    payload = body.model_dump(exclude={"firm_id"})
    try:
        data = await ghl_api.create_contact(location_id, access_token, payload)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] create_contact HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] create_contact failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.put("/connect/contacts/{contact_id}")
async def ghl_update_contact(contact_id: str, body: UpdateContactRequest):
    """Update a GHL contact by id. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, _ = await oauth.get_valid_access_token(db.pool, body.firm_id)
    if not access_token:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    payload = body.model_dump(exclude={"firm_id"})
    try:
        data = await ghl_api.update_contact(access_token, contact_id, payload)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] update_contact HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] update_contact failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.post("/connect/contacts/search")
async def ghl_search_contacts(body: SearchContactsRequest):
    """Search GHL contacts. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, body.firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    search_body = {
        "locationId": location_id,
        "pageLimit": body.page_limit,
        **(body.model_dump(exclude={"firm_id", "query", "page_limit"})),
    }
    if body.query is not None:
        search_body["query"] = body.query
    try:
        data = await ghl_api.search_contacts(access_token, search_body)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] search_contacts HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] search_contacts failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Calendar ----------


@router.get("/connect/calendar/events")
async def ghl_get_calendar_events(
    firm_id: str = Query(..., description="Firm ID"),
    calendar_id: str | None = Query(None, description="GHL calendar ID (required by GHL; get from calendars list)"),
    start_time: str | None = Query(None, description="Start time ISO string (required by GHL)"),
    end_time: str | None = Query(None, description="End time ISO string (required by GHL)"),
):
    """GET GHL calendar events. GHL requires one of calendarId/userId/groupId and startTime/endTime as strings."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    params: dict[str, str] = {"locationId": location_id}
    if calendar_id:
        params["calendarId"] = calendar_id
    if start_time:
        params["startTime"] = start_time
    if end_time:
        params["endTime"] = end_time
    try:
        data = await ghl_api.get_calendar_events(access_token, params)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] get_calendar_events HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] get_calendar_events failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Opportunities ----------


@router.post("/connect/opportunities")
async def ghl_create_opportunity(body: dict):
    """Create a GHL opportunity. Body: firm_id + contactId, pipelineId, etc. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    firm_id = body.get("firm_id")
    if not firm_id:
        raise HTTPException(400, "firm_id required")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    payload = {k: v for k, v in body.items() if k != "firm_id"}
    try:
        data = await ghl_api.create_opportunity(location_id, access_token, payload)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] create_opportunity HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] create_opportunity failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.put("/connect/opportunities/{opportunity_id}")
async def ghl_update_opportunity(opportunity_id: str, body: dict):
    """Update a GHL opportunity. Body: firm_id + fields to update. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    firm_id = body.get("firm_id")
    if not firm_id:
        raise HTTPException(400, "firm_id required")
    access_token, _ = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    payload = {k: v for k, v in body.items() if k != "firm_id"}
    try:
        data = await ghl_api.update_opportunity(access_token, opportunity_id, payload)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] update_opportunity HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] update_opportunity failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/connect/opportunities/search")
async def ghl_search_opportunities(
    firm_id: str = Query(..., description="Firm ID"),
    pipeline_id: str | None = Query(None),
    contact_id: str | None = Query(None),
):
    """Search GHL opportunities. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    params: dict[str, str] = {"locationId": location_id, "location_id": location_id}
    if pipeline_id:
        params["pipelineId"] = pipeline_id
    if contact_id:
        params["contactId"] = contact_id
    try:
        data = await ghl_api.search_opportunities(access_token, params)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] search_opportunities HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] search_opportunities failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Snapshots ----------


@router.get("/connect/snapshots")
async def ghl_get_snapshots(firm_id: str = Query(..., description="Firm ID")):
    """GET GHL snapshots for the location. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.get_snapshots(access_token, location_id)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] get_snapshots HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] get_snapshots failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Funnels ----------


@router.get("/connect/funnels")
async def ghl_get_funnels(firm_id: str = Query(..., description="Firm ID")):
    """GET GHL funnels for the location. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, location_id = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token or not location_id:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.get_funnels(access_token, location_id)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] get_funnels HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] get_funnels failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/connect/funnels/{funnel_id}/pages")
async def ghl_get_funnel_pages(
    funnel_id: str,
    firm_id: str = Query(..., description="Firm ID"),
):
    """GET GHL funnel pages for a funnel. 404 if not connected."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    access_token, _ = await oauth.get_valid_access_token(db.pool, firm_id)
    if not access_token:
        raise HTTPException(404, "Not connected: connect GHL first for this firm_id")
    try:
        data = await ghl_api.get_funnel_pages(access_token, funnel_id)
        return data
    except httpx.HTTPStatusError as e:
        logger.warning("[GHL] get_funnel_pages HTTP error: %s", e)
        raise HTTPException(e.response.status_code, e.response.text[:200])
    except Exception as e:
        logger.exception("[GHL] get_funnel_pages failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- Webhooks ----------


@router.post("/connect/webhooks")
async def ghl_webhook_receiver(request: Request):
    """Receive GHL webhooks: log, dispatch Contact/Appointment/Opportunity handlers. Optional signature verification."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    raw_body = await request.body()
    if settings.ghl_webhook_signing_secret:
        sig = request.headers.get("X-HighLevel-Signature")
        if not verify_webhook_signature(raw_body, sig, settings.ghl_webhook_signing_secret):
            logger.warning("[GHL webhook] invalid or missing signature")
            raise HTTPException(401, "Invalid webhook signature")
    await process_webhook(db.pool, raw_body)
    return {"ok": True}


@router.post("/connect/disconnect", response_model=DisconnectResponse)
async def ghl_disconnect(firm_id: str = Query(...)):
    """Disconnect GHL for the given firm (set status to revoked)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        await ghl_disconnect_svc(db.pool, firm_id)
        return DisconnectResponse(ok=True, firm_id=firm_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ghl_disconnect failed: %s", e)
        raise HTTPException(500, "Internal server error")
