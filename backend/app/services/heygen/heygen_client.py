"""
HeyGen API client — Direct API auth via X-Api-Key.

Docs: https://docs.heygen.com/docs/quick-start
Auth: https://docs.heygen.com/docs/api-key
- Direct API uses API Key (billing: API dashboard balance).
- All requests use header: X-Api-Key.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

HEYGEN_API_BASE = "https://api.heygen.com"
DEFAULT_TIMEOUT = 30.0


def _headers() -> dict[str, str]:
    """Request headers with API key. Call only when key is configured."""
    key = settings.heygen_api_key
    if not key:
        raise ValueError("HEYGEN_API_KEY is not set")
    return {
        "X-Api-Key": key,
        "Content-Type": "application/json",
    }


async def verify_connection() -> dict[str, Any]:
    """
    Verify HeyGen API key by calling a minimal endpoint (list avatars).
    Returns a dict with success flag and optional error/response details.
    """
    if not settings.heygen_api_key:
        return {
            "ok": False,
            "error": "HEYGEN_API_KEY is not configured",
            "detail": "Set HEYGEN_API_KEY in .env (from HeyGen Settings → API).",
        }
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(
                f"{HEYGEN_API_BASE}/v2/avatars",
                headers=_headers(),
            )
        if r.status_code == 200:
            data = r.json()
            return {
                "ok": True,
                "message": "HeyGen API key is valid",
                "avatars_count": len(data.get("data", {}).get("avatars", [])),
            }
        return {
            "ok": False,
            "error": f"HeyGen API returned {r.status_code}",
            "detail": r.text[:500] if r.text else None,
        }
    except httpx.TimeoutException as e:
        logger.warning("HeyGen verify_connection timeout: %s", e)
        return {"ok": False, "error": "Request timed out", "detail": str(e)}
    except Exception as e:
        logger.exception("HeyGen verify_connection failed")
        return {"ok": False, "error": str(e), "detail": None}


async def list_avatars() -> dict[str, Any]:
    """List all avatars. GET /v2/avatars. Returns { ok, avatars: [{ avatar_id, avatar_name, avatar_type }], error? }."""
    if not settings.heygen_api_key:
        return {"ok": False, "avatars": [], "error": "HEYGEN_API_KEY is not configured"}
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(f"{HEYGEN_API_BASE}/v2/avatars", headers=_headers())
        if r.status_code != 200:
            return {"ok": False, "avatars": [], "error": f"HeyGen returned {r.status_code}", "detail": (r.text or "")[:500]}
        data = r.json()
        raw = (data.get("data") or {}).get("avatars") or []
        avatars = []
        for a in raw if isinstance(raw, list) else []:
            if isinstance(a, dict):
                avatars.append({
                    "avatar_id": a.get("avatar_id") or a.get("id", ""),
                    "avatar_name": a.get("avatar_name") or a.get("name"),
                    "avatar_type": a.get("avatar_type") or a.get("type"),
                })
        return {"ok": True, "avatars": avatars, "error": None}
    except Exception as e:
        logger.exception("HeyGen list_avatars failed")
        return {"ok": False, "avatars": [], "error": str(e), "detail": None}


async def list_templates() -> dict[str, Any]:
    """List templates. GET /v2/templates. Returns { ok, templates: [{ template_id, name }], error? }."""
    if not settings.heygen_api_key:
        return {"ok": False, "templates": [], "error": "HEYGEN_API_KEY is not configured"}
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(f"{HEYGEN_API_BASE}/v2/templates", headers=_headers())
        if r.status_code != 200:
            return {"ok": False, "templates": [], "error": f"HeyGen returned {r.status_code}", "detail": (r.text or "")[:500]}
        data = r.json()
        raw = data.get("data", data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        if isinstance(raw, dict):
            raw = raw.get("templates", raw.get("template_list", []))
        if not isinstance(raw, list):
            raw = []
        templates = []
        for t in raw:
            if isinstance(t, dict):
                templates.append({
                    "template_id": t.get("template_id") or t.get("id", ""),
                    "name": t.get("name") or t.get("template_name"),
                })
        return {"ok": True, "templates": templates, "error": None}
    except Exception as e:
        logger.exception("HeyGen list_templates failed")
        return {"ok": False, "templates": [], "error": str(e), "detail": None}


async def get_template_schema(template_id: str) -> dict[str, Any]:
    """Get variable schema for a template. GET /v3/template/{template_id}. Returns { ok, variables, scenes, error? }."""
    if not settings.heygen_api_key:
        return {"ok": False, "variables": None, "scenes": None, "error": "HEYGEN_API_KEY is not configured"}
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(
                f"{HEYGEN_API_BASE}/v3/template/{template_id}",
                headers=_headers(),
            )
        if r.status_code != 200:
            return {"ok": False, "variables": None, "scenes": None, "error": f"HeyGen returned {r.status_code}", "detail": (r.text or "")[:500]}
        data = r.json()
        return {
            "ok": True,
            "variables": data.get("variables"),
            "scenes": data.get("scenes"),
            "error": None,
        }
    except Exception as e:
        logger.exception("HeyGen get_template_schema failed")
        return {"ok": False, "variables": None, "scenes": None, "error": str(e), "detail": None}


async def generate_direct_video(
    *,
    avatar_id: str,
    voice_id: str,
    script_text: str,
    title: str | None = None,
    dimension_width: int = 1080,
    dimension_height: int = 1920,
    caption: bool = True,
    test: bool = True,
    voice_stability: float = 1.0,
    voice_model_id: str = "eleven_multilingual_v2",
    background_type: str = "color",
    background_value: str = "#f5f5f5",
) -> dict[str, Any]:
    """
    Generate talking-head video from script. POST /v2/video/generate.
    Returns { ok, video_id, status, error? }. HeyGen uses voice_id for ElevenLabs TTS internally.
    """
    if not settings.heygen_api_key:
        return {"ok": False, "video_id": None, "status": "pending", "error": "HEYGEN_API_KEY is not configured"}
    try:
        body = {
            "test": test,
            "caption": caption,
            "dimension": {"width": dimension_width, "height": dimension_height},
            "video_inputs": [
                {
                    "character": {"type": "avatar", "avatar_id": avatar_id},
                    "voice": {
                        "type": "text",
                        "input_text": script_text[:5000],
                        "voice_id": voice_id,
                        "speed": 1.0,
                        "elevenlabs_settings": {
                            "stability": voice_stability,
                            "model_id": voice_model_id,
                        },
                    },
                    "background": {"type": background_type, "value": background_value},
                }
            ],
        }
        if title:
            body["title"] = title
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{HEYGEN_API_BASE}/v2/video/generate",
                headers=_headers(),
                json=body,
            )
        if r.status_code in (200, 201):
            data = r.json()
            vid = (data.get("data") or data).get("video_id") or data.get("video_id")
            return {"ok": True, "video_id": vid, "status": "pending", "error": None}
        return {
            "ok": False,
            "video_id": None,
            "status": "pending",
            "error": f"HeyGen returned {r.status_code}",
            "detail": (r.text or "")[:500],
        }
    except Exception as e:
        logger.exception("HeyGen generate_direct_video failed")
        return {"ok": False, "video_id": None, "status": "pending", "error": str(e), "detail": None}


async def generate_from_template(
    template_id: str,
    *,
    variables: dict[str, dict],
    title: str | None = None,
    caption: bool = True,
    test: bool = True,
) -> dict[str, Any]:
    """
    Generate video from template. POST /v2/template/{template_id}/generate.
    variables: { "var_name": { "name": "var_name", "type": "text", "properties": { "content": "..." } } }.
    Returns { ok, video_id, status, error? }.
    """
    if not settings.heygen_api_key:
        return {"ok": False, "video_id": None, "status": "pending", "error": "HEYGEN_API_KEY is not configured"}
    try:
        body = {"test": test, "caption": caption, "variables": variables}
        if title:
            body["title"] = title
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{HEYGEN_API_BASE}/v2/template/{template_id}/generate",
                headers=_headers(),
                json=body,
            )
        if r.status_code in (200, 201):
            data = r.json()
            vid = (data.get("data") or data).get("video_id") or data.get("video_id")
            return {"ok": True, "video_id": vid, "status": "pending", "error": None}
        return {
            "ok": False,
            "video_id": None,
            "status": "pending",
            "error": f"HeyGen returned {r.status_code}",
            "detail": (r.text or "")[:500],
        }
    except Exception as e:
        logger.exception("HeyGen generate_from_template failed")
        return {"ok": False, "video_id": None, "status": "pending", "error": str(e), "detail": None}


async def get_video_status(video_id: str) -> dict[str, Any]:
    """
    Poll video status. GET /v1/video_status.get?video_id={id}.
    Returns { ok, video_id, status, video_url?, error? }. Status: pending, processing, completed, failed.
    """
    if not settings.heygen_api_key:
        return {"ok": False, "video_id": video_id, "status": "unknown", "video_url": None, "error": "HEYGEN_API_KEY is not configured"}
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(
                f"{HEYGEN_API_BASE}/v1/video_status.get",
                params={"video_id": video_id},
                headers=_headers(),
            )
        if r.status_code != 200:
            return {"ok": False, "video_id": video_id, "status": "unknown", "video_url": None, "error": f"HeyGen returned {r.status_code}", "detail": (r.text or "")[:300]}
        data = r.json()
        inner = data.get("data", data)
        status = inner.get("status", "unknown")
        video_url = inner.get("video_url") or inner.get("result", {}).get("video_url") if isinstance(inner.get("result"), dict) else None
        return {"ok": True, "video_id": video_id, "status": status, "video_url": video_url, "error": None}
    except Exception as e:
        logger.exception("HeyGen get_video_status failed")
        return {"ok": False, "video_id": video_id, "status": "unknown", "video_url": None, "error": str(e), "detail": None}
