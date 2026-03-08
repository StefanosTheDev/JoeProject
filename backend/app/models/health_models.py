"""Response models for Health API."""

from __future__ import annotations

from pydantic import BaseModel


class HealthDbResponse(BaseModel):
    """Response for GET /health/db."""

    status: str
    result: int | None = None
    message: str | None = None
