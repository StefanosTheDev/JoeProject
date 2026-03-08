#!/usr/bin/env python3
"""
Optional: call GHL custom-values endpoints with a live firm_id.
Run from backend/ with env loaded:
  FIRM_ID=your-connected-firm python scripts/test_ghl_custom_values.py
Or: uv run python scripts/test_ghl_custom_values.py
Uses TestClient (no server needed); firm must be connected in DB for real GHL calls.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, ".")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
FIRM_ID = os.environ.get("FIRM_ID", "test-firm-1")


def main() -> None:
    print(f"Using firm_id={FIRM_ID}")
    print("1) GET /api/connect/custom-values")
    r = client.get("/api/connect/custom-values", params={"firm_id": FIRM_ID})
    ct = r.headers.get("content-type", "")
    print(f"   Status: {r.status_code}, Body: {r.json() if ct.startswith('application/json') else r.text[:200]}")
    if r.status_code == 404:
        print("   (404 = not connected; connect GHL first for this firm_id)")

    print("\n2) POST /api/connect/custom-values (create)")
    r2 = client.post(
        "/api/connect/custom-values",
        json={"firm_id": FIRM_ID, "name": "test_key_script", "value": "test_value"},
    )
    ct2 = r2.headers.get("content-type", "")
    print(f"   Status: {r2.status_code}, Body: {r2.json() if ct2.startswith('application/json') else r2.text[:200]}")
    created_id = None
    if r2.status_code in (200, 201):
        data = r2.json()
        created_id = data.get("customValue", {}).get("id") or data.get("id")

    if created_id:
        print(f"\n3) PUT /api/connect/custom-values/{created_id} (update)")
        r3 = client.put(
            f"/api/connect/custom-values/{created_id}",
            json={"firm_id": FIRM_ID, "value": "updated_value"},
        )
        ct3 = r3.headers.get("content-type", "")
        print(f"   Status: {r3.status_code}, Body: {r3.json() if ct3.startswith('application/json') else r3.text[:200]}")

        print(f"\n4) DELETE /api/connect/custom-values/{created_id}")
        r4 = client.delete(f"/api/connect/custom-values/{created_id}", params={"firm_id": FIRM_ID})
        ct4 = r4.headers.get("content-type", "")
        print(f"   Status: {r4.status_code}, Body: {r4.json() if ct4.startswith('application/json') else r4.text[:200]}")
    else:
        print("   (Skipping PUT/DELETE — create did not return an id)")


if __name__ == "__main__":
    main()
