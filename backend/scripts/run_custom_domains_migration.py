#!/usr/bin/env python3
"""Run add_custom_domains.sql migration. Loads DATABASE_URL from backend/.env.

For PRODUCTION (e.g. Railway): run with prod DATABASE_URL so the table exists there:
  DATABASE_URL='postgresql://...' python3 scripts/run_custom_domains_migration.py
If you see UndefinedTableError "custom_domains" in Railway logs, this migration
was not run on the DB that Railway uses. See docs/BYOD_TROUBLESHOOTING.md.
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
                os.environ["DATABASE_URL"] = v.strip().strip('"').strip("'")
                break


async def main():
    import asyncpg
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    sql_path = backend_dir / "app/sql/migrations/add_custom_domains.sql"
    sql = sql_path.read_text()
    conn = await asyncpg.connect(url)
    try:
        await conn.execute(sql)
        print("Migration add_custom_domains.sql applied.")
    finally:
        await conn.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
