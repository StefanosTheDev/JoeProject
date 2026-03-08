# Plan: Process flow and Mux webinar simulation

## 1. Process flow (current build)

- **Zoom:** We do **not** use the Zoom API. The advisor must connect Zoom in Calendly (Integrations → Zoom). Calendly creates the meeting and sends the link. Code that created Zoom via API is commented out; OAuth success message tells the advisor to connect Zoom in Calendly.
- **Flow:** Ad → Registration → Thank-you (VSL) → Book (Calendly) → Calendly confirmation (with Zoom link if advisor connected Zoom). Optional: at registration we can assign a webinar session and send a join link to the Mux room.

---

## 2. Simulating the live webinar (Mux) end-to-end

Goal: see the full webinar experience — countdown, then Mux video, and (optionally) chat.

### Prerequisites

- **Campaign:** A row in `campaign` with an id the funnel uses (e.g. `default`). If missing, create it (e.g. `INSERT INTO campaign (id, name) VALUES ('default', 'Default');` or use your existing campaign table).
- **Webinar session:** At least one row in `webinar_sessions` with that `campaign_id`, `scheduled_at` in the future (for countdown), and optionally `mux_playback_id` (for video). Create via API: `POST /api/webinars/sessions` with body `{ "campaign_id": "default", "scheduled_at": "<ISO datetime>", "mux_playback_id": null, "chat_enabled": true }`.

### Step-by-step simulation

1. **Create a webinar session (if needed)**  
   - Call `POST /api/webinars/sessions` with `campaign_id` (e.g. `default`), `scheduled_at` (e.g. 1 hour from now), `chat_enabled: true`.  
   - Save the returned `id` (sessionId).

2. **Optional: add Mux video**  
   - **Option A:** When creating the session, set `mux_playback_id` if you already have one from Mux.  
   - **Option B:** Use the upload flow: `POST /api/webinars/uploads` → get `url` and `asset_id` → upload a short video to the URL → after Mux processes, call `PATCH /api/webinars/sessions/{sessionId}` with `{ "asset_id": "<asset_id>" }` so the session gets the playback ID.  
   - Without a playback ID, the room loads but shows “No video configured”.

3. **Register through the funnel**  
   - Open `http://localhost:5173/funnel/register?firm_id=e2e_test_firm_1&campaign_id=default`.  
   - Submit the form. Backend assigns the next upcoming session for that campaign and returns `webinar_join_url` (and sends it via SendBlue/Resend if configured).

4. **Open the webinar room**  
   - Use the join URL from the registration success (e.g. `http://localhost:5173/webinar/watch/{sessionId}`) or go directly to `/webinar/watch/{sessionId}`.  
   - You should see: “Starting in” countdown until `scheduled_at`, then the Mux video (if `mux_playback_id` is set) or the “No video configured” message.

5. **Quick test without waiting for countdown**  
   - Create a session with `scheduled_at` in the **past** (e.g. 1 hour ago). Open `/webinar/watch/{sessionId}`. Countdown is 0, so the video area shows immediately (video if playback_id set, else “No video configured”).

### What you’ll see

- **Before scheduled time:** Countdown (e.g. “0:45:00”) then it switches to the video block.  
- **After scheduled time (or if scheduled in past):** Video player with HLS stream, or “No video configured” if no `mux_playback_id`.  
- **Chat:** Sidebar is visible when `chat_enabled` is true; placeholder text is shown until chat is wired to Supabase Realtime or REST.

---

## 3. Optional improvements (for easier simulation)

- **Seed script:** Add a script (e.g. `backend/scripts/seed_webinar_session.py` or SQL) that ensures a `default` campaign exists and creates one webinar session with `scheduled_at` 10 minutes in the future (or in the past for instant playback), so you can run one command and then register + open the join link.
- **“Simulate now” session:** In the webinar room page, optionally support a query param like `?simulate=1` that treats the session as “live now” (skip countdown, show video immediately) for demos, without changing the DB.
- **Docs:** Link to this flow from the main README or [docs/PROCESS_FLOW_AND_SETUP.md](PROCESS_FLOW_AND_SETUP.md) so the team can follow it.

---

## 4. Files touched (Zoom removal, already done)

- `backend/app/routers/calendly/router.py` — Zoom create/send/delete commented out; opportunity insert uses NULL for zoom fields; OAuth response includes `advisor_note` about connecting Zoom in Calendly.
- `docs/PROCESS_FLOW_AND_SETUP.md` — Process flow and “we do not use Zoom API” + Mux simulation summary.
- This plan: `docs/PLAN_PROCESS_FLOW_AND_MUX_WEBINAR.md`.

No changes to the webinar room page itself are required to run the simulation; it already supports countdown and Mux playback when the session has a valid `mux_playback_id` and `scheduled_at`.
