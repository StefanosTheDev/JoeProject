# Env vars — deployment checklist

Use this when deploying (Vercel, Railway, Render, etc.) or opening a PR so prod/staging has the right env. **Nothing here is secret** — it’s a checklist of variable names.

---

## Will this push crash prod?

**No.** Prod only changes when you:

1. Merge the PR into the branch that prod deploys from (e.g. `main`), and
2. That triggers a deploy.

Until you merge and deploy, prod keeps running the previous build. Opening a PR or pushing to `feat/AIVideoGen` does **not** change prod.

After you merge and deploy, prod will use the new code. If required env vars are missing, those features will 503 or return “not configured” — the app won’t crash; it will just disable those routes or return errors until you add the vars.

---

## Required (app runs without these but some routes 503)

| Env var        | Where to get it                       | Used by |
| -------------- | ------------------------------------- | ------- |
| `DATABASE_URL` | Supabase / Postgres connection string | All DB  |
| `CORS_ORIGINS` | Your frontend URL(s), comma-separated | CORS    |

---

## GHL (GoHighLevel) — `/api/connect/*`

| Env var                      | Required           | Notes                                                                                            |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `GHL_CLIENT_ID`              | Yes for OAuth      | Marketplace → Manage → Secrets                                                                   |
| `GHL_CLIENT_SECRET`          | Yes for OAuth      | Same                                                                                             |
| `GHL_REDIRECT_URI`           | Yes                | Must be in Marketplace Auth redirect list. Prod: `https://<your-api>/api/connect/oauth/callback` |
| `GHL_VERSION_ID`             | Only for draft app | From Install Link URL (`version_id=...`)                                                         |
| `GHL_WEBHOOK_SIGNING_SECRET` | Optional           | If set, webhooks verify signature                                                                |

**Prod:** Add your production callback URL in Marketplace → Build → Auth → Redirect URLs (e.g. `https://api.yourapp.com/api/connect/oauth/callback`).

---

## Meta Ads — `/api/meta-ads/*`

| Env var             | Required      | Notes                                                 |
| ------------------- | ------------- | ----------------------------------------------------- |
| `META_APP_ID`       | Yes for OAuth | Meta for Developers → App                             |
| `META_APP_SECRET`   | Yes           | Same                                                  |
| `META_REDIRECT_URI` | Yes           | Must match Meta app redirect URI (often frontend URL) |
| `META_CRON_SECRET`  | Optional      | For cron-protected sync endpoints                     |

---

## Other APIs (optional)

| Env var                                                  | Used by                            |
| -------------------------------------------------------- | ---------------------------------- |
| `ANTHROPIC_API_KEY`                                      | Chat / Claude                      |
| `VOYAGE_API_KEY`                                         | Embeddings                         |
| `HEYGEN_API_KEY`                                         | HeyGen video/avatars               |
| `ELEVENLABS_API_KEY`                                     | ElevenLabs voice                   |
| `CRON_SECRET`                                            | `/api/ingest/sync` (X-Cron-Secret) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_DRIVE_FOLDER_ID` | Ingest                             |
| `BLOB_READ_WRITE_TOKEN`                                  | Vercel Blob                        |

---

## Checklist for “the other end” (prod/staging)

Before or right after merging the PR and deploying:

- [ ] `DATABASE_URL` set (prod Postgres/Supabase)
- [ ] `CORS_ORIGINS` set to prod frontend URL(s)
- [ ] GHL: `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_REDIRECT_URI` set
- [ ] GHL: Production redirect URL added in Marketplace Auth
- [ ] Meta: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` set (if using Meta Ads)
- [ ] Any optional keys you need (Anthropic, HeyGen, ElevenLabs, etc.)

Reference: `backend/.env.example` has the full list and comments.
