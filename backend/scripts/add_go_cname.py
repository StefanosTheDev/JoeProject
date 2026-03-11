#!/usr/bin/env python3
"""
Add CNAME record for go.stefanosthedev.com via Vercel API (agentic DNS step).
Loads VERCEL_API_TOKEN (and VERCEL_TEAM_ID) from backend/.env.
Run from backend: python3 scripts/add_go_cname.py
"""
import asyncio
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load .env
env_path = backend_dir / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k in ("VERCEL_API_TOKEN", "VERCEL_TEAM_ID"):
                os.environ[k] = v


async def main():
    import httpx
    token = os.environ.get("VERCEL_API_TOKEN", "").strip()
    team_id = os.environ.get("VERCEL_TEAM_ID", "").strip()
    if not token:
        print("ERROR: VERCEL_API_TOKEN not set in .env")
        sys.exit(1)
    domain = "stefanosthedev.com"
    url = f"https://api.vercel.com/v2/domains/{domain}/records"
    params = {"teamId": team_id} if team_id else {}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {
        "type": "CNAME",
        "name": "go",
        "value": "cname.vercel-dns.com",
        "ttl": 60,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, json=body, params=params, headers=headers)
    data = r.json() if r.content else {}
    if r.status_code in (200, 201):
        print(f"Created CNAME: go.{domain} -> cname.vercel-dns.com")
        print("Record uid:", data.get("uid", data))
        return
    err = data.get("error", {})
    if isinstance(err, dict):
        err = err.get("message", r.text)
    else:
        err = err or r.text
    print(f"ERROR: {r.status_code} - {err}")
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
