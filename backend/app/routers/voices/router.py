"""Voices router — ElevenLabs list/create/preview and advisor_voices per firm."""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app import db
from app.models.voice_models import (
    VoiceCreateResponse,
    VoiceListResponse,
    VoiceTtsPreviewResponse,
)
from app.services.voice import (
    create_voice,
    list_advisor_voices,
    list_voices,
    tts_preview,
    upsert_advisor_voice,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voices", tags=["voices"])


@router.get("/elevenlabs", response_model=VoiceListResponse)
async def voices_list_elevenlabs():
    """List all voices from ElevenLabs API (account voices)."""
    result = await list_voices()
    if not result.get("ok"):
        return VoiceListResponse(ok=False, voices=[], error=result.get("error"))
    return VoiceListResponse(
        ok=True,
        voices=[
            {"voice_id": v["voice_id"], "name": v["name"], "labels": v.get("labels")}
            for v in result.get("voices", [])
        ],
        error=None,
    )


@router.post("/", response_model=VoiceCreateResponse)
async def voice_create(
    firm_id: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    description: str | None = Form(None),
    remove_background_noise: bool = Form(True),
):
    """Create instant voice clone (ElevenLabs) and store in advisor_voices for the firm."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    result = await create_voice(
        name=name,
        file_content=content,
        file_name=file.filename or "voice_sample.mp3",
        description=description,
        remove_background_noise=remove_background_noise,
        labels={"firm_id": firm_id, "type": "advisor_clone"},
    )
    if not result.get("ok") or not result.get("voice_id"):
        return VoiceCreateResponse(
            ok=False,
            voice_id=None,
            error=result.get("error"),
            detail=result.get("detail"),
        )
    try:
        await upsert_advisor_voice(
            db.pool,
            firm_id=firm_id,
            elevenlabs_voice_id=result["voice_id"],
            voice_name=name,
        )
    except Exception as e:
        logger.exception("upsert_advisor_voice failed: %s", e)
        return VoiceCreateResponse(
            ok=True,
            voice_id=result["voice_id"],
            error=None,
            detail=f"Stored in ElevenLabs but DB save failed: {e}",
        )
    return VoiceCreateResponse(ok=True, voice_id=result["voice_id"], error=None, detail=None)


@router.get("/preview", response_model=VoiceTtsPreviewResponse)
async def voice_preview(
    voice_id: str = Query(...),
    text: str = Query(..., max_length=500),
    model_id: str = Query("eleven_multilingual_v2"),
):
    """Generate a short TTS preview for the given voice_id."""
    result = await tts_preview(voice_id, text, model_id=model_id)
    return VoiceTtsPreviewResponse(
        ok=result.get("ok", False),
        audio_url=result.get("audio_url"),
        error=result.get("error"),
    )


@router.get("/firm", response_model=VoiceListResponse)
async def voices_list_firm(firm_id: str = Query(...)):
    """List advisor voices stored in DB for the firm."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        rows = await list_advisor_voices(db.pool, firm_id)
        # Return as voice list shape for consistency (voice_id, name)
        voices = [
            {"voice_id": r["elevenlabs_voice_id"], "name": r["voice_name"], "labels": None}
            for r in rows
        ]
        return VoiceListResponse(ok=True, voices=voices, error=None)
    except Exception as e:
        logger.exception("voices_list_firm failed: %s", e)
        raise HTTPException(500, "Internal server error")
