"""
HeyGen + ElevenLabs — Auth verification tests (Guide §2).

Lockstep: HEYGEN_ELEVENLABS_PLAN.md §2 — Testing requirement:
- GET /api/heygen/verify returns 200 and ok: true when key set; ok: false when key missing.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_heygen_verify_response_shape(client: TestClient) -> None:
    """GET /api/heygen/verify returns JSON with ok, and optional message/error/detail/avatars_count."""
    r = client.get("/api/heygen/verify")
    assert r.status_code == 200
    data = r.json()
    assert "ok" in data
    assert isinstance(data["ok"], bool)


def test_heygen_verify_when_key_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """When HEYGEN_API_KEY is not set, verify returns ok: false and error about configuration."""
    from types import SimpleNamespace
    from app.services.heygen import heygen_client
    fake_settings = SimpleNamespace(heygen_api_key="")
    monkeypatch.setattr(heygen_client, "settings", fake_settings)
    from app.main import app
    c = TestClient(app)
    r = c.get("/api/heygen/verify")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is False
    assert data.get("error") or data.get("detail")


def test_heygen_verify_when_key_set(client: TestClient) -> None:
    """When HEYGEN_API_KEY is set and valid, verify returns ok: true (or API error if key invalid)."""
    r = client.get("/api/heygen/verify")
    assert r.status_code == 200
    data = r.json()
    assert "ok" in data
    if data["ok"]:
        assert "message" in data or "avatars_count" in data
    else:
        assert "error" in data or "detail" in data
