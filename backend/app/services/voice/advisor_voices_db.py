"""DB layer for advisor_voices only (bring your own voice per firm)."""
from __future__ import annotations

from typing import Any


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
