# Bring your own domain (BYOD)

The funnel (register → thank-you → webinar → book) can run on a client’s custom domain so the experience stays on their brand (e.g. `go.client.com`).

**Step-by-step for stefanosthedev.com:** see [BYOD_STEFANOSTHEDEV.md](BYOD_STEFANOSTHEDEV.md).

## End-to-end test with a test domain

1. **Run the migration** (once per environment):
   ```bash
   cd backend
   psql $DATABASE_URL -f app/sql/migrations/add_custom_domains.sql
   ```

2. **Add the domain in Vercel**  
   In your frontend project: **Settings → Domains → Add** (e.g. `go.yourtestdomain.com`).  
   Vercel will show the required **CNAME** (and optionally A/AAAA). Point your DNS for that hostname to the value Vercel gives you. No change to `frontend/vercel.json` is needed; the existing SPA rewrite serves all paths.

3. **Seed the custom domain** in the database so the app can resolve tenant from that host:
   ```bash
   cd backend
   python3 scripts/seed_custom_domain.py go.yourtestdomain.com default
   ```
   Optional third argument: `default_campaign_id` for that domain.  
   Use an existing `firm.id` (e.g. `default`) as the second argument.

4. **Ensure CORS** allows the test domain: add `https://go.yourtestdomain.com` to `CORS_ORIGINS` in the backend (and redeploy API if applicable).

5. **Test the flow**  
   Open `https://go.yourtestdomain.com/funnel/register` (optionally `?campaign_id=...`).  
   Register → thank-you and webinar link should stay on `go.yourtestdomain.com`.  
   The backend uses the request `Origin` / `X-Forwarded-Host` when building `webinar_join_url` so links in emails stay on the client domain.

## Platform subdomains (optional)

If you use a single platform domain (e.g. `yourplatform.com`) and want `slug.yourplatform.com` to resolve to a firm:

- Set **Backend** env: `PLATFORM_BASE_DOMAIN=yourplatform.com`.
- Subdomain is treated as `firm_id` (e.g. `advisor1.yourplatform.com` → firm with `id = advisor1`). No extra table: the firm must exist with that id.
- Add `yourplatform.com` and `*.yourplatform.com` in Vercel **Domains** for the same frontend project.

## API

- **GET /api/tenant/resolve?host=**`<hostname>`  
  Returns `{ firm_id, default_campaign_id?, source: "custom_domain" | "subdomain" }` or 404 for unknown host.  
  Used by the frontend to determine tenant on funnel/webinar pages.

### Connect domain via code (Vercel API)

Set `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and optionally `VERCEL_TEAM_ID` in the backend. Then:

- **POST /api/domains/connect** — Body: `{ "hostname": "go.client.com", "firm_id": "default", "default_campaign_id": null }`.  
  Creates a pending custom domain, adds it to the Vercel project via API, returns DNS instructions.  
  User sets the CNAME at their registrar, then calls verify.

- **POST /api/domains/verify?hostname=**`<hostname>` — Triggers Vercel verification; on success marks the domain as verified in the DB.

- **GET /api/domains/dns-instructions?hostname=**`<hostname>` — Returns what DNS record to set (from Vercel config).

- **POST /api/domains/dns-record** — Create a DNS record via Vercel API (domain must use Vercel nameservers). Query params: `domain`, `name` (subdomain), `type` (e.g. CNAME), `value`, optional `ttl`. Example: `POST /api/domains/dns-record?domain=stefanosthedev.com&name=go&type=CNAME&value=cname.vercel-dns.com`. Alternatively run `backend/scripts/add_go_cname.py` to add the `go` CNAME for stefanosthedev.com.
