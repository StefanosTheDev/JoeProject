"""RAG retrieval — query pgvector for relevant SOP chunks."""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass

import asyncpg

from app.services.shared.blob_storage import proxy_url_for_blob
from app.services.shared.embeddings import embed_query

logger = logging.getLogger(__name__)

MAX_CHUNKS_PER_DOCUMENT = 2
MAX_UNIQUE_SOURCES = 4
MIN_RECALL_TOP_K = 24
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
    "what", "when", "where", "which", "with", "you", "your",
}


@dataclass
class RetrievedChunk:
    content: str
    section_title: str
    document_title: str
    folder_path: str
    pdf_url: str
    similarity: float


async def retrieve_relevant_chunks(
    pool: asyncpg.Pool,
    query: str,
    top_k: int = 8,
    similarity_threshold: float = 0.45,
    folder_path_prefix: str | None = None,
    max_chunks_per_document: int = MAX_CHUNKS_PER_DOCUMENT,
    max_unique_sources: int = MAX_UNIQUE_SOURCES,
    recall_top_k: int | None = None,
) -> list[RetrievedChunk]:
    """Embed the query, recall candidate chunks, rerank, then deduplicate by source."""
    query_embedding = embed_query(query)
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"
    recall_limit = recall_top_k or max(MIN_RECALL_TOP_K, top_k * 4)

    async with pool.acquire() as conn:
        if folder_path_prefix:
            rows = await conn.fetch(
                """
                SELECT dc.content, dc.section_title,
                       d.title AS document_title, d.folder_path, d.pdf_url,
                       (dc.embedding <#> $1::vector) * -1 AS similarity
                FROM document_chunk dc
                JOIN document d ON d.id = dc.document_id
                WHERE d.status = 'active'
                  AND d.folder_path ILIKE $3
                ORDER BY dc.embedding <#> $1::vector
                LIMIT $2
                """,
                embedding_str,
                recall_limit,
                f"{folder_path_prefix}%",
            )
        else:
            rows = await conn.fetch(
                """
                SELECT dc.content, dc.section_title,
                       d.title AS document_title, d.folder_path, d.pdf_url,
                       (dc.embedding <#> $1::vector) * -1 AS similarity
                FROM document_chunk dc
                JOIN document d ON d.id = dc.document_id
                WHERE d.status = 'active'
                ORDER BY dc.embedding <#> $1::vector
                LIMIT $2
                """,
                embedding_str,
                recall_limit,
            )

    above_threshold = [
        RetrievedChunk(
            content=r["content"],
            section_title=r["section_title"] or "",
            document_title=r["document_title"],
            folder_path=r["folder_path"] or "",
            pdf_url=r["pdf_url"] or "",
            similarity=float(r["similarity"]),
        )
        for r in rows
        if float(r["similarity"]) >= similarity_threshold
    ]

    reranked = _rerank_chunks(query, above_threshold)
    chunks = _deduplicate_sources(
        reranked,
        max_chunks_per_document=max_chunks_per_document,
        max_unique_sources=max_unique_sources,
    )[:top_k]

    logger.info(
        "Retrieved %d chunks (%d raw above %.2f threshold, recall=%d) for: %s",
        len(chunks), len(above_threshold), similarity_threshold, recall_limit, query[:80],
    )
    return chunks


def _tokenize_for_rerank(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if token not in STOPWORDS and len(token) > 1
    }


def _rerank_chunks(query: str, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
    """Apply a lightweight lexical rerank on top of vector recall."""
    if not chunks:
        return []

    query_lc = query.lower().strip()
    query_tokens = _tokenize_for_rerank(query)
    if not query_tokens:
        return sorted(chunks, key=lambda chunk: chunk.similarity, reverse=True)

    def score(chunk: RetrievedChunk) -> tuple[float, float]:
        content_tokens = _tokenize_for_rerank(chunk.content)
        title_tokens = _tokenize_for_rerank(chunk.document_title)
        section_tokens = _tokenize_for_rerank(chunk.section_title)
        folder_tokens = _tokenize_for_rerank(chunk.folder_path)

        overlap_denominator = max(len(query_tokens), 1)
        overlap_content = len(query_tokens & content_tokens) / overlap_denominator
        overlap_title = len(query_tokens & title_tokens) / overlap_denominator
        overlap_section = len(query_tokens & section_tokens) / overlap_denominator
        overlap_folder = len(query_tokens & folder_tokens) / overlap_denominator

        exact_boost = 0.0
        if query_lc and query_lc in chunk.document_title.lower():
            exact_boost += 0.25
        if query_lc and chunk.section_title and query_lc in chunk.section_title.lower():
            exact_boost += 0.2
        if query_lc and query_lc in chunk.content.lower():
            exact_boost += 0.1

        lexical_score = (
            overlap_content
            + (0.5 * overlap_title)
            + (0.35 * overlap_section)
            + (0.15 * overlap_folder)
        )
        final_score = (chunk.similarity * 0.65) + (lexical_score * 0.35) + exact_boost
        return final_score, chunk.similarity

    return sorted(chunks, key=score, reverse=True)


def _deduplicate_sources(
    chunks: list[RetrievedChunk],
    *,
    max_chunks_per_document: int,
    max_unique_sources: int,
) -> list[RetrievedChunk]:
    """Keep at most N chunks per source and M unique sources total."""
    doc_counts: dict[str, int] = {}
    unique_sources: set[str] = set()
    result: list[RetrievedChunk] = []

    for chunk in chunks:
        doc_key = chunk.document_title

        if doc_key not in unique_sources:
            if len(unique_sources) >= max_unique_sources:
                continue
            unique_sources.add(doc_key)

        count = doc_counts.get(doc_key, 0)
        if count >= max_chunks_per_document:
            continue

        doc_counts[doc_key] = count + 1
        result.append(chunk)

    return result


def format_context_for_prompt(chunks: list[RetrievedChunk]) -> str:
    """Format retrieved chunks with structured metadata for Claude."""
    if not chunks:
        return ""

    seen_sources: dict[str, str] = {}
    for chunk in chunks:
        if chunk.document_title not in seen_sources:
            # Use proxy URL so private blob is fetched via backend
            seen_sources[chunk.document_title] = (
                proxy_url_for_blob(chunk.pdf_url) or chunk.pdf_url
            )

    source_list = "\n".join(
        f"- [{title}]({url})" for title, url in seen_sources.items()
    )

    parts = [
        "--- RETRIEVED SOP CONTEXT ---",
        f"Use the following citation block at the END of your response "
        f"(only if you use this context):\n\n**Sources:**\n{source_list}\n",
    ]

    for i, chunk in enumerate(chunks, 1):
        relevance = "high" if chunk.similarity >= 0.55 else "moderate"
        section = f'\nSection: "{chunk.section_title}"' if chunk.section_title else ""
        folder = f'\nFolder: "{chunk.folder_path}"' if chunk.folder_path else ""
        parts.append(
            f'CONTEXT {i} (relevance: {relevance}):\n'
            f'Document: "{chunk.document_title}"{folder}{section}\n'
            f'{chunk.content}\n'
        )

    parts.append("--- END CONTEXT ---")
    return "\n".join(parts)
