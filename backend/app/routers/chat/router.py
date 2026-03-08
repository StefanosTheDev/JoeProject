"""Chat router — HTTP only; delegates to chat service for streaming."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.chat_models import ChatRequest
from app.services.chat import stream_chat_response

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

STREAM_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "x-vercel-ai-ui-message-stream": "v1",
}


@router.post("/chat")
async def chat(body: ChatRequest):
    """Stream AI chat with optional RAG (SOP) context. Request body: { \"messages\": [...] }."""
    try:
        return StreamingResponse(
            stream_chat_response(body.messages),
            media_type="text/event-stream",
            headers=STREAM_HEADERS,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat route failed: %s", e)
        raise HTTPException(500, "Internal server error")
