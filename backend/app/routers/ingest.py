"""Ingestion API — trigger Google Drive sync and manage documents."""
from __future__ import annotations

import json

from fastapi import APIRouter, Header, HTTPException, Query

from app import db
from app.config import settings
from app.services.ingest import sync_google_drive

router = APIRouter(tags=["ingest"])


def _check_cron_secret(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")) -> None:
    """If CRON_SECRET is set, require it in X-Cron-Secret header (for scheduled or manual sync)."""
    if not settings.cron_secret:
        return
    if x_cron_secret != settings.cron_secret:
        raise HTTPException(401, "Missing or invalid X-Cron-Secret")


@router.post("/ingest/sync")
async def trigger_sync(
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret"),
    dry_run: bool = Query(False),
    full: bool = Query(False),
    trigger: str = Query("manual"),
):
    """
    Sync Google Drive SOPs into the vector store.
    Supports dry-run previews, full rebuilds, and trigger source tracking.
    If CRON_SECRET is set, send it in X-Cron-Secret header.
    """
    _check_cron_secret(x_cron_secret)
    if db.pool is None:
        raise HTTPException(503, "Database not available")

    result = await sync_google_drive(
        db.pool,
        trigger=trigger,
        dry_run=dry_run,
        full_sync=full,
    )
    return {
        "run_id": result.run_id,
        "dry_run": dry_run,
        "full": full,
        "trigger": trigger,
        "total_docs": result.total_docs,
        "synced": result.synced,
        "skipped": result.skipped,
        "failed": result.failed,
        "deactivated": result.deactivated,
        "capped": result.capped,
        "synced_titles": result.synced_titles,
        "failed_titles": result.failed_titles,
        "deactivated_titles": result.deactivated_titles,
        "errors": result.errors,
    }


@router.post("/ingest/rebuild")
async def rebuild_sync(
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret"),
    dry_run: bool = Query(False),
):
    """Force a full rebuild of all indexed docs."""
    return await trigger_sync(
        x_cron_secret=x_cron_secret,
        dry_run=dry_run,
        full=True,
        trigger="rebuild",
    )


@router.get("/ingest/documents")
async def list_documents(status: str | None = Query(None)):
    """List synced documents, optionally filtering by lifecycle status."""
    if db.pool is None:
        return {"error": "Database not available"}, 503

    async with db.pool.acquire() as conn:
        if status:
            rows = await conn.fetch(
                """
                SELECT d.id, d.title, d.google_doc_url, d.folder_path, d.pdf_url,
                       d.status, d.last_modified, d.last_synced_at, d.last_seen_at,
                       d.deleted_at, d.last_error, COUNT(dc.id) AS chunk_count
                FROM document d
                LEFT JOIN document_chunk dc ON dc.document_id = d.id
                WHERE d.status = $1
                GROUP BY d.id
                ORDER BY d.title
                """,
                status,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT d.id, d.title, d.google_doc_url, d.folder_path, d.pdf_url,
                       d.status, d.last_modified, d.last_synced_at, d.last_seen_at,
                       d.deleted_at, d.last_error, COUNT(dc.id) AS chunk_count
                FROM document d
                LEFT JOIN document_chunk dc ON dc.document_id = d.id
                GROUP BY d.id
                ORDER BY d.title
                """
            )

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "google_doc_url": r["google_doc_url"],
            "folder_path": r["folder_path"],
            "pdf_url": r["pdf_url"],
            "status": r["status"],
            "last_modified": r["last_modified"].isoformat() if r["last_modified"] else None,
            "last_synced_at": r["last_synced_at"].isoformat() if r["last_synced_at"] else None,
            "last_seen_at": r["last_seen_at"].isoformat() if r["last_seen_at"] else None,
            "deleted_at": r["deleted_at"].isoformat() if r["deleted_at"] else None,
            "last_error": r["last_error"],
            "chunk_count": r["chunk_count"],
        }
        for r in rows
    ]


@router.get("/ingest/runs")
async def list_sync_runs(limit: int = Query(20, ge=1, le=100)):
    """List recent sync runs with aggregate counts."""
    if db.pool is None:
        raise HTTPException(503, "Database not available")

    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, trigger_type, status, dry_run, full_sync,
                   total_docs, synced_docs, skipped_docs, failed_docs,
                   deactivated_docs, capped, notes, started_at, completed_at
            FROM sync_run
            ORDER BY started_at DESC
            LIMIT $1
            """,
            limit,
        )

    return [
        {
            "id": r["id"],
            "trigger_type": r["trigger_type"],
            "status": r["status"],
            "dry_run": r["dry_run"],
            "full_sync": r["full_sync"],
            "total_docs": r["total_docs"],
            "synced_docs": r["synced_docs"],
            "skipped_docs": r["skipped_docs"],
            "failed_docs": r["failed_docs"],
            "deactivated_docs": r["deactivated_docs"],
            "capped": r["capped"],
            "notes": r["notes"],
            "started_at": r["started_at"].isoformat() if r["started_at"] else None,
            "completed_at": r["completed_at"].isoformat() if r["completed_at"] else None,
        }
        for r in rows
    ]


@router.get("/ingest/runs/{run_id}")
async def get_sync_run(run_id: str):
    """Fetch a sync run plus its per-document items."""
    if db.pool is None:
        raise HTTPException(503, "Database not available")

    async with db.pool.acquire() as conn:
        run = await conn.fetchrow(
            """
            SELECT id, trigger_type, status, dry_run, full_sync,
                   total_docs, synced_docs, skipped_docs, failed_docs,
                   deactivated_docs, capped, notes, started_at, completed_at
            FROM sync_run
            WHERE id = $1
            """,
            run_id,
        )
        if run is None:
            raise HTTPException(404, "Sync run not found")

        items = await conn.fetch(
            """
            SELECT id, google_doc_id, document_title, action,
                   chunk_count, error_text, details, created_at
            FROM sync_run_item
            WHERE sync_run_id = $1
            ORDER BY created_at ASC
            """,
            run_id,
        )

    return {
        "run": {
            "id": run["id"],
            "trigger_type": run["trigger_type"],
            "status": run["status"],
            "dry_run": run["dry_run"],
            "full_sync": run["full_sync"],
            "total_docs": run["total_docs"],
            "synced_docs": run["synced_docs"],
            "skipped_docs": run["skipped_docs"],
            "failed_docs": run["failed_docs"],
            "deactivated_docs": run["deactivated_docs"],
            "capped": run["capped"],
            "notes": run["notes"],
            "started_at": run["started_at"].isoformat() if run["started_at"] else None,
            "completed_at": run["completed_at"].isoformat() if run["completed_at"] else None,
        },
        "items": [
            {
                "id": item["id"],
                "google_doc_id": item["google_doc_id"],
                "document_title": item["document_title"],
                "action": item["action"],
                "chunk_count": item["chunk_count"],
                "error_text": item["error_text"],
                "details": (
                    json.loads(item["details"])
                    if isinstance(item["details"], str) and item["details"]
                    else item["details"]
                ),
                "created_at": item["created_at"].isoformat() if item["created_at"] else None,
            }
            for item in items
        ],
    }
