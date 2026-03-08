"""Request/response models for Documents API."""

from __future__ import annotations

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Error response body for 400/502/503."""

    detail: str
