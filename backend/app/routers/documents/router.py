"""Documents router — stream private Vercel Blob PDFs. HTTP only; delegates to documents service."""
from __future__ import annotations

import logging
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse

from app.models.documents_models import ErrorDetail
from app.services.documents import DocumentServiceError, stream_pdf

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])


@router.get("/documents/pdf")
async def stream_pdf_route(url: str = Query(..., description="Private blob URL (encoded)")):
    """Stream a private Vercel Blob PDF. Used by citation links in chat."""
    blob_url = unquote(url)
    try:
        content_iter, headers = stream_pdf(blob_url)
    except DocumentServiceError as e:
        return JSONResponse(
            content=ErrorDetail(detail=e.detail).model_dump(),
            status_code=e.status_code,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("stream_pdf_route failed: %s", e)
        raise HTTPException(500, "Internal server error")
    return StreamingResponse(
        content_iter,
        media_type="application/pdf",
        headers=headers,
    )
