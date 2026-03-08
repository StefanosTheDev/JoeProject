# GHL Integration — Build & Test Plan

Plan mode: build everything the **GHL_Integration_Developer_Guide.docx.md** describes, section by section, with a clear way to **test** each part.

**Source doc:** `GHL_Integration_Developer_Guide.docx.md` (project root).  
**Status:** Auth (Phase 1 connection) is done. This plan covers the rest.

## Expected API behavior (422 / 404 / 401)

So everyone knows what “success” looks like and what we accept as known limitations:

| Endpoint | Expected when things work | Known limitations / fallback |
|----------|---------------------------|------------------------------|
| **Calendar events** | 200 with a list of events. | **422** if you don’t pass `calendar_id` + `start_time` + `end_time` (GHL requires “one of userId/calendarId/groupId” and both times as strings). Use GET with `calendar_id`, `start_time`, `end_time` for a real test. |
| **Opportunities search** | 200 with opportunities (or empty list). Flow: create opportunity (POST) → then GET search. | We send `locationId` and `location_id`; if GHL still returns **422**, check their docs for exact param names. |
| **Snapshots** | 200 with list of snapshots (custom snapshots = templates you can deploy to a location). | We call **GET /snapshots/** with `locationId` (not `/locations/…/snapshots`). **404** if endpoint or plan differs. |
| **Funnels** | 200 with list of funnels. | **401** “This route is not yet supported by the IAM Service” — GHL platform limitation; no code fix. |

So: create opportunity → search opportunities is the intended test flow. Calendar needs a real `calendar_id` and time range. Snapshots/funnels: we fixed the snapshots URL; funnels stay “accept 401” until GHL supports the route.

---

## How to run tests (today)

- **Connection / auth (already built):**
  ```bash
  cd backend && .venv/bin/pytest tests/test_ghl_connect.py -v
  ```
- **Live API (requires GHL connected for firm-1):**
  - Connection: `curl "http://localhost:8000/api/connect/connection?firm_id=firm-1"`
  - Test GHL call: `curl "http://localhost:8000/api/connect/test?firm_id=firm-1"`
- **Smoke script (all connect endpoints):** `./scripts/ghl_curl_smoke.sh` — 2xx or documented 422/404/401 count as pass.

---

## Doc section → Build tasks → How to test

| Doc § | What to build | How to test |
|-------|----------------|-------------|
| **§2 Auth** | Already done: OAuth URL, callback, token exchange, refresh, `ghl_connections`, disconnect, GET /connect/test (location) | `pytest backend/tests/test_ghl_connect.py`; manual: GET /api/connect/connection, GET /api/connect/test |
| **§3 Custom Values** | Service + routes: GET/POST/PUT/DELETE custom values. Optional: `ghl_custom_values` table for mapping OS assets → GHL IDs. | Pytest (mocked GHL or with live token); script or curl against real GHL |
| **§4 Contacts** | Service + routes: create contact, update contact, search contacts, bulk tags. Use `locationId` from connection. | Pytest + script/curl against real GHL (create → search → update) |
| **§5 Calendars** | Service: GET calendar events. Route to list events for connected location. | Pytest (mock) or script with real token; optional webhook later |
| **§6 Opportunities** | Service + routes: create opportunity, update opportunity, search opportunities. | Pytest + script/curl against real GHL |
| **§7 Snapshots** | Service: GET snapshots (list). Optional: deploy snapshot to location (doc flow). | Pytest (mock) or script; deploy is higher risk, test in sandbox |
| **§8 Funnels** | Service: GET funnels, GET funnel pages. Read-only. | Pytest + GET /api/ghl/funnels?firm_id=… (or under /connect) |
| **§9 Webhooks** | Single POST endpoint (e.g. /api/connect/webhooks). Parse event type, dispatch to handlers. Log to `ghl_webhook_log`. Signature verification. | Send sample payloads (e.g. ContactCreate) via curl/script; check DB and logs |
| **§10 MCP** | Optional. MCP client or proxy using Bearer + x-location-id. | Manual / separate agent testing |
| **§11 Data model** | Add tables: `ghl_custom_values`, `ghl_contacts_sync`, `ghl_appointments`, `ghl_opportunities`, `ghl_webhook_log`, `ghl_sync_queue`. Migrations or DDL in schema.sql. | Migrations run; tests that insert/select from these tables |
| **§12 Rate limits** | Optional: outbound calls via `ghl_sync_queue` + worker; read x-ratelimit-* headers and back off. | Load test or script that fires many requests |
| **§13 Phases** | Execute in order: Phase 1 → 2 → 3 → 4 (see below). | Per-phase checklist and tests |

---

## Implementation phases (execution order)

### Phase 1 — Connection + Custom Values (doc §2 + §3 + §11 partial)

**Goal:** OAuth done; add Custom Value CRUD and optional mapping table. “Push approved copy to GHL” works.

| # | Task | Test |
|---|------|------|
| 1.1 | **Custom Values API client** in `app/services/ghl/` (e.g. `ghl_api.py`): `get_custom_values(location_id, token)`, `create_custom_value(...)`, `update_custom_value(...)`, `delete_custom_value(...)`. Use `get_valid_access_token(pool, firm_id)` for token. | Unit test with mocked httpx responses; or script that calls service with real token |
| 1.2 | **Routes** under `/api/connect/` or `/api/ghl/`: GET/POST/PUT/DELETE custom values (by firm_id, optionally key or id). | `pytest` for 200/404/422; manual curl or script against real GHL |
| 1.3 | **Table `ghl_custom_values`** (firm_id, ghl_custom_value_id, key, asset_id nullable, current_value_hash, last_synced_at). Add to schema.sql + ensure in migrations. | Test that inserts/selects; optional integration test that creates CV in GHL then records in table |
| 1.4 | **Batch update helper** (optional): accept list of {key, value} or {id, value}, call GHL update in loop with rate-limit awareness. | Script: batch of 2–3 updates, assert all succeed |

**Phase 1 test checklist**

- [ ] `GET /api/connect/custom-values?firm_id=firm-1` returns list from GHL (or empty).
- [ ] `POST /api/connect/custom-values` with firm_id, name, value creates in GHL and returns id.
- [ ] `PUT /api/connect/custom-values/{id}` with value updates in GHL.
- [ ] `DELETE /api/connect/custom-values/{id}` removes or soft-deletes as per doc.
- [ ] Pytest: at least one test per route (e.g. with mocked GHL or real DB + env token).

---

### Phase 2 — Contact sync + attribution (doc §4 + §11 + §9 partial)

**Goal:** Create/update/search contacts; map to OS via `ghl_contacts_sync`; receive contact webhooks.

| # | Task | Test |
|---|------|------|
| 2.1 | **Contacts API client**: create_contact, update_contact, search_contacts, bulk_tags. | Pytest with mocks; script against real GHL (create → search → update) |
| 2.2 | **Routes**: POST create contact, PUT update, POST search (body with query). | curl/script; pytest |
| 2.3 | **Table `ghl_contacts_sync`**: firm_id, ghl_contact_id, os_lead_id nullable, campaign_id nullable, utm_data JSONB, last_synced_at. | Migration + test insert/select |
| 2.4 | **Webhook endpoint** POST /api/connect/webhooks: parse body, read event type, log to `ghl_webhook_log`, dispatch ContactCreate/ContactUpdate to handler (e.g. fetch contact by id, upsert into ghl_contacts_sync). | curl with sample ContactCreate payload; verify log row and handler runs |

**Phase 2 test checklist**

- [ ] Create contact with locationId, name, email, tags; then search by email.
- [ ] Update contact (tags or custom fields).
- [ ] Webhook: send ContactCreate payload → 200, one row in ghl_webhook_log, handler runs (no crash).

---

### Phase 3 — Calendars, Opportunities, Snapshots, Funnels (doc §5, §6, §7, §8)

**Goal:** Read-only and key write flows for calendars, opportunities, snapshots, funnels.

| # | Task | Test |
|---|------|------|
| 3.1 | **Calendars**: GET calendar events (service + route). Filter by date range if GHL API allows. | Pytest mock; script with real token |
| 3.2 | **Opportunities**: create, update, search (service + routes). | Same pattern as contacts |
| 3.3 | **Snapshots**: GET list (service + route). Optional: deploy snapshot to location (doc flow). | List test; deploy only in sandbox |
| 3.4 | **Funnels**: GET funnels, GET funnel pages (service + routes). | GET /api/.../funnels, GET /api/.../funnels/{id}/pages |
| 3.5 | **Tables** `ghl_appointments`, `ghl_opportunities`: add DDL; populate from webhooks or API. | Migration; webhook/API test writes a row |

**Phase 3 test checklist**

- [ ] GET calendar events returns 200 and list.
- [ ] Create/search/update opportunity works.
- [ ] GET snapshots returns list (agency/location as per doc).
- [ ] GET funnels and GET funnel pages return 200.

---

### Phase 4 — Webhooks full, queue, MCP (doc §9, §11, §12, §10)

**Goal:** All webhook events handled; optional outbound queue and MCP.

| # | Task | Test |
|---|------|------|
| 4.1 | **Webhook handlers** for AppointmentCreate, AppointmentUpdate, OpportunityCreate, OpportunityStageUpdate, etc. Log to `ghl_webhook_log`; update `ghl_appointments` / `ghl_opportunities`. | For each event type: send sample payload → check log + side effects |
| 4.2 | **Webhook signature verification** (if GHL provides a secret). | Unit test: valid vs invalid signature |
| 4.3 | **Table `ghl_sync_queue`**: outbound actions (action_type, payload, status, created_at, completed_at). Optional worker that processes queue with rate limiting. | Enqueue a few actions; run worker; assert completed |
| 4.4 | **MCP** (optional): document or small proxy that calls GHL MCP with Bearer + x-location-id. | Manual / separate repo |

**Phase 4 test checklist**

- [ ] Each webhook event type: payload → 200, logged, handler runs.
- [ ] Signature verification rejects tampered body.
- [ ] Optional: queue worker processes items and respects rate limit.

---

## Test infrastructure

- **pytest**
  - `tests/test_ghl_connect.py` — already exists (OAuth URL, connection status).
  - Add: `tests/test_ghl_custom_values.py`, `tests/test_ghl_contacts.py`, `tests/test_ghl_webhooks.py`, etc.
  - Use `TestClient` and either mock `httpx`/GHL responses or use a **test firm_id** with a real token in env (e.g. `GHL_TEST_FIRM_ID`, `GHL_TEST_LOCATION_ID` optional).
- **Scripts**
  - `scripts/test_ghl_connect.py` — extend or add `scripts/test_ghl_custom_values.py`, `scripts/test_ghl_contacts.py` that call the real API with env token (require connected firm).
- **Manual**
  - curl examples in this doc or in `backend/docs/GHL_CURL_EXAMPLES.md` for each endpoint.
  - Webhook: use ngrok or similar to expose POST /api/connect/webhooks and send payloads from GHL or curl.

---

## Execution order (summary)

1. **Phase 1** — Custom Values CRUD + `ghl_custom_values` + tests (pytest + script/curl).
2. **Phase 2** — Contacts CRUD + `ghl_contacts_sync` + webhook endpoint + ContactCreate/Update handlers + tests.
3. **Phase 3** — Calendars, Opportunities, Snapshots, Funnels (read + key writes) + tables + tests.
4. **Phase 4** — Remaining webhooks, signature verification, optional queue, optional MCP.

Each phase: implement → add/run tests → tick checklist → then move to next phase.
