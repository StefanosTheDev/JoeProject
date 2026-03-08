#!/usr/bin/env python3
"""
Quick test of GHL connect endpoints. Run from backend/ with env loaded:
  python scripts/test_ghl_connect.py
Or with uv: uv run python scripts/test_ghl_connect.py
"""
from __future__ import annotations

import sys

# Run from backend/ so app is importable
sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def main() -> None:
    print("1) GET /api/connect/oauth/url?firm_id=test-firm-1")
    r = client.get("/api/connect/oauth/url", params={"firm_id": "test-firm-1"})
    print(f"   Status: {r.status_code}")
    data = r.json()
    print(f"   Body: {data}")
    if r.status_code == 200 and "url" in data:
        url = data["url"]
        assert "marketplace.gohighlevel.com" in url or "leadconnector" in url, "URL should point to GHL"
        assert "api/connect/oauth/callback" in url or "oauth%2Fcallback" in url, "redirect_uri should be our callback"
        print("   OK: OAuth URL looks valid.")
    elif r.status_code == 503:
        print("   (503 = GHL not configured; set GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_REDIRECT_URI in .env)")

    print("\n2) GET /api/connect/connection?firm_id=test-firm-1")
    r2 = client.get("/api/connect/connection", params={"firm_id": "test-firm-1"})
    print(f"   Status: {r2.status_code}")
    data2 = r2.json()
    print(f"   Body: {data2}")
    if r2.status_code == 200:
        print("   OK: Connection status returned.")
    elif r2.status_code == 503:
        print("   (503 = DB not available)")

if __name__ == "__main__":
    main()
