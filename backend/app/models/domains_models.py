"""Pydantic models for domains API (BYOD connect/verify)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ConnectDomainRequest(BaseModel):
    """Request to connect a custom domain for a firm."""
    hostname: str = Field(..., min_length=1, description="e.g. go.client.com")
    firm_id: str = Field(..., min_length=1)
    default_campaign_id: str | None = None
