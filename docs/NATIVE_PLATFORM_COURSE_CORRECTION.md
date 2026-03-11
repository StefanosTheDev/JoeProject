# Native Platform Stack — Course correction & intent

**Source:** *Native_Platform_Stack_Developer_Guide_v2.docx.md*

---

## Two distinct “live” flows in the plan

### 1. **1:1 consultation (Retirement Readiness Review) — Zoom**

**Intent:** Prospect books a time → gets a **Zoom meeting link** → joins for a **live video call** with the advisor.

- **Register** (funnel) → we capture contact.
- **Thank you** → CTA: “Book your call.”
- **Book** → Calendly embed (or Scheduling API). They pick a time in Calendly.
- **Live video:** Plan says: *“When a prospect books through Calendly, we need a Zoom meeting link. **Calendly can auto-create Zoom meetings if the advisor’s Zoom account is connected.**”*
  - **Option A:** Advisor connects Zoom inside Calendly → Calendly creates the meeting and adds the link to the invite. No extra work for us.
  - **Option B:** We create the Zoom meeting ourselves: on Calendly webhook `invitee.created`, we call our Zoom API (`create_meeting` with start_time/duration from the payload), store `join_url`, and send it via SendBlue/Resend (confirmation + reminders).

So for 1:1: **the “event” is the Calendly booking; the “live video” is the Zoom meeting** (created by Calendly or by us).

---

### 2. **Webinar (simulive) — Mux + our room, not Zoom**

**Intent:** Prospect registers → is assigned to a **webinar session** (e.g. Tuesday 7 PM) → at that time they **join our webinar room** at `/watch/{sessionId}`. That room is **not** Zoom: it’s our custom page with **Mux** (pre-recorded video) + **Supabase Realtime** (chat, attendee count, timed CTAs). It feels “live” but is simulive. After the webinar, redirect to **book** (Calendly) for the 1:1.

- **Register** → we assign them to a session (e.g. next Tuesday 7 PM).
- **Webinar room** `/watch/{sessionId}` = our event they “join”: countdown, then Mux video + chat.
- **Book** (after webinar) = Calendly for the 1:1 call.

So for webinar: **the “event” is our webinar session; “joining” is opening the webinar room** (Mux + chat), not Zoom.

---

## What we’ve built so far (aligned with plan)

| Piece | Status |
|-------|--------|
| Funnel: register, thank-you, book | Done. Form → contact; thank-you → link to book; book → Calendly embed. |
| Calendly OAuth + event types | Done. Firm connects Calendly; we show active event type embed. |
| Calendly webhook | Done. `invitee.created` / `invitee.canceled` → contact + opportunity (booked/canceled). |
| Zoom API client | Done. `create_meeting()` exists; not yet wired to bookings. |
| Conversations inbox | Done. SendBlue/Resend, contacts, messages. |
| Webinar room (Phase 4) | Done in code. Mux playback, chat, CTAs, countdown at `/webinar/watch/:sessionId`. |
| Create Zoom on book | **Not done.** We don’t create a Zoom meeting when someone books in Calendly (we only update pipeline). |

---

## “Create our own event → join live video” — clarification

- **If you mean 1:1 calls:**  
  - “Our own event” = the **booked slot** (in Calendly).  
  - “Join live video” = **Zoom**.  
  - To get there we either:  
    - **A)** Have the advisor connect Zoom in Calendly (Calendly creates the meeting and adds the link), or  
    - **B)** On `invitee.created`, we call our Zoom API, create the meeting, store and send the `join_url` (and optionally use it in confirmations/reminders).

- **If you mean webinar:**  
  - “Our own event” = a **webinar session** in our DB (e.g. `webinar_sessions`).  
  - “Join” = open **/webinar/watch/{sessionId}** (our Mux + chat room).  
  - No Zoom involved for the webinar itself; Zoom is only for the 1:1 after they book from the funnel or post-webinar CTA.

---

## Recommended next steps to get on the same page

1. **Decide which “live video” you care about first**  
   - **1:1 (Zoom):** Implement “on book → create Zoom meeting and send join link” (Option B above), or document that advisors should connect Zoom in Calendly (Option A).  
   - **Webinar:** Ensure webinar sessions can be created (e.g. in admin or seed data), and that “register → assign session → join /watch/{sessionId}” works end-to-end.

2. **If 1:1 Zoom first:**  
   - In Calendly webhook handler, on `invitee.created`: read event `start_time` and duration from payload, call `create_meeting()`, store `join_url` (e.g. on opportunity or a new `meetings` table), and send confirmation/reminder with the Zoom link (SendBlue/Resend).

3. **If webinar first:**  
   - Confirm webinar session creation flow (who creates sessions, when).  
   - Confirm registration assigns `session_id` and that the “join” link we send is `https://your-app.com/webinar/watch/{sessionId}` (or equivalent).

This doc can live in the repo and be updated as we implement (e.g. “Zoom on book: done” or “Webinar session creation: done”).
