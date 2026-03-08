"""Request/response models for Voices API (ElevenLabs + advisor_voices)."""
from __future__ import annotations

from pydantic import BaseModel, Field


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
    """Response for GET /voices/elevenlabs or GET /voices/firm."""

    ok: bool
    voices: list[VoiceListItem] = Field(default_factory=list)
    error: str | None = None


class AdvisorVoiceRow(BaseModel):
    """Single advisor voice from DB (firm's saved voices)."""

    id: str
    firm_id: str
    elevenlabs_voice_id: str
    voice_name: str
    status: str
    created_at: str | None = None
