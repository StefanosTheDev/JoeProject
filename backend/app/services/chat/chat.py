"""Chat service — stream Claude with RAG (SOP context). No HTTP; used by chat router."""
from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

import anthropic

from app import db
from app.config import settings
from app.models.chat_models import ChatMessage
from app.prompts.chat import (
    CHAT_SYSTEM_PROMPT,
    CHAT_SKIP_RAG_PATTERNS,
    CHAT_HOWTO_PATTERNS,
)
from app.services.chat.retrieval import retrieve_relevant_chunks, format_context_for_prompt

logger = logging.getLogger(__name__)

_SKIP_RAG_RE = [re.compile(p, re.IGNORECASE) for p in CHAT_SKIP_RAG_PATTERNS]
_HOWTO_RE = [re.compile(p, re.IGNORECASE) for p in CHAT_HOWTO_PATTERNS]


def convert_messages_to_anthropic(messages: list[ChatMessage]) -> list[dict]:
    """Convert UI messages (with parts) to Anthropic API format."""
    result = []
    for msg in messages:
        if msg.role not in ("user", "assistant"):
            continue
        if msg.parts:
            text_parts = [p.text for p in msg.parts if p.type == "text"]
            content = "\n".join(text_parts) if text_parts else ""
        else:
            content = msg.content or ""
        if content:
            result.append({"role": msg.role, "content": content})
    return result


def _should_skip_rag(text: str) -> bool:
    """True if the message is casual and does not need RAG retrieval."""
    text = text.strip()
    if len(text) < 4:
        return True
    return any(p.search(text) for p in _SKIP_RAG_RE)


def _classify_max_tokens(text: str, has_rag_context: bool) -> int:
    """Choose max_tokens based on query type."""
    if any(p.search(text) for p in _HOWTO_RE):
        return 3000
    if has_rag_context and len(text.split()) < 12:
        return 1500
    return 2048


def _sse_event(data: Any) -> str:
    """Format one SSE event for the UI Message Stream Protocol (v6)."""
    return f"data: {json.dumps(data)}\n\n"


def _status_event(phase: str, label: str) -> str:
    """Emit a transient status update for the frontend streaming UI."""
    return _sse_event(
        {
            "type": "data-status",
            "data": {"phase": phase, "label": label},
            "transient": True,
        }
    )


async def stream_chat_response(messages: list[ChatMessage]):
    """
    Stream Claude response using the UI Message Stream Protocol (v6).
    Uses CHAT_SYSTEM_PROMPT and optional RAG context from db pool.
    """
    message_id = str(uuid.uuid4())
    text_part_id = str(uuid.uuid4())

    yield _sse_event({"type": "start", "messageId": message_id})
    yield _sse_event({"type": "start-step"})

    anthropic_messages = convert_messages_to_anthropic(messages)
    if not anthropic_messages:
        yield _sse_event({"type": "text-start", "id": text_part_id})
        yield _sse_event({"type": "text-delta", "id": text_part_id, "delta": "Please send a message to start the conversation."})
        yield _sse_event({"type": "text-end", "id": text_part_id})
        yield _sse_event({"type": "finish-step"})
        yield _sse_event({"type": "finish"})
        yield "data: [DONE]\n\n"
        return

    yield _sse_event({"type": "text-start", "id": text_part_id})

    system_prompt = CHAT_SYSTEM_PROMPT
    has_rag_context = False
    last_user_msg = ""
    for msg in reversed(anthropic_messages):
        if msg["role"] == "user":
            last_user_msg = msg["content"]
            break

    if db.pool is not None and last_user_msg and not _should_skip_rag(last_user_msg):
        yield _status_event("searching", "Searching SOPs")
        try:
            chunks = await retrieve_relevant_chunks(db.pool, last_user_msg)
            context = format_context_for_prompt(chunks)
            if context:
                system_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n{context}"
                has_rag_context = True
                logger.info("Injected %d RAG chunks into prompt", len(chunks))
            else:
                logger.info("No relevant chunks found above threshold")
        except Exception as e:
            logger.warning("RAG retrieval failed, proceeding without context: %s", e)
    elif last_user_msg and _should_skip_rag(last_user_msg):
        logger.info("Skipped RAG for casual message: %s", last_user_msg[:50])

    max_tokens = _classify_max_tokens(last_user_msg, has_rag_context)

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        yield _status_event("thinking", "Thinking")
        has_started_writing = False

        async with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            system=system_prompt,
            messages=anthropic_messages,
        ) as stream:
            async for event in stream:
                if event.type == "text":
                    if not has_started_writing:
                        has_started_writing = True
                        yield _status_event("writing", "Writing response")
                    yield _sse_event(
                        {"type": "text-delta", "id": text_part_id, "delta": event.text}
                    )

        yield _status_event("finalizing", "Finalizing answer")
        yield _sse_event({"type": "text-end", "id": text_part_id})
    except anthropic.APIError as e:
        yield _sse_event({"type": "error", "errorText": f"API error: {e.message}"})
    except Exception as e:
        yield _sse_event({"type": "error", "errorText": str(e)})

    yield _sse_event({"type": "finish-step"})
    yield _sse_event({"type": "finish"})
    yield "data: [DONE]\n\n"


async def error_stream(error_msg: str):
    """Stream an error event in the same protocol (e.g. for 400 body)."""
    message_id = str(uuid.uuid4())
    yield _sse_event({"type": "start", "messageId": message_id})
    yield _sse_event({"type": "error", "errorText": error_msg})
    yield _sse_event({"type": "finish"})
    yield "data: [DONE]\n\n"
