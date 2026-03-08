"""Pydantic models for funnel (Phase 2)."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FunnelSubmitRequest(BaseModel):
    """Form submission from registration/landing page."""
    firm_id: str
    campaign_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: str = Field(..., min_length=1)
    phone: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    referrer: str | None = None
    page_type: str = "registration"


class FunnelSubmitResponse(BaseModel):
    ok: bool
    contact_id: str | None = None
    error: str | None = None
    session_id: str | None = None
    webinar_scheduled_at: str | None = None
    webinar_join_url: str | None = None


class FunnelContentResponse(BaseModel):
    """Funnel page copy (from funnel_pages or campaign)."""
    headline: str | None = None
    subheadline: str | None = None
    cta_text: str | None = None
    body: str | None = None
    content: dict[str, Any] = Field(default_factory=dict)
