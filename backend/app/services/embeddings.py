"""Voyage AI embedding service."""
from __future__ import annotations

import logging

import voyageai

from app.config import settings

logger = logging.getLogger(__name__)

MODEL = "voyage-3.5"
BATCH_SIZE = 128


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed a list of document chunks for storage."""
    client = voyageai.Client(api_key=settings.voyage_api_key)
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        result = client.embed(batch, model=MODEL, input_type="document")
        all_embeddings.extend(result.embeddings)
        logger.info("Embedded batch %d–%d", i, i + len(batch))

    return all_embeddings


def embed_query(text: str) -> list[float]:
    """Embed a single query for retrieval."""
    client = voyageai.Client(api_key=settings.voyage_api_key)
    result = client.embed([text], model=MODEL, input_type="query")
    return result.embeddings[0]
