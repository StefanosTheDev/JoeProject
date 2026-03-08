"""Voices API tests — list ElevenLabs, create voice, preview TTS, list firm voices."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


def test_get_voices_elevenlabs_returns_200_with_voices(client: TestClient) -> None:
    """GET /api/voices/elevenlabs returns 200 with ok and voices list when ElevenLabs returns data."""
    with patch("app.routers.voices.router.list_voices", new_callable=AsyncMock) as m:
        m.return_value = {"ok": True, "voices": [{"voice_id": "v1", "name": "Test", "labels": {}}], "error": None}
        r = client.get("/api/voices/elevenlabs")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert len(data["voices"]) == 1
    assert data["voices"][0]["voice_id"] == "v1"
    assert data["voices"][0]["name"] == "Test"


def test_get_voices_elevenlabs_returns_ok_false_when_api_fails(client: TestClient) -> None:
    """GET /api/voices/elevenlabs returns 200 with ok: false when ElevenLabs fails."""
    with patch("app.routers.voices.router.list_voices", new_callable=AsyncMock) as m:
        m.return_value = {"ok": False, "voices": [], "error": "ELEVENLABS_API_KEY is not configured"}
        r = client.get("/api/voices/elevenlabs")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is False
    assert data["error"]


def test_get_voices_preview_returns_200(client: TestClient) -> None:
    """GET /api/voices/preview returns 200 with audio_url when TTS succeeds."""
    with patch("app.routers.voices.router.tts_preview", new_callable=AsyncMock) as m:
        m.return_value = {"ok": True, "audio_url": "data:audio/mpeg;base64,xxx", "error": None}
        r = client.get("/api/voices/preview?voice_id=v1&text=Hello")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "audio" in (data.get("audio_url") or "")


def test_get_voices_firm_503_when_no_db(client: TestClient) -> None:
    """GET /api/voices/firm?firm_id=X returns 503 when db.pool is None."""
    with patch("app.routers.voices.router.db") as db_mock:
        db_mock.pool = None
        r = client.get("/api/voices/firm?firm_id=f1")
    assert r.status_code == 503


def test_get_voices_firm_200_when_connected(client: TestClient) -> None:
    """GET /api/voices/firm?firm_id=X returns 200 with voices list from DB."""
    with patch("app.routers.voices.router.db") as db_mock:
        db_mock.pool = object()
        with patch("app.routers.voices.router.list_advisor_voices", new_callable=AsyncMock) as m:
            m.return_value = [
                {"id": "id1", "firm_id": "f1", "elevenlabs_voice_id": "v1", "voice_name": "My Voice", "status": "active", "created_at": "2026-01-01"},
            ]
            r = client.get("/api/voices/firm?firm_id=f1")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert len(data["voices"]) == 1
    assert data["voices"][0]["voice_id"] == "v1"
    assert data["voices"][0]["name"] == "My Voice"
