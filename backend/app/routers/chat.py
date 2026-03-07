from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

import anthropic
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app import db
from app.services.retrieval import retrieve_relevant_chunks, format_context_for_prompt

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = """\
You are Amplify Chat, an internal AI assistant for Amplify Advisors. \
You help financial advisors with marketing strategy, campaign planning, \
client acquisition, and day-to-day tasks.

RESPONSE FORMAT RULES:
- For factual questions: 2-4 concise paragraphs. Get to the point fast.
- For how-to / step-by-step questions: use numbered steps with brief explanations.
- For strategy questions: use markdown headers (##) to organize, with bullet points.
- Use **bold** for key terms and concepts. Use bullet points over long paragraphs.
- Never repeat the user's question back to them.

SOP CONTEXT RULES:
- When SOP context is provided below, treat it as your primary knowledge source.
- Paraphrase and synthesize the SOP content — do not dump raw text.
- If the SOP context is only tangentially related, acknowledge it briefly but answer \
from general knowledge. Do not force irrelevant SOP content into your answer.
- If no SOP context is provided, or it does not answer the question, respond from \
your general expertise and say so.

CITATION RULES:
- When you use SOP content in your answer, you MUST end your response with a \
structured Sources section in exactly this format:

**Sources:**
- [Document Title](pdf_url)

- List each source document only ONCE, even if multiple sections were used.
- Do NOT put source links inline within your answer text.
- Do NOT include a Sources section if you did not use any SOP content.

CONVERSATION RULES:
- For casual messages (greetings, thanks, follow-ups), respond naturally and briefly. \
Do not cite SOPs for casual conversation.
- Match the user's energy — short questions get short answers.\
"""

SKIP_RAG_PATTERNS = [
    re.compile(r"^(hi|hey|hello|sup|yo|greetings)\b", re.IGNORECASE),
    re.compile(r"^(thanks|thank you|thx|ty|cheers|appreciate it)", re.IGNORECASE),
    re.compile(r"^(ok|okay|got it|sure|yes|no|yep|nope|cool|nice|great)\s*[.!]?\s*$", re.IGNORECASE),
    re.compile(r"^(how are you|what can you do|who are you|what are you)", re.IGNORECASE),
    re.compile(r"^(good morning|good afternoon|good evening|gm)\b", re.IGNORECASE),
]

HOWTO_PATTERNS = [
    re.compile(r"\bhow (do|can|should|would|to)\b", re.IGNORECASE),
    re.compile(r"\bstep[- ]?by[- ]?step\b", re.IGNORECASE),
    re.compile(r"\bwalk me through\b", re.IGNORECASE),
    re.compile(r"\bguide me\b", re.IGNORECASE),
    re.compile(r"\bprocess for\b", re.IGNORECASE),
]


def _should_skip_rag(text: str) -> bool:
    """Return True if the message is casual and doesn't need RAG retrieval."""
    text = text.strip()
    if len(text) < 4:
        return True
    return any(p.search(text) for p in SKIP_RAG_PATTERNS)


def _classify_max_tokens(text: str, has_rag_context: bool) -> int:
    """Choose max_tokens based on query type."""
    if any(p.search(text) for p in HOWTO_PATTERNS):
        return 3000
    if has_rag_context and len(text.split()) < 12:
        return 1500
    return 2048


def _sse_event(data: Any) -> str:
    """Format a single SSE event for the UI Message Stream Protocol (v6)."""
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


def _convert_messages(messages: list[dict]) -> list[dict]:
    """Convert UI messages (with `parts`) to Anthropic API format."""
    result = []
    for msg in messages:
        role = msg.get("role", "user")
        if role not in ("user", "assistant"):
            continue
        parts = msg.get("parts", [])
        text_parts = [p["text"] for p in parts if p.get("type") == "text"]
        content = "\n".join(text_parts) if text_parts else msg.get("content", "")
        if content:
            result.append({"role": role, "content": content})
    return result


async def _stream_claude(messages: list[dict]):
    """Stream Claude response using the UI Message Stream Protocol (v6).

    Protocol spec: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
    """
    message_id = str(uuid.uuid4())
    text_part_id = str(uuid.uuid4())

    yield _sse_event({"type": "start", "messageId": message_id})
    yield _sse_event({"type": "start-step"})

    anthropic_messages = _convert_messages(messages)
    if not anthropic_messages:
        yield _sse_event({"type": "text-start", "id": text_part_id})
        yield _sse_event({"type": "text-delta", "id": text_part_id, "delta": "Please send a message to start the conversation."})
        yield _sse_event({"type": "text-end", "id": text_part_id})
        yield _sse_event({"type": "finish-step"})
        yield _sse_event({"type": "finish"})
        yield "data: [DONE]\n\n"
        return

    yield _sse_event({"type": "text-start", "id": text_part_id})

    system_prompt = SYSTEM_PROMPT
    has_rag_context = False

    last_user_msg = ""
    for msg in reversed(anthropic_messages):
        if msg["role"] == "user":
            last_user_msg = msg["content"]
            break

    # RAG: retrieve relevant SOP chunks (skip for casual messages)
    if db.pool is not None and last_user_msg and not _should_skip_rag(last_user_msg):
        yield _status_event("searching", "Searching SOPs")
        try:
            chunks = await retrieve_relevant_chunks(db.pool, last_user_msg)
            context = format_context_for_prompt(chunks)
            if context:
                system_prompt = f"{SYSTEM_PROMPT}\n\n{context}"
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
                        {
                            "type": "text-delta",
                            "id": text_part_id,
                            "delta": event.text,
                        }
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


async def _error_stream(error_msg: str):
    message_id = str(uuid.uuid4())
    yield _sse_event({"type": "start", "messageId": message_id})
    yield _sse_event({"type": "error", "errorText": error_msg})
    yield _sse_event({"type": "finish"})
    yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat(request: Request):
    try:
        body = await request.json()
    except Exception:
        return StreamingResponse(
            _error_stream("Invalid JSON in request body"),
            media_type="text/event-stream",
            status_code=400,
            headers={"x-vercel-ai-ui-message-stream": "v1"},
        )

    messages = body.get("messages", [])

    return StreamingResponse(
        _stream_claude(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "x-vercel-ai-ui-message-stream": "v1",
        },
    )
