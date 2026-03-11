# BYOD troubleshooting: CORS and 500 errors

## "custom_domains does not exist" in Railway logs

**What you see in Railway (or downloaded logs):**

```
asyncpg.exceptions.UndefinedTableError: relation "custom_domains" does not exist
```

Often in the stack for:
- `GET /api/tenant/resolve?host=go.stefanosthedev.com` → 500
- `GET /api/webinars/sessions/...` → 500

The browser may show **CORS** errors ("No 'Access-Control-Allow-Origin' header") because the server returns 500 and the error response doesn’t include CORS headers.

**Root cause:** The **production** database that your backend uses (e.g. Railway’s `DATABASE_URL`) does **not** have the `custom_domains` table. The migration was only run against another DB (e.g. local).

**Fix:** Run the migration against the **production** database:

```bash
cd backend
# Use your production DATABASE_URL (from Railway → your service → Variables)
DATABASE_URL='postgresql://...' python3 scripts/run_custom_domains_migration.py
```

Or with `psql`:

```bash
psql "YOUR_PROD_DATABASE_URL" -f app/sql/migrations/add_custom_domains.sql
```

Then ensure the domain is in the table and verified (seed or `POST /api/domains/connect` + verify). After that, tenant resolve and CORS (from verified custom domains) will work.

---

## Quick reference

| Log / symptom | Cause | Fix |
|---------------|--------|-----|
| `UndefinedTableError: relation "custom_domains" does not exist` | Migration not run on prod DB | Run `add_custom_domains.sql` (or the script above) against prod `DATABASE_URL` |
| CORS blocked from `https://go.example.com` | Either table missing (500 → no CORS header) or domain not verified | Fix table first; then ensure domain is verified in `custom_domains` |
