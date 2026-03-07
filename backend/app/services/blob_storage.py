"""Vercel Blob storage — upload and delete PDF files.

Requires a **public** Blob store: the Python REST API does not support
private uploads (only the JS SDK does). Use a public store for SOP PDFs;
URLs are long and unguessable.
"""
from __future__ import annotations

import logging
import os
import re
from urllib.parse import quote

import vercel_blob

logger = logging.getLogger(__name__)


def _safe_pathname(name: str, doc_id: str) -> str:
    """Build a URL-safe blob pathname from a doc title + partial ID."""
    name = re.sub(r"[^\w\s\-]", "", name)
    name = re.sub(r"\s+", "_", name.strip())
    return f"sops/{name}_{doc_id[:8]}.pdf"


def upload_pdf(pdf_bytes: bytes, doc_name: str, doc_id: str) -> str:
    """Upload a PDF to Vercel Blob (public store) and return the blob URL."""
    if not os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip():
        raise ValueError("BLOB_READ_WRITE_TOKEN environment variable not set")
    pathname = _safe_pathname(doc_name, doc_id)
    resp = vercel_blob.put(pathname, pdf_bytes)
    url = resp["url"]
    logger.info("Uploaded PDF to Vercel Blob: %s (%d bytes)", url, len(pdf_bytes))
    return url


def delete_pdf(blob_url: str) -> None:
    """Delete a PDF from Vercel Blob by its URL."""
    if not blob_url:
        return
    try:
        vercel_blob.delete(blob_url)
        logger.info("Deleted blob: %s", blob_url)
    except Exception as e:
        logger.warning("Failed to delete blob %s: %s", blob_url, e)


def proxy_url_for_blob(blob_url: str) -> str:
    """Return URL for citation links. Public blobs: use direct URL; private: use proxy."""
    if not blob_url:
        return ""
    # If it's a private blob URL, serve via our proxy so backend can add auth
    if ".private.blob.vercel-storage.com" in blob_url:
        return f"/api/documents/pdf?url={quote(blob_url, safe='')}"
    return blob_url
