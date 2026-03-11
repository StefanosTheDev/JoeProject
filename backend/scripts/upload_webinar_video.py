#!/usr/bin/env python3
"""
Upload a video file to Mux and set the webinar session's mux_playback_id so the room shows it.
Run from backend dir: python3 scripts/upload_webinar_video.py --session-id SESSION_ID --video path/to/video.mov
Requires MUX_ACCESS_TOKEN_ID and MUX_SECRET_KEY in .env. Polls Mux until the asset is ready.
"""
import argparse
import asyncio
import os
import sys
import time
from pathlib import Path

# backend/scripts -> backend
backend_dir = Path(__file__).resolve().parent.parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load .env without overriding variables already exported in the shell.
# This lets us run against prod DB with: DATABASE_URL=$DATABASE_URL_PROD ...
env_path = backend_dir / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)


async def main():
    import asyncpg
    from app.services.mux import create_direct_upload, get_asset, get_upload

    parser = argparse.ArgumentParser(description="Upload video to Mux and attach to webinar session.")
    parser.add_argument("--session-id", default=None, help="Webinar session id (default: latest session with no video)")
    parser.add_argument("--video", default=None, help="Path to video file (default: backend/Example Video Clip.mov)")
    args = parser.parse_args()

    video_path = Path(args.video) if args.video else backend_dir / "Example Video Clip.mov"
    if not video_path.is_file():
        print(f"ERROR: Video file not found: {video_path}")
        sys.exit(1)

    if not os.environ.get("MUX_ACCESS_TOKEN_ID") or not os.environ.get("MUX_SECRET_KEY"):
        print("ERROR: Set MUX_ACCESS_TOKEN_ID and MUX_SECRET_KEY in backend/.env")
        sys.exit(1)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    # Resolve session_id: explicit or latest without mux_playback_id
    conn = await asyncpg.connect(database_url)
    try:
        if args.session_id:
            row = await conn.fetchrow("SELECT id FROM webinar_sessions WHERE id = $1", args.session_id.strip())
            if not row:
                print(f"ERROR: Session not found: {args.session_id}")
                sys.exit(1)
            session_id = args.session_id.strip()
        else:
            row = await conn.fetchrow(
                "SELECT id FROM webinar_sessions WHERE mux_playback_id IS NULL ORDER BY created_at DESC LIMIT 1"
            )
            if not row:
                print("ERROR: No webinar session without video found. Create one with seed_webinar_session.py or pass --session-id.")
                sys.exit(1)
            session_id = row["id"]
            print(f"Using session: {session_id}")
    finally:
        await conn.close()

    video_bytes = video_path.read_bytes()
    content_type = "video/quicktime" if video_path.suffix.lower() in (".mov", ".qt") else "application/octet-stream"

    # 1) Create direct upload
    result = await create_direct_upload(cors_origin="*")
    if not result.get("ok"):
        print("ERROR: Mux create_direct_upload:", result.get("error", "unknown"))
        sys.exit(1)
    upload_url = result.get("url")
    upload_id = result.get("upload_id")
    if not upload_url or not upload_id:
        print("ERROR: Mux did not return url or upload_id")
        sys.exit(1)
    print(f"Uploading {video_path.name} ({len(video_bytes) / 1_000_000:.1f} MB) to Mux...")

    # 2) PUT file to Mux
    import httpx
    async with httpx.AsyncClient(timeout=300.0) as client:
        r = await client.put(upload_url, content=video_bytes, headers={"Content-Type": content_type})
    if r.status_code >= 400:
        print(f"ERROR: Mux upload failed: {r.status_code} {r.text[:500]}")
        sys.exit(1)
    print("Upload done. Waiting for Mux to create asset...")

    # 3) Poll upload until asset_id is set
    asset_id = None
    for _ in range(60):
        await asyncio.sleep(3)
        up = await get_upload(upload_id)
        if not up.get("ok"):
            print("WARN: get_upload:", up.get("error"))
            continue
        asset_id = up.get("asset_id")
        if asset_id:
            print(f"Asset created: {asset_id}")
            break
        print(f"  upload status: {up.get('status')}")
    if not asset_id:
        print("ERROR: Mux did not create asset in time.")
        sys.exit(1)

    # 4) Poll until asset is ready and has playback_id
    print("Waiting for asset to be ready...")
    for _ in range(120):
        await asyncio.sleep(5)
        info = await get_asset(asset_id)
        if not info.get("ok"):
            print("WARN: get_asset:", info.get("error"))
            continue
        status = info.get("status")
        playback_id = info.get("playback_id")
        if status == "ready" and playback_id:
            print(f"Asset ready. playback_id: {playback_id}")
            break
        print(f"  status={status}, playback_id={playback_id or 'none'}")
    else:
        print("ERROR: Mux did not become ready in time. You can still PATCH the session later with this asset_id.")
        sys.exit(1)

    # 5) Update webinar session
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)
    conn = await asyncpg.connect(database_url)
    try:
        row = await conn.fetchrow(
            "UPDATE webinar_sessions SET mux_playback_id = $1 WHERE id = $2 RETURNING id",
            playback_id,
            session_id,
        )
        if not row:
            print(f"ERROR: Session not found: {session_id}")
            sys.exit(1)
        print(f"Session {session_id} updated with mux_playback_id. Reload the webinar room to see the video.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
