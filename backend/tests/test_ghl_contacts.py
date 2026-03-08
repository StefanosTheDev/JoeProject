"""
GHL Contacts — test POST/PUT/POST search /api/connect/contacts.
Uses mocks for get_valid_access_token and ghl_api.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_create_contact_404_when_not_connected(client: TestClient) -> None:
    """POST /api/connect/contacts returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.post(
                "/api/connect/contacts",
                json={"firm_id": "no-connection", "firstName": "J", "lastName": "D", "email": "j@d.com"},
            )
    assert r.status_code == 404


def test_create_contact_returns_201_when_connected(client: TestClient) -> None:
    """POST /api/connect/contacts creates and returns GHL response when connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
            token_mock.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.create_contact", new_callable=AsyncMock) as api_mock:
                api_mock.return_value = {"contact": {"id": "c1", "email": "j@d.com"}}
                r = client.post(
                    "/api/connect/contacts",
                    json={"firm_id": "firm-1", "firstName": "J", "lastName": "D", "email": "j@d.com"},
                )
    assert r.status_code in (200, 201)
    assert r.json().get("contact", {}).get("id") == "c1"


def test_update_contact_404_when_not_connected(client: TestClient) -> None:
    """PUT /api/connect/contacts/{id} returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.put(
                "/api/connect/contacts/c1",
                json={"firm_id": "no-connection", "firstName": "Updated"},
            )
    assert r.status_code == 404


def test_update_contact_returns_200_when_connected(client: TestClient) -> None:
    """PUT /api/connect/contacts/{id} updates and returns GHL response when connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
            token_mock.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.update_contact", new_callable=AsyncMock) as api_mock:
                api_mock.return_value = {"contact": {"id": "c1", "firstName": "Updated"}}
                r = client.put(
                    "/api/connect/contacts/c1",
                    json={"firm_id": "firm-1", "firstName": "Updated"},
                )
    assert r.status_code == 200


def test_search_contacts_404_when_not_connected(client: TestClient) -> None:
    """POST /api/connect/contacts/search returns 404 when firm not connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as m:
            m.return_value = (None, None)
            r = client.post(
                "/api/connect/contacts/search",
                json={"firm_id": "no-connection", "query": "j@d.com"},
            )
    assert r.status_code == 404


def test_search_contacts_returns_200_when_connected(client: TestClient) -> None:
    """POST /api/connect/contacts/search returns GHL search result when connected."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.oauth.get_valid_access_token", new_callable=AsyncMock) as token_mock:
            token_mock.return_value = ("token", "loc_1")
            with patch("app.routers.ghl.router.ghl_api.search_contacts", new_callable=AsyncMock) as api_mock:
                api_mock.return_value = {"contacts": [{"id": "c1", "email": "j@d.com"}]}
                r = client.post(
                    "/api/connect/contacts/search",
                    json={"firm_id": "firm-1", "query": "j@d.com"},
                )
    assert r.status_code == 200
    assert "contacts" in r.json()
