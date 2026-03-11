# BYOD step-by-step: stefanosthedev.com

You already have **stefanosthedev.com** on Vercel (bought there, nameservers + SSL set up). Follow these steps to run the funnel on your domain.

---

## Decide the hostname

Choose one:

- **Option A – Subdomain (recommended):** `go.stefanosthedev.com`  
  Keeps the root for something else; matches the “go.client.com” style from the plan.
- **Option B – Root:** `stefanosthedev.com`  
  Funnel is the main (or only) thing on the domain.

Use that hostname everywhere below (replace `go.stefanosthedev.com` with `stefanosthedev.com` if you chose root).

---

## Step 1: Add the domain to your **frontend project** (Vercel)

Domain in the account is not enough; it must be assigned to the project that serves the React app.

**Via code:** Set `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` (and `VERCEL_TEAM_ID` if under a team) in backend `.env`. Then: `POST /api/domains/connect` with body `{"hostname":"go.stefanosthedev.com","firm_id":"default"}` — this adds the domain to Vercel and creates a pending row. Use `GET /api/domains/dns-instructions?hostname=go.stefanosthedev.com` for DNS, then `POST /api/domains/verify?hostname=go.stefanosthedev.com` to verify. See [BYOD.md](BYOD.md) for full API.

**Manually:**  
1. In Vercel, open the **project** that deploys your frontend (the one with the funnel).
2. Go to **Settings → Domains** (project settings, not account “Domains”).
3. Click **Add** and enter: `go.stefanosthedev.com` (or `stefanosthedev.com`).
4. Save. If Vercel shows a CNAME or A record to add, add it in **Account → Domains → DNS** (you already have wildcard ALIAS; a new subdomain might work without extra records, or Vercel will tell you exactly what to add).
5. Wait until the domain shows as **Verified** for that project.

---

## Step 2: Run the migration (once per environment)

From your machine (or wherever you run DB commands):

```bash
cd backend
psql $DATABASE_URL -f app/sql/migrations/add_custom_domains.sql
```

If you use Supabase, run the same SQL in the Supabase SQL editor (paste the contents of `backend/app/sql/migrations/add_custom_domains.sql`).

---

## Step 3: Seed your domain in the app

If you used **Option A (API)** in Step 1, the connect endpoint already created the row in `custom_domains` (pending); after verify it becomes verified. You can skip the seed script.

If you used **Option B (manual Vercel)**, tell the app that this hostname maps to your firm:

```bash
cd backend
python3 scripts/seed_custom_domain.py go.stefanosthedev.com default
```

- First argument: the hostname you added in Step 1 (`go.stefanosthedev.com` or `stefanosthedev.com`).
- Second: your firm id (e.g. `default`; use an existing `firm.id` from your DB).
- Optional third: `default_campaign_id` if you want a default campaign for this domain.

---

## Step 4: Allow the domain in the backend (CORS)

Your API must allow requests from the new origin.

- **Local backend:** In `backend/.env`, set:
  ```env
  CORS_ORIGINS=http://localhost:5173,https://go.stefanosthedev.com
  ```
- **Deployed backend (e.g. Railway):** In the backend’s env vars, add the same origin to `CORS_ORIGINS`, e.g.:
  ```env
  CORS_ORIGINS=https://your-vercel-app.vercel.app,https://go.stefanosthedev.com
  ```
  Then redeploy the backend.

---

## Step 5: Point frontend to the backend in production

The funnel calls `/api/...`. In production the frontend is on Vercel; those requests must hit your real API.

- If you use **Vercel rewrites** to proxy `/api` to your backend, set that in `frontend/vercel.json` (or in the Vercel project) so that when someone visits `https://go.stefanosthedev.com/api/...` it goes to your API URL.
- If the frontend calls the API by **absolute URL**, set `VITE_API_URL` in the **frontend** project (Vercel) to your backend base URL (e.g. `https://your-api.railway.app`). Rebuild/redeploy after changing env.

---

## Step 6: Test

1. Open: `https://go.stefanosthedev.com/funnel/register` (or `https://stefanosthedev.com/funnel/register` if you use root).
2. You should see the registration page (no “Unknown host”).
3. Submit the form. Thank-you and webinar link should stay on the same domain.

If you see **“Unknown host”**: the app couldn’t resolve the domain. Check that Step 1 (domain on the **project**) and Step 3 (seed with the **exact** hostname) are correct.

---

## Checklist

| Step | What | Done? |
|------|------|--------|
| 1 | Add `go.stefanosthedev.com` (or root) to **project** Domains in Vercel; verify | ☐ |
| 2 | Run `add_custom_domains.sql` migration | ☐ |
| 3 | Run `seed_custom_domain.py go.stefanosthedev.com default` | ☐ |
| 4 | Add `https://go.stefanosthedev.com` to backend `CORS_ORIGINS` and redeploy API | ☐ |
| 5 | Ensure production frontend can reach API (proxy or `VITE_API_URL`) | ☐ |
| 6 | Visit `https://go.stefanosthedev.com/funnel/register` and test | ☐ |

---

## If something fails

- **“Unknown host” on the page**  
  Tenant resolve failed. Hostname in browser must match exactly what you seeded (e.g. `go.stefanosthedev.com`). Check project Domains and `custom_domains` row.

- **CORS errors in the browser**  
  Backend `CORS_ORIGINS` must include `https://go.stefanosthedev.com` (no trailing slash). Redeploy backend after changing.

- **API not found (404 / network error)**  
  Production frontend must proxy `/api` to your backend or use `VITE_API_URL`; see Step 5.

- **Domain not verified in project**  
  In the **project** (not account) go to Settings → Domains and add the hostname again; follow any DNS instructions Vercel shows there.
