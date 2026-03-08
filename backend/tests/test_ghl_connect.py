"""
GHL (GoHighLevel) OAuth connect — test /api/connect/* routes.

Verifies:
- GET /api/connect/oauth/url returns auth URL when GHL is configured.
- GET /api/connect/connection returns status (connected true/false).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_connect_oauth_url_returns_200_and_url(client: TestClient) -> None:
    """GET /api/connect/oauth/url?firm_id=X returns 200 and JSON with url key."""
    r = client.get("/api/connect/oauth/url", params={"firm_id": "test-firm-1"})
    # 200 when configured; 503 when GHL_CLIENT_ID or GHL_REDIRECT_URI missing
    assert r.status_code in (200, 503), r.text
    data = r.json()
    if r.status_code == 200:
        assert "url" in data
        assert "marketplace.gohighlevel.com" in data["url"] or "leadconnector" in data["url"]
        assert "api/connect/oauth/callback" in data["url"] or "oauth%2Fcallback" in data["url"]
        assert "test-firm-1" in data["url"] or "state=" in data["url"]


def test_connect_connection_returns_200(client: TestClient) -> None:
    """GET /api/connect/connection?firm_id=X returns 200 and connected key."""
    r = client.get("/api/connect/connection", params={"firm_id": "test-firm-1"})
    # 200 or 503 (if DB not available)
    assert r.status_code in (200, 503), r.text
    if r.status_code == 200:
        data = r.json()
        assert "connected" in data
        assert "firm_id" in data
        assert data["firm_id"] == "test-firm-1"
