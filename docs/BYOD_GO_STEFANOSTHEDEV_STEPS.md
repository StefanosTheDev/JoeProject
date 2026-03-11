# Connect go.stefanosthedev.com — Your Steps

**Done in code:** Migration applied, domain added to your Vercel project via API, DB row created and **verified**. CORS updated to allow `https://go.stefanosthedev.com`. Optional DNS step below if you need to add the subdomain manually.

---

## Step 1: Add DNS for the subdomain `go`

**Done via API:** The CNAME was created for you: `go.stefanosthedev.com` → `cname.vercel-dns.com` (Vercel record uid: `rec_ccf829f3ed22f829d19610c6`). To re-run or do it again: `cd backend && python3 scripts/add_go_cname.py` (uses `VERCEL_API_TOKEN` from `.env`). Or call **POST /api/domains/dns-record?domain=stefanosthedev.com&name=go&type=CNAME&value=cname.vercel-dns.com** once your backend is deployed with the domains router.

**Manual option:** In Vercel → Domains → stefanosthedev.com → DNS Records → Add: Name `go`, Type `CNAME`, Value `cname.vercel-dns.com`. If DNS is outside Vercel, add the same CNAME at your provider.

---

## Step 2: Verify the domain

**Already done:** The domain was verified successfully. If you add more domains later, after DNS has propagated (often 1–5 minutes):

```bash
curl -X POST "http://localhost:8000/api/domains/verify?hostname=go.stefanosthedev.com"
```

Or with your **deployed** backend URL:

```bash
curl -X POST "https://YOUR-API-URL/api/domains/verify?hostname=go.stefanosthedev.com"
```

When it succeeds you’ll see `"verified": true` and the app will treat **go.stefanosthedev.com** as your funnel domain.

---

## Step 3: CORS (so the funnel can call your API)

In your **backend** env (local `.env` or production), add the new origin to `CORS_ORIGINS`, for example:

```env
CORS_ORIGINS=http://localhost:5173,https://go.stefanosthedev.com
```

If you already have other origins, append: `,https://go.stefanosthedev.com`. Redeploy the API if it’s hosted.

---

## Step 4: Test the funnel

Open:

**https://go.stefanosthedev.com/funnel/register**

(After DNS and Vercel are happy, this will serve your React app. If the frontend is not yet deployed with this domain, add **go.stefanosthedev.com** in your **frontend** Vercel project: **Settings → Domains**; the connect API should have already added it.)

You should see the registration page without “Unknown host”. Submit the form; thank-you and webinar links should stay on **go.stefanosthedev.com**.

---

## Summary

| Step | What |
|------|------|
| 1 | Add CNAME **go** → **cname.vercel-dns.com** (in Vercel Domains or your DNS provider). |
| 2 | Run **POST /api/domains/verify?hostname=go.stefanosthedev.com** once DNS is ready. |
| 3 | Add **https://go.stefanosthedev.com** to backend **CORS_ORIGINS**. |
| 4 | Visit **https://go.stefanosthedev.com/funnel/register** and test. |

**Firm used:** `e2e_test_firm_1` (your existing firm). To use a different firm, add another domain or change the row in `custom_domains`.
