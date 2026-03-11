# Process flow and advisor setup

## End-to-end prospect flow

1. **Facebook ad** → prospect clicks.
2. **Webinar registration (landing)** → `/funnel/register` — they submit name, email, phone.
3. **Pre-webinar VSL (thank-you)** → `/funnel/thank-you` — VSL + “Book a call now”.
4. **Book a call** → `/funnel/book` — Calendly embed; they pick a time.
5. **Advisor’s calendar** → booking is in the advisor’s Calendly; Calendly sends confirmation (and Zoom link if advisor has Zoom connected).
6. **Webinar (optional path)** → if they were assigned a webinar session at registration, they get a join link to `/webinar/watch/{sessionId}` (Mux simulive room).

---

## Zoom: we do not use the Zoom API

- **Advisor must connect Zoom in Calendly.** In Calendly: **Integrations → Zoom**. Once connected, Calendly creates the Zoom meeting when someone books and includes the link in its confirmation email.
- This app **does not** call the Zoom API. We do not create or cancel Zoom meetings. The `zoom_*` env vars and Zoom client code exist but are not used in the booking flow.
- When an advisor connects Calendly (OAuth), the success message reminds them: “Connect Zoom in Calendly (Integrations → Zoom) so booked calls get a video link.”

---

## Simulating the live webinar (Mux)

- **Webinar room:** `/webinar/watch/{sessionId}` — Mux video, chat, countdown, CTAs.
- To simulate end-to-end:
  1. Ensure a **campaign** exists (e.g. `default`) and a **webinar session** exists for that campaign with a future `scheduled_at` and optionally `mux_playback_id` (so the room has video).
  2. Register on `/funnel/register?firm_id=...&campaign_id=default` — backend assigns the next session and returns `webinar_join_url`.
  3. Open the join URL (or go to `/webinar/watch/{sessionId}`) — see countdown until `scheduled_at`, then Mux playback (if `mux_playback_id` is set).
  4. To get video: use `POST /api/webinars/uploads` to get a Mux upload URL, upload a video, then `PATCH /api/webinars/sessions/{session_id}` with `asset_id` (or set `mux_playback_id` when creating the session).
