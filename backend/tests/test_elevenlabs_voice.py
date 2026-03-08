"""
ElevenLabs voice cloning tests (Guide §3).

Lockstep: HEYGEN_ELEVENLABS_PLAN.md — Mock httpx for create_voice and tts_preview;
assert URLs, headers, and response parsing (voice_id, audio_url).
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.heygen.elevenlabs_voice import create_voice, list_voices, tts_preview


@pytest.mark.asyncio
async def test_create_voice_returns_voice_id_on_success() -> None:
    """create_voice returns ok and voice_id when ElevenLabs returns 200 with voice_id."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"voice_id": "elv_abc123"}
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    with patch("app.services.heygen.elevenlabs_voice.settings", MagicMock(elevenlabs_api_key="test_key")):
        with patch("httpx.AsyncClient") as client_cls:
            client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
            result = await create_voice(name="Test", file_content=b"fake_audio", file_name="test.mp3")
    assert result["ok"] is True
    assert result["voice_id"] == "elv_abc123"
    assert result.get("error") is None


@pytest.mark.asyncio
async def test_create_voice_returns_error_when_key_missing() -> None:
    """create_voice returns ok: false when ELEVENLABS_API_KEY is not set."""
    with patch("app.services.heygen.elevenlabs_voice.settings", MagicMock(elevenlabs_api_key="")):
        result = await create_voice(name="Test", file_content=b"x", file_name="x.mp3")
    assert result["ok"] is False
    assert result["voice_id"] is None
    assert "ELEVENLABS" in (result.get("error") or "")


@pytest.mark.asyncio
async def test_tts_preview_returns_audio_url_on_success() -> None:
    """tts_preview returns ok and audio_url (base64 data URL) when API returns 200 with audio bytes."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b"fake_mp3_bytes"
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    with patch("app.services.heygen.elevenlabs_voice.settings", MagicMock(elevenlabs_api_key="test_key")):
        with patch("httpx.AsyncClient") as client_cls:
            client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
            result = await tts_preview("voice_1", "Hello world")
    assert result["ok"] is True
    assert result.get("audio_url") is not None
    assert result["audio_url"].startswith("data:audio/mpeg;base64,")
    assert result.get("error") is None


@pytest.mark.asyncio
async def test_list_voices_returns_voices_on_success() -> None:
    """list_voices returns ok and list of voices when API returns 200."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"voices": [{"voice_id": "v1", "name": "Voice 1", "labels": {}}]}
    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    with patch("app.services.heygen.elevenlabs_voice.settings", MagicMock(elevenlabs_api_key="test_key")):
        with patch("httpx.AsyncClient") as client_cls:
            client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
            result = await list_voices()
    assert result["ok"] is True
    assert len(result["voices"]) == 1
    assert result["voices"][0]["voice_id"] == "v1"
    assert result["voices"][0]["name"] == "Voice 1"
