#!/usr/bin/env python3
"""
Get or create a default firm for MESSAGING_DEFAULT_FIRM_ID.
Run from backend dir: python3 scripts/get_or_create_default_firm.py
Loads DATABASE_URL from .env (only that var to avoid parsing JSON).
"""
import os
import sys
from pathlib import Path

# backend/scripts -> backend
backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load only DATABASE_URL from .env
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
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    conn = await asyncpg.connect(url)
    try:
        rows = await conn.fetch("SELECT id, name FROM firm ORDER BY created_at ASC LIMIT 20")
        if rows:
            print("Existing firms (use one of these ids for MESSAGING_DEFAULT_FIRM_ID):\n")
            for r in rows:
                print(f"  id:   {r['id']}")
                print(f"  name: {r['name']}\n")
            print("Add to backend/.env:")
            print(f"  MESSAGING_DEFAULT_FIRM_ID={rows[0]['id']}")
            return
        # No firms: create one with id 'default'
        await conn.execute(
            "INSERT INTO firm (id, name) VALUES ('default', 'Default Firm') ON CONFLICT (id) DO NOTHING"
        )
        print("Created firm with id 'default' (name: Default Firm).")
        print("\nAdd to backend/.env:")
        print("  MESSAGING_DEFAULT_FIRM_ID=default")
    finally:
        await conn.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
