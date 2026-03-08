# Upload webinar video (Mux)

Uploads a video file to Mux and sets the webinar session's `mux_playback_id` so the room shows it.

## Run

From the **backend** directory:

```bash
python3 scripts/upload_webinar_video.py
```

- **`--session-id ID`** — Webinar session to attach video to. If omitted, uses the latest session that has no video.
- **`--video PATH`** — Video file path. Default: `backend/Example Video Clip.mov`.

## Env

- **`DATABASE_URL`** — From `.env` (required).
- **`MUX_ACCESS_TOKEN_ID`**, **`MUX_SECRET_KEY`** — From `.env` (required for Mux).

## Flow

1. Creates a Mux direct upload URL.
2. Uploads the file to Mux.
3. Polls until the asset is created and then ready (playback_id available).
4. Updates `webinar_sessions.mux_playback_id` for the chosen session.

Reload the webinar room in the browser to see the video.
