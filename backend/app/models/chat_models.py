"""Request/response models for Chat API (streaming AI chat with RAG)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class MessagePart(BaseModel):
    """Single part of a message (AI SDK UI / message stream protocol)."""

    type: Literal["text"] = "text"
    text: str


class ChatMessage(BaseModel):
    """One message in the conversation (user or assistant)."""

    role: Literal["user", "assistant", "system"]
    id: str | None = None
    content: str | None = None
    parts: list[MessagePart] | None = None


class ChatRequest(BaseModel):
    """POST /chat body — list of messages for the conversation."""

    messages: list[ChatMessage] = []
