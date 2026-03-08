"""
HeyGen video generation tests (Guide §5, §10).

Lockstep: HEYGEN_ELEVENLABS_PLAN.md — POST /heygen/video/generate returns 400 when firm has no
avatar/voice; POST with script length 5001 returns 422; mock generate_direct and template.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_direct_generate_400_when_no_avatar(client: TestClient) -> None:
    """POST /api/heygen/video/generate returns 400 when firm has no advisor avatar (DB returns None)."""
    with patch("app.routers.heygen.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.heygen.router.get_advisor_avatar", AsyncMock(return_value=None)):
            with patch("app.routers.heygen.router.get_advisor_voice", AsyncMock(return_value={"elevenlabs_voice_id": "v1"})):
                r = client.post(
                    "/api/heygen/video/generate",
                    json={
                        "firm_id": "f1",
                        "script_text": "Hello world.",
                    },
                )
    assert r.status_code == 400
    assert "avatar" in r.json().get("detail", "").lower()


def test_direct_generate_400_when_no_voice(client: TestClient) -> None:
    """POST /api/heygen/video/generate returns 400 when firm has no advisor voice."""
    with patch("app.routers.heygen.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.heygen.router.get_advisor_avatar", AsyncMock(return_value={"heygen_avatar_id": "a1"})):
            with patch("app.routers.heygen.router.get_advisor_voice", AsyncMock(return_value=None)):
                r = client.post(
                    "/api/heygen/video/generate",
                    json={
                        "firm_id": "f1",
                        "script_text": "Hello world.",
                    },
                )
    assert r.status_code == 400
    assert "voice" in r.json().get("detail", "").lower()


def test_direct_generate_422_when_script_over_5000_chars(client: TestClient) -> None:
    """POST /api/heygen/video/generate with script_text length 5001 returns 422 (Guide §10)."""
    r = client.post(
        "/api/heygen/video/generate",
        json={
            "firm_id": "f1",
            "script_text": "x" * 5001,
        },
    )
    assert r.status_code == 422


def test_direct_generate_200_when_mocked_success(client: TestClient) -> None:
    """POST /api/heygen/video/generate returns 200 and video_id when avatar/voice exist and HeyGen returns video_id."""
    with patch("app.routers.heygen.router.get_advisor_avatar", AsyncMock(return_value={"heygen_avatar_id": "avatar1"})):
        with patch("app.routers.heygen.router.get_advisor_voice", AsyncMock(return_value={"elevenlabs_voice_id": "voice1"})):
            with patch("app.routers.heygen.router.generate_direct_video", AsyncMock(return_value={"ok": True, "video_id": "vid123", "status": "pending"})):
                with patch("app.routers.heygen.router.create_generated_video", AsyncMock(return_value="gen_id_1")):
                    with patch("app.routers.heygen.router.db") as db_mock:
                        db_mock.pool = True
                        r = client.post(
                            "/api/heygen/video/generate",
                            json={
                                "firm_id": "f1",
                                "script_text": "Hello world.",
                            },
                        )
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data.get("video_id") == "vid123"


def test_template_generate_200_when_mocked_success(client: TestClient) -> None:
    """POST /api/heygen/video/generate/template returns 200 and video_id when HeyGen returns video_id."""
    with patch("app.routers.heygen.router.generate_from_template", AsyncMock(return_value={"ok": True, "video_id": "tvid456", "status": "pending"})):
        with patch("app.routers.heygen.router.create_generated_video", AsyncMock(return_value="gen_id_2")):
            with patch("app.routers.heygen.router.db") as db_mock:
                db_mock.pool = True
                r = client.post(
                    "/api/heygen/video/generate/template",
                    json={
                        "firm_id": "f1",
                        "template_id": "tpl_1",
                        "variables": {
                            "hook_script": {"name": "hook_script", "type": "text", "properties": {"content": "Hi."}},
                        },
                    },
                )
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data.get("video_id") == "tvid456"
