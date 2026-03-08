"""HeyGen + ElevenLabs router — verify, voices, avatars, templates, video generation. HTTP only; delegates to services."""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app import db
from app.models.heygen_models import (
    AdvisorAvatarRow,
    AdvisorVoiceRow,
    AvatarListResponse,
    GenerateDirectVideoBody,
    GenerateTemplateVideoBody,
    GenerateVideoResponse,
    TemplateListResponse,
    TemplateSchemaResponse,
    VideoStatusResponse,
    VerifyResponse,
    VoiceCreateResponse,
    VoiceListResponse,
    VoiceTtsPreviewResponse,
)
from app.services.heygen import (
    create_generated_video,
    create_voice,
    generate_direct_video,
    generate_from_template,
    get_advisor_avatar,
    get_advisor_voice,
    get_generated_video_by_heygen_id,
    get_template_schema,
    get_video_status,
    list_advisor_avatars,
    list_advisor_voices,
    list_avatars,
    list_templates,
    list_voices,
    tts_preview,
    update_generated_video_status,
    upsert_advisor_avatar,
    upsert_advisor_voice,
    verify_connection,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["heygen"])


# ---------- Verify ----------


@router.get("/heygen/verify", response_model=VerifyResponse)
async def heygen_verify():
    """Verify HeyGen API key. Confirm HEYGEN_API_KEY is set and valid."""
    try:
        result = await verify_connection()
        return VerifyResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("heygen_verify failed: %s", e)
        raise HTTPException(500, "Internal server error")


# ---------- ElevenLabs voices ----------


