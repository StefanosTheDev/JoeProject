"""Request/response models for GHL API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class OAuthUrlResponse(BaseModel):
    """Response for GET /connect/oauth/url."""

    url: str


class GHLConnectionStatus(BaseModel):
    """Response for GET /connect/connection."""

    connected: bool
    firm_id: str
    connection_id: int | None = None
    location_id: str | None = None
    company_id: str | None = None
    status: str | None = None
    token_expires_at: str | None = None
    connected_at: str | None = None


class DisconnectResponse(BaseModel):
    """Response for POST /ghl/disconnect."""

    ok: bool = True
    firm_id: str


class CreateCustomValueRequest(BaseModel):
    """Body for POST /connect/custom-values."""

    firm_id: str
    name: str
    value: str


class UpdateCustomValueRequest(BaseModel):
    """Body for PUT /connect/custom-values/{custom_value_id}."""

    firm_id: str
    value: str
    name: str | None = None


class CreateContactRequest(BaseModel):
    """Body for POST /connect/contacts. firm_id + any GHL contact fields (firstName, lastName, email, etc.)."""

    model_config = ConfigDict(extra="allow")
    firm_id: str


class UpdateContactRequest(BaseModel):
    """Body for PUT /connect/contacts/{contact_id}. firm_id + contact fields to update."""

    model_config = ConfigDict(extra="allow")
    firm_id: str


class SearchContactsRequest(BaseModel):
    """Body for POST /connect/contacts/search."""

    model_config = ConfigDict(extra="allow")
    firm_id: str
    query: str | None = None
    page_limit: int = 20
