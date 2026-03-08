"""
ElevenLabs API — voice cloning and TTS preview.

Docs: https://elevenlabs.io/docs/api-reference
Auth: xi-api-key header.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ELEVENLABS_API_BASE = "https://api.elevenlabs.io"
DEFAULT_TIMEOUT = 60.0


def _headers() -> dict[str, str]:
    key = settings.elevenlabs_api_key
    if not key:
        raise ValueError("ELEVENLABS_API_KEY is not set")
    return {"xi-api-key": key}


async def create_voice(
    *,
    name: str,
    file_content: bytes,
    file_name: str = "voice_sample.mp3",
    description: str | None = None,
    labels: dict[str, str] | None = None,
    remove_background_noise: bool = True,
) -> dict[str, Any]:
    """
    Create an instant voice clone. POST /v1/voices/add (multipart/form-data).
    Returns { "ok": True, "voice_id": "..." } or { "ok": False, "error": "..." }.
    """
    if not settings.elevenlabs_api_key:
        return {"ok": False, "error": "ELEVENLABS_API_KEY is not configured", "voice_id": None}
    try:
        headers = _headers()
        files = {"files": (file_name, file_content, "audio/mpeg")}
        data: dict[str, Any] = {
            "name": name,
            "remove_background_noise": str(remove_background_noise).lower(),
        }
        if description:
            data["description"] = description
        if labels:
            data["labels"] = json.dumps(labels)
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.post(
                f"{ELEVENLABS_API_BASE}/v1/voices/add",
                headers=headers,
                data=data,
                files=files,
            )
        if r.status_code in (200, 201):
            body = r.json()
            voice_id = body.get("voice_id") or (body.get("data", {}) or {}).get("voice_id")
            return {"ok": True, "voice_id": voice_id, "error": None}
        return {
            "ok": False,
            "voice_id": None,
            "error": f"ElevenLabs returned {r.status_code}",
            "detail": r.text[:500] if r.text else None,
        }
    except httpx.TimeoutException as e:
        logger.warning("ElevenLabs create_voice timeout: %s", e)
        return {"ok": False, "voice_id": None, "error": "Request timed out", "detail": str(e)}
    except Exception as e:
        logger.exception("ElevenLabs create_voice failed")
        return {"ok": False, "voice_id": None, "error": str(e), "detail": None}


async def tts_preview(
    voice_id: str,
    text: str,
    *,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
) -> dict[str, Any]:
    """
    Generate a short TTS clip for preview. POST /v1/text-to-speech/{voice_id}.
    Returns { "ok": True, "audio_url": "data:..." or base64 } or error.
    API returns raw audio bytes; we return base64 data URL for simplicity in JSON.
    """
    if not settings.elevenlabs_api_key:
        return {"ok": False, "audio_url": None, "error": "ELEVENLABS_API_KEY is not configured"}
    try:
        import base64

        headers = {**_headers(), "Content-Type": "application/json", "Accept": "audio/mpeg"}
        body = {
            "text": text[:5000],
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
            },
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{ELEVENLABS_API_BASE}/v1/text-to-speech/{voice_id}",
                headers=headers,
                json=body,
            )
        if r.status_code == 200:
            b64 = base64.b64encode(r.content).decode("ascii")
            audio_url = f"data:audio/mpeg;base64,{b64}"
            return {"ok": True, "audio_url": audio_url, "error": None}
        return {
            "ok": False,
            "audio_url": None,
            "error": f"ElevenLabs TTS returned {r.status_code}",
            "detail": r.text[:300] if r.text else None,
        }
    except Exception as e:
        logger.exception("ElevenLabs tts_preview failed")
        return {"ok": False, "audio_url": None, "error": str(e), "detail": None}


async def list_voices() -> dict[str, Any]:
    """
    List all voices in the account. GET /v1/voices.
    Returns { "ok": True, "voices": [ { "voice_id", "name", "labels" } ] } or error.
    """
    if not settings.elevenlabs_api_key:
        return {"ok": False, "voices": [], "error": "ELEVENLABS_API_KEY is not configured"}
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            r = await client.get(
                f"{ELEVENLABS_API_BASE}/v1/voices",
                headers=_headers(),
            )
        if r.status_code != 200:
            return {
                "ok": False,
                "voices": [],
                "error": f"ElevenLabs returned {r.status_code}",
                "detail": r.text[:300] if r.text else None,
            }
        data = r.json()
        voices_list = data.get("voices", data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        if not isinstance(voices_list, list):
            voices_list = []
        voices = []
        for v in voices_list:
            if isinstance(v, dict):
                voices.append({
                    "voice_id": v.get("voice_id", v.get("id", "")),
                    "name": v.get("name", ""),
                    "labels": v.get("labels") or {},
                })
        return {"ok": True, "voices": voices, "error": None}
    except Exception as e:
        logger.exception("ElevenLabs list_voices failed")
        return {"ok": False, "voices": [], "error": str(e), "detail": None}
