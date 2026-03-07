"""Ingestion pipeline — syncs Google Drive SOPs into pgvector."""
from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import asyncpg

from app.config import settings
from app.services.blob_storage import delete_pdf, upload_pdf
from app.services.chunker import chunk_document
from app.services.embeddings import embed_documents
from app.services.google_drive import (
    DriveFile,
    export_doc_as_pdf_bytes,
    export_doc_as_text,
    list_docs_in_folder,
)

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    run_id: str | None = None
    total_docs: int = 0
    synced: int = 0
    skipped: int = 0
    failed: int = 0
    deactivated: int = 0
    capped: bool = False
    synced_titles: list[str] | None = None
    failed_titles: list[str] | None = None
    deactivated_titles: list[str] | None = None
    errors: list[str] | None = None

    def __post_init__(self):
        if self.synced_titles is None:
            self.synced_titles = []
        if self.failed_titles is None:
            self.failed_titles = []
        if self.deactivated_titles is None:
            self.deactivated_titles = []
        if self.errors is None:
            self.errors = []


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _normalize_text_for_hash(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines).strip()


def _content_hash(text: str) -> str:
    normalized = _normalize_text_for_hash(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


async def _create_sync_run(
    pool: asyncpg.Pool, *, trigger: str, dry_run: bool, full_sync: bool
) -> str:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """
            INSERT INTO sync_run (trigger_type, dry_run, full_sync)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            trigger,
            dry_run,
            full_sync,
        )


async def _log_sync_item(
    pool: asyncpg.Pool,
    *,
    run_id: str,
    google_doc_id: str | None,
    document_title: str | None,
    action: str,
    chunk_count: int = 0,
    error_text: str | None = None,
    details: dict | None = None,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO sync_run_item
              (sync_run_id, google_doc_id, document_title, action, chunk_count, error_text, details)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7::jsonb)
            """,
            run_id,
            google_doc_id,
            document_title,
            action,
            chunk_count,
            error_text,
            json.dumps(details or {}),
        )


async def _finish_sync_run(
    pool: asyncpg.Pool, result: SyncResult, *, status: str, notes: str | None = None
) -> None:
    if not result.run_id:
        return

    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE sync_run
            SET status = $2,
                total_docs = $3,
                synced_docs = $4,
                skipped_docs = $5,
                failed_docs = $6,
                deactivated_docs = $7,
                capped = $8,
                notes = $9,
                completed_at = now()
            WHERE id = $1
            """,
            result.run_id,
            status,
            result.total_docs,
            result.synced,
            result.skipped,
            result.failed,
            result.deactivated,
            result.capped,
            notes,
        )


async def _mark_doc_failure(
    pool: asyncpg.Pool, google_doc_id: str, error_text: str, run_id: str
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE document
            SET last_error = $2, last_sync_run_id = $3
            WHERE google_doc_id = $1
            """,
            google_doc_id,
            error_text,
            run_id,
        )


