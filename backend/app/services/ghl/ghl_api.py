"""GHL API client — Custom Values, Contacts, etc. All outbound calls use shared base and headers."""
from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GHL_API_BASE = "https://services.leadconnectorhq.com"
GHL_API_VERSION = "2021-07-28"


def _headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Version": GHL_API_VERSION,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


async def get_custom_values(location_id: str, access_token: str) -> dict[str, Any]:
    """GET /locations/{locationId}/customValues. Returns GHL response (e.g. customValues list)."""
    url = f"{GHL_API_BASE}/locations/{location_id}/customValues"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token))
    if r.status_code != 200:
        logger.warning("[GHL] get_custom_values status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def create_custom_value(
    location_id: str,
    access_token: str,
    name: str,
    value: str,
) -> dict[str, Any]:
    """POST /locations/{locationId}/customValues. Body: name, value. Returns created custom value."""
    url = f"{GHL_API_BASE}/locations/{location_id}/customValues"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            url,
            headers=_headers(access_token),
            json={"name": name, "value": value},
        )
    if r.status_code not in (200, 201):
        logger.warning("[GHL] create_custom_value status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def update_custom_value(
    location_id: str,
    access_token: str,
    custom_value_id: str,
    value: str,
    name: str | None = None,
) -> dict[str, Any]:
    """PUT /locations/{locationId}/customValues/{id}. Body: value (required), name (optional)."""
    url = f"{GHL_API_BASE}/locations/{location_id}/customValues/{custom_value_id}"
    body: dict[str, str] = {"value": value}
    if name is not None:
        body["name"] = name
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.put(url, headers=_headers(access_token), json=body)
    if r.status_code != 200:
        logger.warning("[GHL] update_custom_value status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def delete_custom_value(
    location_id: str,
    access_token: str,
    custom_value_id: str,
) -> None:
    """DELETE /locations/{locationId}/customValues/{id}."""
    url = f"{GHL_API_BASE}/locations/{location_id}/customValues/{custom_value_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(url, headers=_headers(access_token))
    if r.status_code not in (200, 204):
        logger.warning("[GHL] delete_custom_value status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()


# ---------- Contacts ----------


async def create_contact(
    location_id: str,
    access_token: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """POST /contacts/. Body must include locationId; pass other contact fields (firstName, lastName, email, etc.)."""
    url = f"{GHL_API_BASE}/contacts/"
    body = {"locationId": location_id, **payload}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, headers=_headers(access_token), json=body)
    if r.status_code not in (200, 201):
        logger.warning("[GHL] create_contact status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def update_contact(
    access_token: str,
    contact_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """PUT /contacts/{contactId}. Body: contact fields to update."""
    url = f"{GHL_API_BASE}/contacts/{contact_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.put(url, headers=_headers(access_token), json=payload)
    if r.status_code != 200:
        logger.warning("[GHL] update_contact status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def search_contacts(access_token: str, body: dict[str, Any]) -> dict[str, Any]:
    """POST /contacts/search. Body: locationId, pageLimit, query (optional), etc."""
    url = f"{GHL_API_BASE}/contacts/search"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, headers=_headers(access_token), json=body)
    if r.status_code != 200:
        logger.warning("[GHL] search_contacts status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def bulk_tags(access_token: str, body: dict[str, Any]) -> dict[str, Any]:
    """POST /contacts/bulk/tags. Body per GHL docs (contactIds, tags, etc.)."""
    url = f"{GHL_API_BASE}/contacts/bulk/tags"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, headers=_headers(access_token), json=body)
    if r.status_code not in (200, 201):
        logger.warning("[GHL] bulk_tags status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


# ---------- Calendar events ----------


async def get_calendar_events(
    access_token: str,
    query_params: dict[str, str | int] | None = None,
) -> dict[str, Any]:
    """GET /calendars/events. Query params: locationId, startDate, endDate, etc. per GHL docs."""
    url = f"{GHL_API_BASE}/calendars/events"
    params = dict(query_params) if query_params else {}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
    if r.status_code != 200:
        logger.warning("[GHL] get_calendar_events status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


# ---------- Opportunities ----------


async def create_opportunity(
    location_id: str,
    access_token: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """POST /opportunities/. Body typically includes locationId, contactId, pipelineId, etc."""
    url = f"{GHL_API_BASE}/opportunities/"
    body = {"locationId": location_id, **payload}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, headers=_headers(access_token), json=body)
    if r.status_code not in (200, 201):
        logger.warning("[GHL] create_opportunity status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def update_opportunity(
    access_token: str,
    opportunity_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """PUT /opportunities/{opportunityId}. Body: fields to update."""
    url = f"{GHL_API_BASE}/opportunities/{opportunity_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.put(url, headers=_headers(access_token), json=payload)
    if r.status_code != 200:
        logger.warning("[GHL] update_opportunity status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def search_opportunities(
    access_token: str,
    query_params: dict[str, str | int] | None = None,
) -> dict[str, Any]:
    """GET /opportunities/search. GHL expects location_id (required). Pass locationId in params; we send both for compatibility."""
    url = f"{GHL_API_BASE}/opportunities/search"
    params = dict(query_params) if query_params else {}
    # GHL error "location_id can't be undefined" — send snake_case as well
    if "location_id" not in params and "locationId" in params:
        params["location_id"] = params["locationId"]
    elif "locationId" not in params and "location_id" in params:
        params["locationId"] = params["location_id"]
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
    if r.status_code != 200:
        logger.warning("[GHL] search_opportunities status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


# ---------- Snapshots ----------


async def get_snapshots(access_token: str, location_id: str) -> dict[str, Any]:
    """GET /snapshots/ — list own and imported snapshots. GHL docs: no path param; optional locationId in query."""
    url = f"{GHL_API_BASE}/snapshots/"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token), params={"locationId": location_id})
    if r.status_code != 200:
        logger.warning("[GHL] get_snapshots status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


# ---------- Funnels ----------


async def get_funnels(access_token: str, location_id: str) -> dict[str, Any]:
    """GET /funnels/ or location-scoped. Query param locationId. Returns list of funnels."""
    url = f"{GHL_API_BASE}/funnels/"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token), params={"locationId": location_id})
    if r.status_code != 200:
        logger.warning("[GHL] get_funnels status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()


async def get_funnel_pages(access_token: str, funnel_id: str) -> dict[str, Any]:
    """GET /funnels/{funnelId}/pages or similar. Returns list of funnel pages."""
    url = f"{GHL_API_BASE}/funnels/{funnel_id}/pages"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_headers(access_token))
    if r.status_code != 200:
        logger.warning("[GHL] get_funnel_pages status=%s body=%s", r.status_code, r.text[:300])
        r.raise_for_status()
    return r.json()
