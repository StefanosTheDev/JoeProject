"""
HeyGen avatars API tests (Guide §4).

Lockstep: HEYGEN_ELEVENLABS_PLAN.md — GET /api/heygen/avatars returns ok and list;
GET /api/heygen/avatars/firm returns ok and list (with DB or mock).
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_avatars_list_api_returns_ok_and_list(client: TestClient) -> None:
    """GET /api/heygen/avatars returns 200 with ok and avatars list (possibly empty)."""
    with patch("app.routers.heygen.router.list_avatars", new_callable=AsyncMock) as m:
        m.return_value = {"ok": True, "avatars": [{"avatar_id": "a1", "avatar_name": "Test", "avatar_type": "photo"}], "error": None}
        r = client.get("/api/heygen/avatars")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "avatars" in data
    assert len(data["avatars"]) == 1
    assert data["avatars"][0]["avatar_id"] == "a1"


def test_avatars_list_api_returns_error_when_api_fails(client: TestClient) -> None:
    """GET /api/heygen/avatars returns ok: false when HeyGen API fails."""
    with patch("app.routers.heygen.router.list_avatars", new_callable=AsyncMock) as m:
        m.return_value = {"ok": False, "avatars": [], "error": "API key invalid"}
        r = client.get("/api/heygen/avatars")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is False
    assert data.get("error")


def test_avatars_firm_list_returns_ok_when_db_available(client: TestClient) -> None:
    """GET /api/heygen/avatars/firm?firm_id=X returns 200 with ok and avatars list."""
    with patch("app.routers.heygen.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.heygen.router.list_advisor_avatars", new_callable=AsyncMock) as m:
            m.return_value = [{"id": "r1", "firm_id": "f1", "heygen_avatar_id": "a1", "avatar_type": "photo", "status": "active", "created_at": "2026-01-01T00:00:00"}]
            r = client.get("/api/heygen/avatars/firm?firm_id=f1")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "avatars" in data
    assert len(data["avatars"]) == 1
    assert data["avatars"][0]["heygen_avatar_id"] == "a1"


def test_avatars_firm_list_503_when_no_db(client: TestClient) -> None:
    """GET /api/heygen/avatars/firm returns 503 when database not available."""
    with patch("app.routers.heygen.router.db") as db_mock:
        db_mock.pool = None
        r = client.get("/api/heygen/avatars/firm?firm_id=f1")
    assert r.status_code == 503