async def _mark_seen_without_sync(
    pool: asyncpg.Pool,
    *,
    run_id: str,
    doc_id: str,
    google_doc_id: str,
    doc_file: DriveFile,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE document
            SET title = $2,
                google_doc_url = $3,
                folder_path = $4,
                mime_type = $5,
                status = 'active',
                deleted_at = NULL,
                last_seen_at = now(),
                last_modified = $6,
                last_error = NULL,
                last_sync_run_id = $7
            WHERE id = $1
            """,
            doc_id,
            doc_file.name,
            doc_file.web_view_link,
            doc_file.folder_path,
            doc_file.mime_type,
            doc_file.modified_time,
            run_id,
        )


async def sync_google_drive(
    pool: asyncpg.Pool,
    *,
    trigger: str = "manual",
    dry_run: bool = False,
    full_sync: bool = False,
) -> SyncResult:
    """Sync Google Drive SOPs into Postgres and Blob storage."""
    result = SyncResult()
    result.run_id = await _create_sync_run(
        pool, trigger=trigger, dry_run=dry_run, full_sync=full_sync
    )

    try:
        drive_files = list_docs_in_folder()
        result.total_docs = len(drive_files)
        current_doc_ids = {doc.id for doc in drive_files}

        max_per_run = settings.max_docs_per_sync
        for doc_file in drive_files:
            if max_per_run > 0 and result.synced >= max_per_run:
                result.capped = True
                logger.info(
                    "Reached per-run cap (%d), stopping; remaining docs next run",
                    max_per_run,
                )
                break

            try:
                await _sync_single_doc(
                    pool,
                    doc_file,
                    result,
                    run_id=result.run_id,
                    dry_run=dry_run,
                    full_sync=full_sync,
                )
            except Exception as exc:
                msg = f"Error syncing '{doc_file.name}' ({doc_file.id}): {exc}"
                logger.exception(msg)
                result.failed += 1
                result.failed_titles.append(doc_file.name)
                result.errors.append(msg)
                if not dry_run:
                    await _mark_doc_failure(pool, doc_file.id, msg, result.run_id)
                await _log_sync_item(
                    pool,
                    run_id=result.run_id,
                    google_doc_id=doc_file.id,
                    document_title=doc_file.name,
                    action="failed",
                    error_text=msg,
                    details={"folder_path": doc_file.folder_path, "dry_run": dry_run},
                )

        deactivated_titles = await _deactivate_missing_docs(
            pool,
            run_id=result.run_id,
            current_doc_ids=current_doc_ids,
            dry_run=dry_run,
        )
        result.deactivated = len(deactivated_titles)
        result.deactivated_titles.extend(deactivated_titles)

        status = "completed_with_errors" if result.errors else "completed"
        await _finish_sync_run(pool, result, status=status)
        logger.info(
            "Sync complete (run %s): %d total, %d synced, %d skipped, %d failed, %d deactivated",
            result.run_id,
            result.total_docs,
            result.synced,
            result.skipped,
            result.failed,
            result.deactivated,
        )
        return result
    except Exception as exc:
        msg = f"Fatal sync failure: {exc}"
        logger.exception(msg)
        result.failed += 1
        result.errors.append(msg)
        await _finish_sync_run(pool, result, status="failed", notes=msg)
        return result


async def _sync_single_doc(
    pool: asyncpg.Pool,
    doc_file: DriveFile,
    result: SyncResult,
    *,
    run_id: str,
    dry_run: bool,
    full_sync: bool,
) -> None:
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            """
            SELECT id, last_synced_at, content_hash, pdf_url, status
            FROM document
            WHERE google_doc_id = $1
            """,
            doc_file.id,
        )

    last_synced = _ensure_utc(existing["last_synced_at"]) if existing else None
    existing_status = existing["status"] if existing else None

    if (
        existing
        and existing_status == "active"
        and not full_sync
        and last_synced is not None
        and doc_file.modified_time <= last_synced
    ):
        if not dry_run:
            await _mark_seen_without_sync(
                pool,
                run_id=run_id,
                doc_id=existing["id"],
                google_doc_id=doc_file.id,
                doc_file=doc_file,
            )
        result.skipped += 1
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=doc_file.id,
            document_title=doc_file.name,
            action="unchanged",
            details={"reason": "modified_time_not_newer", "dry_run": dry_run},
        )
        logger.debug("Skipping '%s' — not modified since last sync", doc_file.name)
        return

    logger.info("Inspecting '%s' for sync…", doc_file.name)
    text = export_doc_as_text(doc_file.id)
    if not text.strip():
        result.skipped += 1
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=doc_file.id,
            document_title=doc_file.name,
            action="skipped_empty",
            details={"dry_run": dry_run},
        )
        logger.warning("Document '%s' is empty, skipping", doc_file.name)
        return

    content_hash = _content_hash(text)
    chunks = chunk_document(text)
    if not chunks:
        result.skipped += 1
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=doc_file.id,
            document_title=doc_file.name,
            action="skipped_empty",
            details={"reason": "no_chunks", "dry_run": dry_run},
        )
        return

    if (
        existing
        and existing_status == "active"
        and existing["content_hash"] == content_hash
        and not full_sync
    ):
        if not dry_run:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE document
                    SET title = $2,
                        google_doc_url = $3,
                        folder_path = $4,
                        mime_type = $5,
                        last_modified = $6,
                        last_synced_at = now(),
                        last_seen_at = now(),
                        status = 'active',
                        deleted_at = NULL,
                        last_error = NULL,
                        last_sync_run_id = $7
                    WHERE id = $1
                    """,
                    existing["id"],
                    doc_file.name,
                    doc_file.web_view_link,
                    doc_file.folder_path,
                    doc_file.mime_type,
                    doc_file.modified_time,
                    run_id,
                )

        result.skipped += 1
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=doc_file.id,
            document_title=doc_file.name,
            action="unchanged",
            chunk_count=len(chunks),
            details={"reason": "content_hash_match", "dry_run": dry_run},
        )
        logger.info("Skipping '%s' — content hash unchanged", doc_file.name)
        return

    action = "created"
    if existing:
        action = "reactivated" if existing_status != "active" else "updated"

    if dry_run:
        result.synced += 1
        result.synced_titles.append(doc_file.name)
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=doc_file.id,
            document_title=doc_file.name,
            action=action,
            chunk_count=len(chunks),
            details={"dry_run": True},
        )
        return

    embeddings = embed_documents([chunk.content for chunk in chunks])
    pdf_bytes = export_doc_as_pdf_bytes(doc_file.id)
    new_pdf_url = upload_pdf(pdf_bytes, doc_file.name, doc_file.id)
    old_pdf_url = existing["pdf_url"] if existing else ""

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                if existing:
                    doc_id = existing["id"]
                    await conn.execute(
                        "DELETE FROM document_chunk WHERE document_id = $1",
                        doc_id,
                    )
                    await conn.execute(
                        """
                        UPDATE document
                        SET title = $2,
                            google_doc_url = $3,
                            folder_path = $4,
                            mime_type = $5,
                            pdf_url = $6,
                            content_hash = $7,
                            status = 'active',
                            deleted_at = NULL,
                            last_seen_at = now(),
                            last_error = NULL,
                            last_sync_run_id = $8,
                            last_modified = $9,
                            last_synced_at = now()
                        WHERE id = $1
                        """,
                        doc_id,
                        doc_file.name,
                        doc_file.web_view_link,
                        doc_file.folder_path,
                        doc_file.mime_type,
                        new_pdf_url,
                        content_hash,
                        run_id,
                        doc_file.modified_time,
                    )
                else:
                    doc_id = await conn.fetchval(
                        """
                        INSERT INTO document (
                          google_doc_id, google_doc_url, title, folder_path, mime_type,
                          pdf_url, content_hash, status, deleted_at, last_seen_at,
                          last_error, last_sync_run_id, last_modified, last_synced_at
                        )
                        VALUES (
                          $1, $2, $3, $4, $5,
                          $6, $7, 'active', NULL, now(),
                          NULL, $8, $9, now()
                        )
                        RETURNING id
                        """,
                        doc_file.id,
                        doc_file.web_view_link,
                        doc_file.name,
                        doc_file.folder_path,
                        doc_file.mime_type,
                        new_pdf_url,
                        content_hash,
                        run_id,
                        doc_file.modified_time,
                    )

                for chunk, embedding in zip(chunks, embeddings):
                    embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
                    await conn.execute(
                        """
                        INSERT INTO document_chunk
                          (document_id, content, section_title, chunk_index, token_count, embedding)
                        VALUES ($1, $2, $3, $4, $5, $6::vector)
                        """,
                        doc_id,
                        chunk.content,
                        chunk.section_title,
                        chunk.index,
                        chunk.token_count,
                        embedding_str,
                    )
    except Exception:
        delete_pdf(new_pdf_url)
        raise

    if old_pdf_url and old_pdf_url != new_pdf_url:
        delete_pdf(old_pdf_url)

    result.synced += 1
    result.synced_titles.append(doc_file.name)
    await _log_sync_item(
        pool,
        run_id=run_id,
        google_doc_id=doc_file.id,
        document_title=doc_file.name,
        action=action,
        chunk_count=len(chunks),
        details={"dry_run": False, "folder_path": doc_file.folder_path},
    )
    logger.info(
        "Synced '%s' — %d chunks, PDF: %s",
        doc_file.name,
        len(chunks),
        new_pdf_url,
    )


