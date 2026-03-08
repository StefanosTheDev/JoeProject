"""
HeyGen video status polling tests (Guide §6).

Lockstep: HEYGEN_ELEVENLABS_PLAN.md — GET /api/heygen/video/status returns status and video_url
when completed; optional DB update.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_video_status_returns_pending(client: TestClient) -> None:
    """GET /api/heygen/video/status?video_id=X returns ok and status when HeyGen returns pending."""
    with patch("app.routers.heygen.router.get_video_status", new_callable=AsyncMock) as m:
        m.return_value = {"ok": True, "video_id": "v1", "status": "pending", "video_url": None, "error": None}
        r = client.get("/api/heygen/video/status?video_id=v1")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["video_id"] == "v1"
    assert data["status"] == "pending"
    assert data.get("video_url") is None


def test_video_status_returns_completed_with_url(client: TestClient) -> None:
    """GET /api/heygen/video/status returns status=completed and video_url when HeyGen completes."""
    with patch("app.routers.heygen.router.get_video_status", new_callable=AsyncMock) as m:
        m.return_value = {"ok": True, "video_id": "v1", "status": "completed", "video_url": "https://example.com/video.mp4", "error": None}
        with patch("app.routers.heygen.router.db") as db_mock:
            db_mock.pool = True
            with patch("app.routers.heygen.router.get_generated_video_by_heygen_id", AsyncMock(return_value={"id": "gen1"})):
                with patch("app.routers.heygen.router.update_generated_video_status", AsyncMock(return_value=None)):
                    r = client.get("/api/heygen/video/status?video_id=v1")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["status"] == "completed"
    assert data["video_url"] == "https://example.com/video.mp4"


def test_video_status_returns_error_when_api_fails(client: TestClient) -> None:
    """GET /api/heygen/video/status returns ok: false when HeyGen returns error."""
    with patch("app.routers.heygen.router.get_video_status", new_callable=AsyncMock) as m:
        m.return_value = {"ok": False, "video_id": "v1", "status": "unknown", "video_url": None, "error": "Not found"}
        r = client.get("/api/heygen/video/status?video_id=v1")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is False
    assert data.get("error")
    assert data["status"] == "unknown"
