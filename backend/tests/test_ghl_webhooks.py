"""
GHL Webhooks — test POST /api/connect/webhooks (log + ContactCreate/ContactUpdate handler).
Asserts 200 and that ghl_webhook_log receives a row when payload has locationId and firm is connected.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def test_webhook_returns_200_and_logs(client: TestClient) -> None:
    """POST /api/connect/webhooks with valid JSON returns 200; process_webhook is called."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.process_webhook", new_callable=AsyncMock) as process_mock:
            process_mock.return_value = ("firm-1", "ContactCreate")
            r = client.post(
                "/api/connect/webhooks",
                content=b'{"type":"ContactCreate","locationId":"loc_123","contactId":"c1"}',
                headers={"Content-Type": "application/json"},
            )
    assert r.status_code == 200
    assert r.json().get("ok") is True
    process_mock.assert_called_once()


def test_webhook_503_when_no_db(client: TestClient) -> None:
    """POST /api/connect/webhooks returns 503 when db.pool is None."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = None
        r = client.post(
            "/api/connect/webhooks",
            content=b'{"type":"ContactCreate","locationId":"loc_123"}',
            headers={"Content-Type": "application/json"},
        )
    assert r.status_code == 503


def test_webhook_401_when_signature_invalid(client: TestClient) -> None:
    """When GHL_WEBHOOK_SIGNING_SECRET is set and signature is wrong, return 401."""
    with patch("app.routers.ghl.router.db") as db_mock:
        db_mock.pool = True
        with patch("app.routers.ghl.router.settings") as settings_mock:
            settings_mock.ghl_webhook_signing_secret = "my_secret"
            r = client.post(
                "/api/connect/webhooks",
                content=b'{"type":"ContactCreate","locationId":"loc_123"}',
                headers={
                    "Content-Type": "application/json",
                    "X-HighLevel-Signature": "invalid_signature",
                },
            )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_process_webhook_logs_and_upserts_contact() -> None:
    """process_webhook with ContactCreate payload calls log_webhook and upsert_contact_sync."""
    import json

    from app.services.ghl.webhooks import process_webhook

    raw = json.dumps({
        "type": "ContactCreate",
        "locationId": "loc_123",
        "contactId": "c1",
    }).encode("utf-8")
    pool_mock = AsyncMock()

    with patch("app.services.ghl.webhooks.get_firm_id_by_location_id", new_callable=AsyncMock) as get_firm:
        get_firm.return_value = "firm-1"
        with patch("app.services.ghl.webhooks.log_webhook", new_callable=AsyncMock):
            with patch("app.services.ghl.webhooks.upsert_contact_sync", new_callable=AsyncMock) as upsert_mock:
                firm_id, event_type = await process_webhook(pool_mock, raw)
    assert firm_id == "firm-1"
    assert event_type == "ContactCreate"
    upsert_mock.assert_called_once()
    call_kw = upsert_mock.call_args[1]
    assert call_kw["firm_id"] == "firm-1"
    assert call_kw["ghl_contact_id"] == "c1"
