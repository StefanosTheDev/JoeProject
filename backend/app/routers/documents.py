"""Document PDF proxy — stream private Vercel Blob PDFs through the backend."""
from __future__ import annotations

import os
from urllib.parse import unquote

import requests
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, StreamingResponse

router = APIRouter(tags=["documents"])


@router.get("/documents/pdf")
async def stream_pdf(url: str = Query(..., description="Private blob URL (encoded)")):
    """Stream a private Vercel Blob PDF. Used by citation links in chat."""
    blob_url = unquote(url)
    if not blob_url.strip().startswith("https://"):
        return JSONResponse({"detail": "Invalid url"}, status_code=400)

    token = os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip()
    if not token:
        return JSONResponse({"detail": "Blob storage not configured"}, status_code=503)

    try:
        resp = requests.get(
            blob_url,
            headers={"Authorization": f"Bearer {token}"},
            stream=True,
            timeout=30,
        )
    except requests.RequestException as e:
        return JSONResponse({"detail": str(e)}, status_code=502)

    if resp.status_code != 200:
        return JSONResponse(
            {"detail": "Blob fetch failed"},
            status_code=resp.status_code,
        )

    return StreamingResponse(
        resp.iter_content(chunk_size=65536),
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-cache",
        },
    )
