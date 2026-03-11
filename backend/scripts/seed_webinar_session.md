# Seed webinar session

Creates one webinar session for an existing campaign so you can simulate the Mux webinar room.

## Run

From the **backend** directory:

```bash
python3 scripts/seed_webinar_session.py
```

## Options

- **`--campaign-id ID`** — Use this campaign (default: env `WEBINAR_DEFAULT_CAMPAIGN_ID` or first campaign in DB).
- **`--future`** — Set `scheduled_at` to 10 minutes from now (to test the countdown). Default is 1 hour in the past so the room shows the video block immediately.

## Env

- **`DATABASE_URL`** — Loaded from `backend/.env` (required).
- **`WEBINAR_DEFAULT_CAMPAIGN_ID`** — Optional; campaign id to use when `--campaign-id` is not passed.
- **`WEBINAR_JOIN_URL_BASE`** — Optional; base URL for the join link (default `http://localhost:5173`).

## Prerequisites

At least one **campaign** must exist. If you see:

```
ERROR: No campaign found. Create a campaign first (campaign has required icp_id, offer_id).
```

run the campaign seed script first (from the **backend** directory):

```bash
python3 scripts/seed_campaign_for_webinar.py
```

That creates a `default` campaign and the required icp/offer/archetype rows. Then run `seed_webinar_session.py` again.

## Output

Prints the created session `id` and the join URL, e.g.:

```
Created webinar session: abc123...
  campaign_id:   default
  scheduled_at:  2025-03-08 12:00:00+00:00
  Join URL:      http://localhost:5173/webinar/watch/abc123...
```

Open the join URL (or add `?simulate=1` to skip countdown when session is in the future).
