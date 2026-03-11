# Seed campaign for webinar

Creates the minimal campaign chain (offer_archetype, icp_profile, offer, campaign) so webinar simulation works. Campaign id is `default` for use with `campaign_id=default` in the funnel and with `seed_webinar_session.py`.

## Run

From the **backend** directory:

```bash
python3 scripts/seed_campaign_for_webinar.py
```

Idempotent: safe to run multiple times (uses fixed ids and `ON CONFLICT DO NOTHING`).

## Env

- **`DATABASE_URL`** — Loaded from `backend/.env` (required).
- **`MESSAGING_DEFAULT_FIRM_ID`** — Optional; firm to attach the campaign to. If unset, uses the first firm in the DB.

## When to use

Run this before `seed_webinar_session.py` if you get:

```
ERROR: No campaign found. Create a campaign first (campaign has required icp_id, offer_id).
```

Then run:

```bash
python3 scripts/seed_webinar_session.py
```
