#!/usr/bin/env python3
"""
Create one webinar session for an existing campaign (for Mux webinar simulation).
Run from backend dir: python3 scripts/seed_webinar_session.py [--campaign-id ID] [--future]
- Default: scheduled_at = 1 hour ago (instant playback in room).
- --future: scheduled_at = 10 minutes from now (tests countdown).
Prints session id and join URL (e.g. http://localhost:5173/webinar/watch/{id}).
"""
import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# backend/scripts -> backend
backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load DATABASE_URL from .env
env_path = backend_dir / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            if k.strip() == "DATABASE_URL":
                v = v.strip().strip('"').strip("'")
                os.environ["DATABASE_URL"] = v
                break

JOIN_URL_BASE = os.environ.get("WEBINAR_JOIN_URL_BASE", "http://localhost:5173")


async def main():
    import asyncpg

    parser = argparse.ArgumentParser(description="Seed one webinar session for simulation.")
    parser.add_argument("--campaign-id", type=str, default=None, help="Campaign id (default: env WEBINAR_DEFAULT_CAMPAIGN_ID or first campaign)")
    parser.add_argument("--future", action="store_true", help="Schedule 10 min in future (for countdown test)")
    args = parser.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    conn = await asyncpg.connect(url)
    try:
        campaign_id = args.campaign_id or os.environ.get("WEBINAR_DEFAULT_CAMPAIGN_ID")
        if campaign_id:
            row = await conn.fetchrow("SELECT id FROM campaign WHERE id = $1", campaign_id)
            if not row:
                print(f"ERROR: Campaign with id {campaign_id!r} not found.")
                sys.exit(1)
        else:
            row = await conn.fetchrow("SELECT id FROM campaign ORDER BY created_at ASC LIMIT 1")
            if not row:
                print("ERROR: No campaign found. Create a campaign first (campaign has required icp_id, offer_id).")
                sys.exit(1)
            campaign_id = row["id"]

        if args.future:
            scheduled_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        else:
            scheduled_at = datetime.now(timezone.utc) - timedelta(hours=1)

        session_row = await conn.fetchrow(
            """
            INSERT INTO webinar_sessions (campaign_id, scheduled_at, mux_playback_id, chat_enabled)
            VALUES ($1, $2, NULL, true)
            RETURNING id, campaign_id, scheduled_at
            """,
            campaign_id,
            scheduled_at,
        )
        session_id = session_row["id"]
        join_url = f"{JOIN_URL_BASE}/webinar/watch/{session_id}"
        print(f"Created webinar session: {session_id}")
        print(f"  campaign_id:   {campaign_id}")
        print(f"  scheduled_at:  {session_row['scheduled_at']}")
        print(f"  Join URL:      {join_url}")
        if not args.future:
            print("  (scheduled in past — room will show video block immediately, or use ?simulate=1)")
    finally:
        await conn.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
