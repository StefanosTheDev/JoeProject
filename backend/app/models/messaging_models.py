"""Pydantic models for messaging (contacts, messages) — Phase 1."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


def _coerce_utm_data(v: dict[str, Any] | str | None) -> dict[str, Any]:
    if v is None:
        return {}
    if isinstance(v, dict):
        return v
    if isinstance(v, str):
        if not v.strip():
            return {}
        return json.loads(v)
    return {}


# ----- Contacts -----
class ContactBase(BaseModel):
    firm_id: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    utm_data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("utm_data", mode="before")
    @classmethod
    def utm_data_dict(cls, v: object) -> dict[str, Any]:
        return _coerce_utm_data(v) if v is not None else {}
    tags: list[str] = Field(default_factory=list)
    pipeline_stage: str = "new_lead"


class ContactCreate(ContactBase):
    pass


class Contact(ContactBase):
    id: str
    imessage_capable: bool | None = None
    calendly_invitee_uri: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    contacts: list[Contact]
    total: int


# ----- Messages -----
class MessageBase(BaseModel):
    channel: str  # imessage | sms | email
    direction: str  # inbound | outbound
    content: str = ""
    media_url: str | None = None
    status: str = "sent"


class MessageCreate(MessageBase):
    firm_id: str
    contact_id: str
    sendblue_handle: str | None = None
    resend_email_id: str | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None


class Message(MessageBase):
    id: str
    firm_id: str
    contact_id: str
    sendblue_handle: str | None = None
    resend_email_id: str | None = None
    read_at: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: list[Message]
    total: int


# ----- Send request/response -----
class SendMessageRequest(BaseModel):
    contact_id: str
    channel: str = Field(..., pattern="^(imessage|sms|email)$")
    content: str = Field(..., min_length=1)
    # For iMessage/SMS: from_number required (E.164). Optional if using firm sendblue_config.
    from_number: str | None = None
    # For email: optional override
    from_email: str | None = None
    subject: str | None = None  # required when channel=email


class SendMessageResponse(BaseModel):
    ok: bool
    message_id: str | None = None
    error: str | None = None
