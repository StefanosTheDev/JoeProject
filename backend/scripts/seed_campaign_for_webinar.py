#!/usr/bin/env python3
"""
Create the minimal campaign chain needed for webinar simulation (icp, offer_archetype, offer, campaign).
Run from backend dir: python3 scripts/seed_campaign_for_webinar.py
Uses firm from MESSAGING_DEFAULT_FIRM_ID or first firm in DB. Creates campaign with id 'default'
so funnel/register?campaign_id=default and seed_webinar_session.py work. Idempotent (safe to re-run).
"""
import os
import sys
from pathlib import Path

# backend/scripts -> backend
backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load DATABASE_URL and MESSAGING_DEFAULT_FIRM_ID from .env
env_path = backend_dir / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k == "DATABASE_URL":
                os.environ["DATABASE_URL"] = v
            elif k == "MESSAGING_DEFAULT_FIRM_ID":
                os.environ["MESSAGING_DEFAULT_FIRM_ID"] = v


async def main():
    import asyncpg

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    conn = await asyncpg.connect(url)
    try:
        firm_id = os.environ.get("MESSAGING_DEFAULT_FIRM_ID", "").strip()
        if firm_id:
            row = await conn.fetchrow("SELECT id FROM firm WHERE id = $1", firm_id)
            if not row:
                print(f"ERROR: Firm with id {firm_id!r} not found. Run get_or_create_default_firm.py or fix MESSAGING_DEFAULT_FIRM_ID.")
                sys.exit(1)
        else:
            row = await conn.fetchrow("SELECT id FROM firm ORDER BY created_at ASC LIMIT 1")
            if not row:
                print("ERROR: No firm found. Run python3 scripts/get_or_create_default_firm.py first.")
                sys.exit(1)
            firm_id = row["id"]

        # Fixed ids so we can use ON CONFLICT DO NOTHING and stay idempotent
        archetype_id = "webinar_seed_archetype"
        icp_id = "webinar_seed_icp"
        offer_id = "webinar_seed_offer"
        campaign_id = "default"

        await conn.execute(
            """
            INSERT INTO offer_archetype (id, name, description)
            VALUES ($1, 'Webinar seed archetype', 'For webinar simulation')
            ON CONFLICT (id) DO NOTHING
            """,
            archetype_id,
        )
        await conn.execute(
            """
            INSERT INTO icp_profile (id, firm_id, persona_label, version)
            VALUES ($1, $2, 'Webinar seed ICP', 1)
            ON CONFLICT (id) DO NOTHING
            """,
            icp_id,
            firm_id,
        )
        await conn.execute(
            """
            INSERT INTO offer (id, archetype_id, firm_id, icp_id, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT (id) DO NOTHING
            """,
            offer_id,
            archetype_id,
            firm_id,
            icp_id,
        )
        await conn.execute(
            """
            INSERT INTO campaign (id, firm_id, icp_id, offer_id, name, status)
            VALUES ($1, $2, $3, $4, 'Default', 'in_progress')
            ON CONFLICT (id) DO NOTHING
            """,
            campaign_id,
            firm_id,
            icp_id,
            offer_id,
        )

        print("Campaign seed OK. Campaign id: default (firm_id: %s)" % firm_id)
        print("Next: python3 scripts/seed_webinar_session.py")
    finally:
        await conn.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