async def _deactivate_missing_docs(
    pool: asyncpg.Pool,
    *,
    run_id: str,
    current_doc_ids: set[str],
    dry_run: bool,
) -> list[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, google_doc_id, title, pdf_url
            FROM document
            WHERE status = 'active'
            """
        )

    missing_rows = [row for row in rows if row["google_doc_id"] not in current_doc_ids]
    if not missing_rows:
        return []

    titles = [row["title"] for row in missing_rows]
    doc_ids = [row["id"] for row in missing_rows]

    for row in missing_rows:
        await _log_sync_item(
            pool,
            run_id=run_id,
            google_doc_id=row["google_doc_id"],
            document_title=row["title"],
            action="deactivated",
            details={"dry_run": dry_run},
        )

    if dry_run:
        return titles

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                "DELETE FROM document_chunk WHERE document_id = ANY($1::text[])",
                doc_ids,
            )
            await conn.execute(
                """
                UPDATE document
                SET status = 'inactive',
                    deleted_at = now(),
                    last_error = NULL,
                    last_sync_run_id = $2
                WHERE id = ANY($1::text[])
                """,
                doc_ids,
                run_id,
            )

    for row in missing_rows:
        if row["pdf_url"]:
            delete_pdf(row["pdf_url"])

    logger.info("Deactivated %d documents missing from Drive", len(missing_rows))
    return titles
