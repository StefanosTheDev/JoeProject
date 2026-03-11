"""Mux Video API — direct upload and asset (Phase 4)."""
from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

MUX_VIDEO_BASE = "https://api.mux.com/video/v1"


def _basic_auth() -> str:
    raw = f"{settings.mux_access_token_id}:{settings.mux_secret_key}"
    return base64.b64encode(raw.encode()).decode()


async def create_direct_upload(
    *,
    cors_origin: str = "*",
    playback_policies: list[str] | None = None,
) -> dict[str, Any]:
    """
    Create a direct upload URL. Client uploads video to the returned URL;
    Mux creates the asset and processes it. Returns upload_id and url.
    """
    if not settings.mux_access_token_id or not settings.mux_secret_key:
        return {"ok": False, "error": "Mux credentials not configured"}
    payload = {
        "cors_origin": cors_origin,
        "new_asset_settings": {
            "playback_policies": playback_policies or ["public"],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{MUX_VIDEO_BASE}/uploads",
                json=payload,
                headers={
                    "Authorization": f"Basic {_basic_auth()}",
                    "Content-Type": "application/json",
                },
            )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": data.get("error", {}).get("message", r.text)}
        upload = data.get("data", {})
        return {
            "ok": True,
            "upload_id": upload.get("id"),
            "url": upload.get("url"),
            "asset_id": upload.get("asset_id"),  # only set after upload completes (status asset_created)
        }
    except Exception as e:
        logger.exception("Mux create_direct_upload failed: %s", e)
        return {"ok": False, "error": str(e)}


async def get_upload(upload_id: str) -> dict[str, Any]:
    """Get direct upload status; asset_id is present when status is asset_created."""
    if not settings.mux_access_token_id or not settings.mux_secret_key:
        return {"ok": False, "error": "Mux credentials not configured"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{MUX_VIDEO_BASE}/uploads/{upload_id}",
                headers={"Authorization": f"Basic {_basic_auth()}"},
            )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": data.get("error", {}).get("message", r.text)}
        upload = data.get("data", {})
        return {
            "ok": True,
            "status": upload.get("status"),
            "asset_id": upload.get("asset_id"),
        }
    except Exception as e:
        logger.exception("Mux get_upload failed: %s", e)
        return {"ok": False, "error": str(e)}


async def get_asset(asset_id: str) -> dict[str, Any]:
    """Get asset details; includes playback_ids for HLS URL."""
    if not settings.mux_access_token_id or not settings.mux_secret_key:
        return {"ok": False, "error": "Mux credentials not configured"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{MUX_VIDEO_BASE}/assets/{asset_id}",
                headers={"Authorization": f"Basic {_basic_auth()}"},
            )
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            return {"ok": False, "error": data.get("error", {}).get("message", r.text)}
        asset = data.get("data", {})
        playback_ids = asset.get("playback_ids", [])
        playback_id = playback_ids[0].get("id") if playback_ids else None
        return {
            "ok": True,
            "status": asset.get("status"),
            "playback_id": playback_id,
            "duration": asset.get("duration"),
        }
    except Exception as e:
        logger.exception("Mux get_asset failed: %s", e)
        return {"ok": False, "error": str(e)}
