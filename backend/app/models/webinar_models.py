"""Pydantic models for webinar (Phase 4)."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WebinarSessionCreate(BaseModel):
    campaign_id: str
    scheduled_at: datetime
    mux_playback_id: str | None = None
    chat_enabled: bool = True


class WebinarSession(BaseModel):
    id: str
    campaign_id: str
    scheduled_at: datetime
    is_active: bool
    mux_playback_id: str | None = None
    chat_enabled: bool
    replay_available_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class WebinarSessionListResponse(BaseModel):
    sessions: list[WebinarSession]
    total: int


class WebinarSessionPatch(BaseModel):
    """Update session (e.g. set playback from Mux asset)."""
    asset_id: str | None = None
    mux_playback_id: str | None = None


class WebinarRegisterRequest(BaseModel):
    contact_id: str


class WebinarRegisterResponse(BaseModel):
    ok: bool
    session_id: str | None = None
    error: str | None = None
