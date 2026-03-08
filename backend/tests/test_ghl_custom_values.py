"""
GHL Custom Values — test GET/POST/PUT/DELETE /api/connect/custom-values.

Uses mocks for get_valid_access_token and ghl_api so no real GHL connection is required.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_get_custom_values_404_when_not_connected(client: TestClient) -> None:
    """GET /api/connect/custom-values?firm_id=X returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.get("/api/connect/custom-values", params={"firm_id": "no-connection"})
    assert r.status_code == 404
    assert "Not connected" in r.text or "not connected" in r.text.lower()


def test_get_custom_values_returns_list_when_connected(client: TestClient) -> None:
    """GET /api/connect/custom-values returns GHL response (e.g. customValues list) when connected."""
    with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
        token_mock.return_value = ("fake_token", "loc_123")
        with patch("app.routers.ghl.router.ghl_api.get_custom_values", new_callable=AsyncMock) as api_mock:
            api_mock.return_value = {"customValues": [{"id": "cv1", "name": "key1", "value": "val1"}]}
            with patch("app.routers.ghl.router.db") as db_mock:
                db_mock.pool = True
                r = client.get("/api/connect/custom-values", params={"firm_id": "firm-1"})
    assert r.status_code == 200
    data = r.json()
    assert "customValues" in data
    assert len(data["customValues"]) == 1
    assert data["customValues"][0]["id"] == "cv1"


def test_post_custom_values_404_when_not_connected(client: TestClient) -> None:
    """POST /api/connect/custom-values returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.post(
                "/api/connect/custom-values",
                json={"firm_id": "no-connection", "name": "n", "value": "v"},
            )
    assert r.status_code == 404


def test_post_custom_values_creates_and_returns_id(client: TestClient) -> None:
    """POST /api/connect/custom-values creates and returns GHL response with id."""
    with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
        token_mock.return_value = ("fake_token", "loc_123")
        with patch("app.routers.ghl.router.ghl_api.create_custom_value", new_callable=AsyncMock) as api_mock:
            api_mock.return_value = {"customValue": {"id": "cv_new", "name": "n", "value": "v"}}
            with patch("app.routers.ghl.router.db") as db_mock:
                db_mock.pool = True
                r = client.post(
                    "/api/connect/custom-values",
                    json={"firm_id": "firm-1", "name": "n", "value": "v"},
                )
    assert r.status_code in (200, 201)
    data = r.json()
    assert "customValue" in data or "id" in data


def test_put_custom_values_404_when_not_connected(client: TestClient) -> None:
    """PUT /api/connect/custom-values/{id} returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.put(
                "/api/connect/custom-values/cv_123",
                json={"firm_id": "no-connection", "value": "updated"},
            )
    assert r.status_code == 404


def test_put_custom_values_updates(client: TestClient) -> None:
    """PUT /api/connect/custom-values/{id} updates and returns GHL response."""
    with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
        token_mock.return_value = ("fake_token", "loc_123")
        with patch("app.routers.ghl.router.ghl_api.update_custom_value", new_callable=AsyncMock) as api_mock:
            api_mock.return_value = {"customValue": {"id": "cv_123", "value": "updated"}}
            with patch("app.routers.ghl.router.db") as db_mock:
                db_mock.pool = True
                r = client.put(
                    "/api/connect/custom-values/cv_123",
                    json={"firm_id": "firm-1", "value": "updated"},
                )
    assert r.status_code == 200
    data = r.json()
    assert "customValue" in data or data.get("value") == "updated" or "id" in data


def test_delete_custom_values_404_when_not_connected(client: TestClient) -> None:
    """DELETE /api/connect/custom-values/{id}?firm_id=X returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.delete(
                "/api/connect/custom-values/cv_123",
                params={"firm_id": "no-connection"},
            )
    assert r.status_code == 404


def test_delete_custom_values_succeeds(client: TestClient) -> None:
    """DELETE /api/connect/custom-values/{id} returns 200 and ok when connected."""
    with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
        token_mock.return_value = ("fake_token", "loc_123")
        with patch("app.routers.ghl.router.ghl_api.delete_custom_value", new_callable=AsyncMock) as api_mock:
            api_mock.return_value = None
            with patch("app.routers.ghl.router.db") as db_mock:
                db_mock.pool = True
                r = client.delete(
                    "/api/connect/custom-values/cv_123",
                    params={"firm_id": "firm-1"},
                )
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data.get("id") == "cv_123"
