"""
HeyGen + ElevenLabs — DB layer for advisor_avatars, advisor_voices, generated_videos.
Router → service (this + heygen_client + elevenlabs_voice); no HTTP here.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def get_advisor_voice(pool: Any, firm_id: str) -> dict | None:
    """Return the active advisor voice row for firm_id, or None."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, firm_id, elevenlabs_voice_id, voice_name, sample_audio_url,
                   model_id, stability_setting, status, created_at::text
            FROM advisor_voices
            WHERE firm_id = $1 AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            firm_id,
        )
        return dict(row) if row else None


async def list_advisor_voices(pool: Any, firm_id: str) -> list[dict]:
    """List all advisor voices for firm_id."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, firm_id, elevenlabs_voice_id, voice_name, status, created_at::text
            FROM advisor_voices
            WHERE firm_id = $1
            ORDER BY created_at DESC
            """,
            firm_id,
        )
        return [dict(r) for r in rows]


async def upsert_advisor_voice(
    pool: Any,
    firm_id: str,
    elevenlabs_voice_id: str,
    voice_name: str,
    *,
    sample_audio_url: str | None = None,
    model_id: str = "eleven_multilingual_v2",
    stability_setting: float = 0.75,
) -> str:
    """Insert or update advisor voice; set others for firm to inactive. Returns id."""
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE advisor_voices SET status = 'inactive' WHERE firm_id = $1",
            firm_id,
        )
        row = await conn.fetchrow(
            """
            INSERT INTO advisor_voices (firm_id, elevenlabs_voice_id, voice_name, sample_audio_url, model_id, stability_setting, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING id
            """,
            firm_id,
            elevenlabs_voice_id,
            voice_name,
            sample_audio_url,
            model_id,
            stability_setting,
        )
        return row["id"]


async def get_advisor_avatar(pool: Any, firm_id: str) -> dict | None:
    """Return the active advisor avatar row for firm_id, or None."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, firm_id, heygen_avatar_id, avatar_type, source_asset_url, consent_video_url, status, created_at::text
            FROM advisor_avatars
            WHERE firm_id = $1 AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            firm_id,
        )
        return dict(row) if row else None


async def list_advisor_avatars(pool: Any, firm_id: str) -> list[dict]:
    """List all advisor avatars for firm_id."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, firm_id, heygen_avatar_id, avatar_type, status, created_at::text
            FROM advisor_avatars
            WHERE firm_id = $1
            ORDER BY created_at DESC
            """,
            firm_id,
        )
        return [dict(r) for r in rows]


async def upsert_advisor_avatar(
    pool: Any,
    firm_id: str,
    heygen_avatar_id: str,
    avatar_type: str = "photo",
    *,
    source_asset_url: str | None = None,
    consent_video_url: str | None = None,
) -> str:
    """Insert or set active avatar for firm; set others inactive. Returns id."""
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE advisor_avatars SET status = 'inactive' WHERE firm_id = $1",
            firm_id,
        )
        row = await conn.fetchrow(
            """
            INSERT INTO advisor_avatars (firm_id, heygen_avatar_id, avatar_type, source_asset_url, consent_video_url, status)
            VALUES ($1, $2, $3, $4, $5, 'active')
            RETURNING id
            """,
            firm_id,
            heygen_avatar_id,
            avatar_type,
            source_asset_url,
            consent_video_url,
        )
        return row["id"]


async def create_generated_video(
    pool: Any,
    firm_id: str,
    heygen_video_id: str,
    generation_method: str = "template",
    *,
    campaign_id: str | None = None,
    asset_id: str | None = None,
    template_id: str | None = None,
    test_mode: bool = False,
    captions_enabled: bool = True,
    aspect_ratio: str | None = None,
) -> str:
    """Insert generated_videos row; status = pending. Returns id."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO generated_videos (firm_id, campaign_id, asset_id, template_id, heygen_video_id, generation_method, status, test_mode, captions_enabled, aspect_ratio)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
            RETURNING id
            """,
            firm_id,
            campaign_id,
            asset_id,
            template_id,
            heygen_video_id,
            generation_method,
            test_mode,
            captions_enabled,
            aspect_ratio,
        )
        return row["id"]


async def update_generated_video_status(
    pool: Any,
    generated_video_id: str,
    status: str,
    *,
    video_url: str | None = None,
    thumbnail_url: str | None = None,
    duration_seconds: int | None = None,
) -> None:
    """Update status and optional video_url; set completed_at when status = completed."""
    async with pool.acquire() as conn:
        if status == "completed":
            await conn.execute(
                """
                UPDATE generated_videos
                SET status = $1, video_url = $2, thumbnail_url = $3, duration_seconds = $4, completed_at = now()
                WHERE id = $5
                """,
                status,
                video_url,
                thumbnail_url,
                duration_seconds,
                generated_video_id,
            )
        else:
            await conn.execute(
                """
                UPDATE generated_videos
                SET status = $1, video_url = COALESCE($2, video_url), thumbnail_url = COALESCE($3, thumbnail_url), duration_seconds = COALESCE($4, duration_seconds)
                WHERE id = $5
                """,
                status,
                video_url,
                thumbnail_url,
                duration_seconds,
                generated_video_id,
            )


async def get_generated_video_by_heygen_id(pool: Any, heygen_video_id: str) -> dict | None:
    """Return generated_videos row by heygen_video_id."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, firm_id, heygen_video_id, status, video_url, created_at::text FROM generated_videos WHERE heygen_video_id = $1",
            heygen_video_id,
        )
        return dict(row) if row else None
