"""Ingest router — trigger Google Drive sync and manage documents. HTTP only; delegates to services."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app import db
from app.dependencies import require_cron_secret
from app.models.ingest_models import (
    DocumentListItem,
    SyncResponse,
    SyncRunDetailResponse,
    SyncRunListItem,
)
from app.services.ingest import (
    sync_google_drive,
    list_documents as svc_list_documents,
    list_sync_runs as svc_list_sync_runs,
    get_sync_run as svc_get_sync_run,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ingest"])


@router.post("/ingest/sync", response_model=SyncResponse)
async def trigger_sync(
    dry_run: bool = Query(False),
    full: bool = Query(False),
    trigger: str = Query("manual"),
    _: None = Depends(require_cron_secret),
):
    """
    Sync Google Drive SOPs into the vector store.
    Supports dry-run previews, full rebuilds, and trigger source tracking.
    If CRON_SECRET is set, send it in X-Cron-Secret header.
    """
    if db.pool is None:
        raise HTTPException(503, "Database not available")
    try:
        result = await sync_google_drive(
            db.pool,
            trigger=trigger,
            dry_run=dry_run,
            full_sync=full,
        )
        return SyncResponse(
            run_id=result.run_id,
            dry_run=dry_run,
            full=full,
            trigger=trigger,
            total_docs=result.total_docs,
            synced=result.synced,
            skipped=result.skipped,
            failed=result.failed,
            deactivated=result.deactivated,
            capped=result.capped,
            synced_titles=result.synced_titles or [],
            failed_titles=result.failed_titles or [],
            deactivated_titles=result.deactivated_titles or [],
            errors=result.errors or [],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("trigger_sync failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.post("/ingest/rebuild", response_model=SyncResponse)
async def rebuild_sync(
    dry_run: bool = Query(False),
    _: None = Depends(require_cron_secret),
):
    """Force a full rebuild of all indexed docs."""
    return await trigger_sync(dry_run=dry_run, full=True, trigger="rebuild")


@router.get("/ingest/documents", response_model=list[DocumentListItem])
async def list_documents(status: str | None = Query(None)):
    """List synced documents, optionally filtering by lifecycle status."""
    if db.pool is None:
        raise HTTPException(503, "Database not available")
    try:
        return await svc_list_documents(db.pool, status=status)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("list_documents failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/ingest/runs", response_model=list[SyncRunListItem])
async def list_sync_runs(limit: int = Query(20, ge=1, le=100)):
    """List recent sync runs with aggregate counts."""
    if db.pool is None:
        raise HTTPException(503, "Database not available")
    try:
        return await svc_list_sync_runs(db.pool, limit=limit)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("list_sync_runs failed: %s", e)
        raise HTTPException(500, "Internal server error")


@router.get("/ingest/runs/{run_id}", response_model=SyncRunDetailResponse)
async def get_sync_run(run_id: str):
    """Fetch a sync run plus its per-document items."""
    if db.pool is None:
        raise HTTPException(503, "Database not available")
    try:
        data = await svc_get_sync_run(db.pool, run_id)
        if data is None:
            raise HTTPException(404, "Sync run not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_sync_run failed: %s", e)
        raise HTTPException(500, "Internal server error")
