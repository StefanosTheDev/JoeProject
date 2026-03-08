"""Documents service — stream PDF from Vercel Blob. No HTTP; used by documents router."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import requests

from app.config import settings

PDF_STREAM_CHUNK = 65536
STREAM_TIMEOUT = 30


class DocumentServiceError(Exception):
    """Raised when blob fetch fails. status_code and detail for HTTP response."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def stream_pdf(blob_url: str) -> tuple[Iterator[bytes], dict[str, str]]:
    """
    Stream a private Vercel Blob PDF. Returns (content_iterator, response_headers).
    Raises DocumentServiceError(status_code, detail) on failure.
    """
    if not blob_url.strip().startswith("https://"):
        raise DocumentServiceError(400, "Invalid url")

    token = (settings.blob_read_write_token or "").strip()
    if not token:
        raise DocumentServiceError(503, "Blob storage not configured")

    try:
        resp = requests.get(
            blob_url,
            headers={"Authorization": f"Bearer {token}"},
            stream=True,
            timeout=STREAM_TIMEOUT,
        )
    except requests.RequestException as e:
        raise DocumentServiceError(502, str(e)) from e

    if resp.status_code != 200:
        raise DocumentServiceError(
            resp.status_code,
            "Blob fetch failed" if resp.status_code != 200 else resp.reason or "Blob fetch failed",
        )

    headers = {
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
    }
    return resp.iter_content(chunk_size=PDF_STREAM_CHUNK), headers
