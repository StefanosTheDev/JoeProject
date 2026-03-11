"""Webinar API — sessions, register, playback URL (Phase 4)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app import db
from app.models.webinar_models import (
    WebinarRegisterRequest,
    WebinarRegisterResponse,
    WebinarSession,
    WebinarSessionCreate,
    WebinarSessionListResponse,
    WebinarSessionPatch,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webinars", tags=["webinars"])


@router.get("/sessions", response_model=WebinarSessionListResponse)
async def list_sessions(campaign_id: str):
    """List webinar sessions for a campaign."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, campaign_id, scheduled_at, is_active, mux_playback_id,
                   chat_enabled, replay_available_at, created_at
            FROM webinar_sessions
            WHERE campaign_id = $1
            ORDER BY scheduled_at ASC
            """,
            campaign_id,
        )
    total = len(rows)
    return WebinarSessionListResponse(
        sessions=[WebinarSession.model_validate(dict(r)) for r in rows],
        total=total,
    )


@router.post("/sessions", response_model=WebinarSession)
async def create_session(body: WebinarSessionCreate):
    """Create a webinar session (optional mux_playback_id for video)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO webinar_sessions (campaign_id, scheduled_at, mux_playback_id, chat_enabled)
            VALUES ($1, $2, $3, $4)
            RETURNING id, campaign_id, scheduled_at, is_active, mux_playback_id,
                      chat_enabled, replay_available_at, created_at
            """,
            body.campaign_id,
            body.scheduled_at,
            body.mux_playback_id,
            body.chat_enabled,
        )
    if not row:
        raise HTTPException(500, "Insert failed")
    return WebinarSession.model_validate(dict(row))


@router.get("/sessions/{session_id}", response_model=WebinarSession)
async def get_session(session_id: str):
    """Get a webinar session (for room page)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, campaign_id, scheduled_at, is_active, mux_playback_id,
                   chat_enabled, replay_available_at, created_at
            FROM webinar_sessions
            WHERE id = $1
            """,
            session_id,
        )
    if not row:
        raise HTTPException(404, "Session not found")
    return WebinarSession.model_validate(dict(row))


@router.patch("/sessions/{session_id}", response_model=WebinarSession)
async def patch_session(session_id: str, body: WebinarSessionPatch):
    """Update webinar session (e.g. set mux_playback_id from asset_id after upload)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    mux_playback_id = body.mux_playback_id
    if body.asset_id and not mux_playback_id:
        from app.services.mux import get_asset
        result = await get_asset(body.asset_id)
        if not result.get("ok"):
            raise HTTPException(502, result.get("error", "Failed to get Mux asset"))
        mux_playback_id = result.get("playback_id")
    if not mux_playback_id:
        raise HTTPException(400, "Provide asset_id or mux_playback_id")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE webinar_sessions SET mux_playback_id = $1
            WHERE id = $2
            RETURNING id, campaign_id, scheduled_at, is_active, mux_playback_id,
                      chat_enabled, replay_available_at, created_at
            """,
            mux_playback_id,
            session_id,
        )
    if not row:
        raise HTTPException(404, "Session not found")
    return WebinarSession.model_validate(dict(row))


@router.get("/sessions/{session_id}/playback-url")
async def get_playback_url(session_id: str):
    """Return Mux HLS playback URL for the session (for video player)."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT mux_playback_id FROM webinar_sessions WHERE id = $1",
            session_id,
        )
    if not row or not row["mux_playback_id"]:
        raise HTTPException(404, "No playback video for this session")
    return {
        "playback_id": row["mux_playback_id"],
        "hls_url": f"https://stream.mux.com/{row['mux_playback_id']}.m3u8",
    }


@router.post("/sessions/{session_id}/register", response_model=WebinarRegisterResponse)
async def register_for_session(session_id: str, body: WebinarRegisterRequest):
    """Register a contact for a webinar session."""
    if not db.pool:
        raise HTTPException(503, "Database not available")
    async with db.pool.acquire() as conn:
        try:
            await conn.execute(
                """
                INSERT INTO webinar_registrations (session_id, contact_id)
                VALUES ($1, $2)
                ON CONFLICT (session_id, contact_id) DO NOTHING
                """,
                session_id,
                body.contact_id,
            )
        except Exception as e:
            logger.exception("webinar register failed: %s", e)
            return WebinarRegisterResponse(ok=False, error=str(e))
    return WebinarRegisterResponse(ok=True, session_id=session_id)


@router.post("/uploads")
async def create_upload_url(cors_origin: str = "*"):
    """Create a Mux direct upload URL (for uploading webinar video). Returns url and upload_id."""
    from app.services.mux import create_direct_upload
    result = await create_direct_upload(cors_origin=cors_origin)
    if not result.get("ok"):
        raise HTTPException(502, result.get("error", "Mux upload creation failed"))
    return {
        "upload_id": result.get("upload_id"),
        "url": result.get("url"),
        "asset_id": result.get("asset_id"),
    }