@router.post("/heygen/voices", response_model=VoiceCreateResponse)
async def heygen_voice_create(
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
        return VoiceCreateResponse(ok=False, voice_id=None, error=result.get("error"), detail=result.get("detail"))
    try:
        await upsert_advisor_voice(
            db.pool,
            firm_id=firm_id,
            elevenlabs_voice_id=result["voice_id"],
            voice_name=name,
        )
    except Exception as e:
        logger.exception("upsert_advisor_voice failed: %s", e)
        return VoiceCreateResponse(ok=True, voice_id=result["voice_id"], error=None, detail=f"Stored in ElevenLabs but DB save failed: {e}")
    return VoiceCreateResponse(ok=True, voice_id=result["voice_id"], error=None, detail=None)


@router.get("/heygen/voices/preview", response_model=VoiceTtsPreviewResponse)
async def heygen_voice_preview(
    voice_id: str = Query(...),
    text: str = Query(..., max_length=500),
    model_id: str = Query("eleven_multilingual_v2"),
):
    """Generate a short TTS preview for the given voice_id (e.g. for advisor to confirm clone quality)."""
    result = await tts_preview(voice_id, text, model_id=model_id)
    return VoiceTtsPreviewResponse(ok=result.get("ok", False), audio_url=result.get("audio_url"), error=result.get("error"))


@router.get("/heygen/voices/elevenlabs", response_model=VoiceListResponse)
async def heygen_voices_list_elevenlabs():
    """List all voices from ElevenLabs API (all account voices)."""
    result = await list_voices()
    if not result.get("ok"):
        return VoiceListResponse(ok=False, voices=[], error=result.get("error"))
    return VoiceListResponse(ok=True, voices=[{"voice_id": v["voice_id"], "name": v["name"], "labels": v.get("labels")} for v in result.get("voices", [])])


@router.get("/heygen/voices")
async def heygen_voices_list_db(firm_id: str = Query(...)):
    """List advisor voices stored in DB for the firm."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    rows = await list_advisor_voices(db.pool, firm_id)
    return {"ok": True, "voices": [AdvisorVoiceRow(**r) for r in rows]}


# ---------- HeyGen avatars ----------


@router.get("/heygen/avatars", response_model=AvatarListResponse)
async def heygen_avatars_list_api():
    """List all avatars from HeyGen API (account avatars)."""
    result = await list_avatars()
    if not result.get("ok"):
        return AvatarListResponse(ok=False, avatars=[], error=result.get("error"))
    return AvatarListResponse(
        ok=True,
        avatars=[{"avatar_id": a["avatar_id"], "avatar_name": a.get("avatar_name"), "avatar_type": a.get("avatar_type")} for a in result.get("avatars", [])],
    )


@router.get("/heygen/avatars/firm")
async def heygen_avatars_list_db(firm_id: str = Query(...)):
    """List advisor avatars stored in DB for the firm."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    rows = await list_advisor_avatars(db.pool, firm_id)
    return {"ok": True, "avatars": [AdvisorAvatarRow(**r) for r in rows]}


@router.post("/heygen/avatars/link")
async def heygen_avatar_link(
    firm_id: str = Query(...),
    heygen_avatar_id: str = Query(...),
    avatar_type: str = Query("photo"),
):
    """Link a HeyGen avatar to the firm (store in advisor_avatars as active)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    try:
        id_ = await upsert_advisor_avatar(db.pool, firm_id=firm_id, heygen_avatar_id=heygen_avatar_id, avatar_type=avatar_type)
        return {"ok": True, "id": id_}
    except Exception as e:
        logger.exception("heygen_avatar_link failed: %s", e)
        raise HTTPException(500, str(e))


# ---------- HeyGen templates ----------


@router.get("/heygen/templates", response_model=TemplateListResponse)
async def heygen_templates_list():
    """List available HeyGen templates."""
    result = await list_templates()
    if not result.get("ok"):
        return TemplateListResponse(ok=False, templates=[], error=result.get("error"))
    return TemplateListResponse(ok=True, templates=[{"template_id": t["template_id"], "name": t.get("name")} for t in result.get("templates", [])])


@router.get("/heygen/templates/{template_id}/schema", response_model=TemplateSchemaResponse)
async def heygen_template_schema(template_id: str):
    """Get variable schema for a template (variables and scenes)."""
    result = await get_template_schema(template_id)
    return TemplateSchemaResponse(ok=result.get("ok", False), variables=result.get("variables"), scenes=result.get("scenes"), error=result.get("error"))


# ---------- Video generation ----------


@router.post("/heygen/video/generate", response_model=GenerateVideoResponse)
async def heygen_video_generate_direct(body: GenerateDirectVideoBody):
    """Generate talking-head video (direct avatar + script). Uses firm's advisor avatar and voice from DB."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    avatar = await get_advisor_avatar(db.pool, body.firm_id)
    voice = await get_advisor_voice(db.pool, body.firm_id)
    if not avatar:
        raise HTTPException(400, "No advisor avatar linked for this firm. Link an avatar first.")
    if not voice:
        raise HTTPException(400, "No advisor voice for this firm. Create a voice clone first.")
    result = await generate_direct_video(
        avatar_id=avatar["heygen_avatar_id"],
        voice_id=voice["elevenlabs_voice_id"],
        script_text=body.script_text,
        title=body.title,
        dimension_width=body.dimension_width,
        dimension_height=body.dimension_height,
        caption=body.caption,
        test=body.test,
        voice_stability=body.voice_stability,
        voice_model_id=body.voice_model_id,
        background_type=body.background_type,
        background_value=body.background_value,
    )
    if not result.get("ok") or not result.get("video_id"):
        return GenerateVideoResponse(ok=False, video_id=None, generated_video_id=None, status="pending", error=result.get("error"))
    try:
        gen_id = await create_generated_video(
            db.pool,
            firm_id=body.firm_id,
            heygen_video_id=result["video_id"],
            generation_method="direct",
            test_mode=body.test,
            captions_enabled=body.caption,
            aspect_ratio=f"{body.dimension_width}x{body.dimension_height}",
        )
    except Exception as e:
        logger.exception("create_generated_video failed: %s", e)
        gen_id = None
    return GenerateVideoResponse(ok=True, video_id=result["video_id"], generated_video_id=gen_id, status=result.get("status", "pending"), error=None)


@router.post("/heygen/video/generate/template", response_model=GenerateVideoResponse)
async def heygen_video_generate_template(body: GenerateTemplateVideoBody):
    """Generate video from a HeyGen template (multi-scene). Variables must match template schema."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    result = await generate_from_template(
        body.template_id,
        variables=body.variables,
        title=body.title,
        caption=body.caption,
        test=body.test,
    )
    if not result.get("ok") or not result.get("video_id"):
        return GenerateVideoResponse(ok=False, video_id=None, generated_video_id=None, status="pending", error=result.get("error"))
    try:
        gen_id = await create_generated_video(
            db.pool,
            firm_id=body.firm_id,
            heygen_video_id=result["video_id"],
            generation_method="template",
            test_mode=body.test,
            captions_enabled=body.caption,
        )
    except Exception as e:
        logger.exception("create_generated_video failed: %s", e)
        gen_id = None
    return GenerateVideoResponse(ok=True, video_id=result["video_id"], generated_video_id=gen_id, status=result.get("status", "pending"), error=None)


@router.get("/heygen/video/status", response_model=VideoStatusResponse)
async def heygen_video_status(
    video_id: str = Query(..., description="HeyGen video_id from generate response"),
    update_db: bool = Query(True, description="If true and status=completed, update generated_videos row"),
):
    """Poll HeyGen video status. Optionally update our DB when completed."""
    result = await get_video_status(video_id)
    if not result.get("ok"):
        return VideoStatusResponse(ok=False, video_id=video_id, status=result.get("status", "unknown"), video_url=None, error=result.get("error"), detail=result.get("detail"))
    status = result.get("status", "unknown")
    video_url = result.get("video_url")
    if update_db and db.pool and status in ("completed", "failed"):
        row = await get_generated_video_by_heygen_id(db.pool, video_id)
        if row:
            await update_generated_video_status(
                db.pool,
                row["id"],
                status,
                video_url=video_url if status == "completed" else None,
            )
    return VideoStatusResponse(ok=True, video_id=video_id, status=status, video_url=video_url, error=None, detail=None)
