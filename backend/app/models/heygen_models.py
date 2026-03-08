"""Request/response models for HeyGen + ElevenLabs integration (video, avatars, voices)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


# ---------- Verify (existing) ----------


class VerifyResponse(BaseModel):
    """Response for GET /heygen/verify."""

    model_config = ConfigDict(extra="allow")
    ok: bool
    message: str | None = None
    error: str | None = None
    detail: str | None = None
    avatars_count: int | None = None


# ---------- ElevenLabs voice clone ----------


class VoiceCreateResponse(BaseModel):
    """Response after creating an ElevenLabs instant voice clone."""

    ok: bool
    voice_id: str | None = None
    error: str | None = None
    detail: str | None = None


class VoiceTtsPreviewResponse(BaseModel):
    """Response for TTS preview (audio URL or error)."""

    ok: bool
    audio_url: str | None = None
    error: str | None = None


class VoiceListItem(BaseModel):
    """Single voice from list."""

    voice_id: str
    name: str
    labels: dict[str, str] | None = None


class VoiceListResponse(BaseModel):
    """Response for GET /heygen/voices."""

    ok: bool
    voices: list[VoiceListItem] = Field(default_factory=list)
    error: str | None = None


# ---------- HeyGen avatars ----------


class AvatarListItem(BaseModel):
    """Single avatar from HeyGen list."""

    avatar_id: str
    avatar_name: str | None = None
    avatar_type: str | None = None


class AvatarListResponse(BaseModel):
    """Response for GET /heygen/avatars."""

    ok: bool
    avatars: list[AvatarListItem] = Field(default_factory=list)
    error: str | None = None


# ---------- HeyGen templates ----------


class TemplateListItem(BaseModel):
    """Single template from list."""

    template_id: str
    name: str | None = None


class TemplateListResponse(BaseModel):
    """Response for GET /heygen/templates."""

    ok: bool
    templates: list[TemplateListItem] = Field(default_factory=list)
    error: str | None = None


class TemplateSchemaResponse(BaseModel):
    """Response for GET /heygen/templates/{template_id}/schema (variable schema)."""

    model_config = ConfigDict(extra="allow")
    ok: bool
    variables: dict | None = None
    scenes: list | None = None
    error: str | None = None


# ---------- Video generation ----------


class GenerateDirectVideoBody(BaseModel):
    """Body for POST /heygen/video/generate (direct avatar video)."""

    firm_id: str
    title: str | None = None
    script_text: str = Field(..., max_length=5000)
    dimension_width: int = Field(1080, ge=1, le=1920)
    dimension_height: int = Field(1920, ge=1, le=1920)
    caption: bool = True
    test: bool = True
    voice_stability: float = Field(1.0, ge=0, le=1)
    voice_model_id: str = "eleven_multilingual_v2"
    background_type: str = "color"
    background_value: str = "#f5f5f5"


class GenerateTemplateVideoBody(BaseModel):
    """Body for POST /heygen/video/generate/template (template-based)."""

    firm_id: str
    template_id: str = Field(..., description="HeyGen template_id (from list templates)")
    title: str | None = None
    variables: dict[str, dict] = Field(default_factory=dict)
    caption: bool = True
    test: bool = True


class GenerateVideoResponse(BaseModel):
    """Response after submitting a video generation job."""

    ok: bool
    video_id: str | None = None
    generated_video_id: str | None = None
    status: str = "pending"
    error: str | None = None


class VideoStatusResponse(BaseModel):
    """Response for GET /heygen/video/status."""

    ok: bool
    video_id: str
    status: str
    video_url: str | None = None
    error: str | None = None
    detail: str | None = None


# ---------- DB-backed list responses (advisor_avatars, advisor_voices) ----------


class AdvisorAvatarRow(BaseModel):
    """One row from advisor_avatars."""

    id: str
    firm_id: str
    heygen_avatar_id: str
    avatar_type: str
    status: str
    created_at: str | None = None


class AdvisorVoiceRow(BaseModel):
    """One row from advisor_voices."""

    id: str
    firm_id: str
    elevenlabs_voice_id: str
    voice_name: str
    status: str
    created_at: str | None = None
