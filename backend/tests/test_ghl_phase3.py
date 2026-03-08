"""
GHL Phase 3 — calendar events, opportunities, snapshots, funnels.
Tests GET/POST/PUT routes with mocked get_valid_access_token and ghl_api.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_calendar_events_404_when_not_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.get("/api/connect/calendar/events", params={"firm_id": "x"})
    assert r.status_code == 404


def test_calendar_events_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.get_calendar_events", new_callable=AsyncMock) as api:
                api.return_value = {"events": []}
                r = client.get("/api/connect/calendar/events", params={"firm_id": "firm-1"})
    assert r.status_code == 200


def test_create_opportunity_404_when_not_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.post("/api/connect/opportunities", json={"firm_id": "x", "contactId": "c1"})
    assert r.status_code == 404


def test_create_opportunity_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.create_opportunity", new_callable=AsyncMock) as api:
                api.return_value = {"opportunity": {"id": "opp1"}}
                r = client.post(
                    "/api/connect/opportunities",
                    json={"firm_id": "firm-1", "contactId": "c1", "pipelineId": "p1"},
                )
    assert r.status_code in (200, 201)


def test_search_opportunities_404_when_not_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.get("/api/connect/opportunities/search", params={"firm_id": "x"})
    assert r.status_code == 404


def test_search_opportunities_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.search_opportunities", new_callable=AsyncMock) as api:
                api.return_value = {"opportunities": []}
                r = client.get("/api/connect/opportunities/search", params={"firm_id": "firm-1"})
    assert r.status_code == 200


def test_snapshots_404_when_not_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.get("/api/connect/snapshots", params={"firm_id": "x"})
    assert r.status_code == 404


def test_snapshots_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.get_snapshots", new_callable=AsyncMock) as api:
                api.return_value = {"snapshots": []}
                r = client.get("/api/connect/snapshots", params={"firm_id": "firm-1"})
    assert r.status_code == 200


def test_funnels_404_when_not_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.get("/api/connect/funnels", params={"firm_id": "x"})
    assert r.status_code == 404


def test_funnels_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.get_funnels", new_callable=AsyncMock) as api:
                api.return_value = {"funnels": []}
                r = client.get("/api/connect/funnels", params={"firm_id": "firm-1"})
    assert r.status_code == 200


def test_funnel_pages_200_when_connected(client: TestClient) -> None:
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.get_funnel_pages", new_callable=AsyncMock) as api:
                api.return_value = {"pages": []}
                r = client.get(
                    "/api/connect/funnels/funnel_123/pages",
                    params={"firm_id": "firm-1"},
                )
    assert r.status_code == 200
