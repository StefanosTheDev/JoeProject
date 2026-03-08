"""Prompt content for chat and other LLM flows. No logic — just strings and pattern definitions."""

from app.prompts.chat import (
    CHAT_SYSTEM_PROMPT,
    CHAT_SKIP_RAG_PATTERNS,
    CHAT_HOWTO_PATTERNS,
)

__all__ = [
    "CHAT_SYSTEM_PROMPT",
    "CHAT_SKIP_RAG_PATTERNS",
    "CHAT_HOWTO_PATTERNS",
]
