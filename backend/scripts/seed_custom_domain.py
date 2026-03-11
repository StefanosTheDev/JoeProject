#!/usr/bin/env python3
"""
Seed a custom domain for BYOD testing.
Run from backend dir: python3 scripts/seed_custom_domain.py <hostname> [firm_id] [default_campaign_id]
Example: python3 scripts/seed_custom_domain.py go.yourtestdomain.com default default
Requires: migration add_custom_domains.sql applied, DATABASE_URL in .env.
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

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


async def main():
    import asyncpg

    hostname = (sys.argv[1] if len(sys.argv) > 1 else "").strip().lower()
    firm_id = (sys.argv[2] if len(sys.argv) > 2 else "default").strip()
    default_campaign_id = (sys.argv[3] if len(sys.argv) > 3 else None)
    if default_campaign_id is not None:
        default_campaign_id = default_campaign_id.strip() or None

    if not hostname:
        print("Usage: python3 scripts/seed_custom_domain.py <hostname> [firm_id] [default_campaign_id]")
        print("Example: python3 scripts/seed_custom_domain.py go.yourtestdomain.com default")
        sys.exit(1)

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    conn = await asyncpg.connect(url)
    try:
        await conn.execute(
            """
            INSERT INTO custom_domains (hostname, firm_id, status, verified_at, default_campaign_id)
            VALUES ($1, $2, 'verified', now(), $3)
            ON CONFLICT (hostname) DO UPDATE SET
                firm_id = EXCLUDED.firm_id,
                status = 'verified',
                verified_at = now(),
                default_campaign_id = EXCLUDED.default_campaign_id,
                updated_at = now()
            """,
            hostname,
            firm_id,
            default_campaign_id,
        )
        print(f"Seeded custom domain: {hostname} -> firm_id={firm_id}" + (f", default_campaign_id={default_campaign_id}" if default_campaign_id else ""))
        print("\nNext: Add this domain in Vercel (Project → Settings → Domains), then point DNS CNAME to Vercel.")
        print(f"Visit: https://{hostname}/funnel/register")
    except asyncpg.UndefinedTableError:
        print("ERROR: custom_domains table not found. Run migration first:")
        print("  psql $DATABASE_URL -f app/sql/migrations/add_custom_domains.sql")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        await conn.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
