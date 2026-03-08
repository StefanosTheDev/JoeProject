"""Request/response models for Ingest API."""

from __future__ import annotations

from pydantic import BaseModel


class SyncResponse(BaseModel):
    """Response after triggering a sync."""

    run_id: str | None
    dry_run: bool
    full: bool
    trigger: str
    total_docs: int
    synced: int
    skipped: int
    failed: int
    deactivated: int
    capped: bool
    synced_titles: list[str]
    failed_titles: list[str]
    deactivated_titles: list[str]
    errors: list[str]


class DocumentListItem(BaseModel):
    """Single document in list-documents response."""

    id: str
    title: str | None
    google_doc_url: str | None
    folder_path: str | None
    pdf_url: str | None
    status: str | None
    last_modified: str | None
    last_synced_at: str | None
    last_seen_at: str | None
    deleted_at: str | None
    last_error: str | None
    chunk_count: int


class SyncRunListItem(BaseModel):
    """Single sync run in list-runs response."""

    id: str
    trigger_type: str | None
    status: str | None
    dry_run: bool | None
    full_sync: bool | None
    total_docs: int | None
    synced_docs: int | None
    skipped_docs: int | None
    failed_docs: int | None
    deactivated_docs: int | None
    capped: bool | None
    notes: str | None
    started_at: str | None
    completed_at: str | None


class SyncRunItemDetail(BaseModel):
    """Single item within a sync run."""

    id: str
    google_doc_id: str | None
    document_title: str | None
    action: str | None
    chunk_count: int | None
    error_text: str | None
    details: dict | list | None
    created_at: str | None


class SyncRunDetailResponse(BaseModel):
    """Response for get sync run by id."""

    run: SyncRunListItem
    items: list[SyncRunItemDetail]
