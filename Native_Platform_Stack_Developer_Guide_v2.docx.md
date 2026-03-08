

**AMPLIFIED ADVISORS**

**Native Platform Stack**

Developer Guide v2 — Replacing GoHighLevel with SendBlue, Resend, Calendly, Zoom, Veo 3, Mux & Custom Infrastructure

**Scope:** Complete technical reference for building the Growth OS as a fully self-contained platform. Covers iMessage/SMS (SendBlue), email (Resend), calendar/booking (Calendly), video meetings (Zoom), AI video generation (Veo 3), custom simulive webinar room (Mux \+ Supabase Realtime), self-hosted funnel pages, custom automation engine, native pipeline, and unified conversations inbox.

|  |  |
| :---- | :---- |
| Version | 2.0 |
| Date | March 2026 |
| Status | Developer Reference |
| Changes from v1 | Video gen: HeyGen → Veo 3\. New: Webinar room (Mux \+ Supabase Realtime). Linq noted as future alternative to SendBlue. |
| SendBlue API | https://api.sendblue.co |
| Resend API | https://api.resend.com |
| Calendly API | https://api.calendly.com |
| Zoom API | https://api.zoom.us/v2 |
| Veo 3 (Vertex AI) | https://us-central1-aiplatform.googleapis.com |
| Veo 3 (Gemini) | https://generativelanguage.googleapis.com |
| Mux Video | https://api.mux.com |

*Confidential — For internal use only.*

# **1\. Architecture Overview: Replacing GoHighLevel**

This document covers the complete technical plan for removing GoHighLevel from the Growth OS stack and replacing every GHL function with native integrations. The Growth OS becomes the entire platform — content creation, video generation, funnel hosting, messaging, email, calendar, pipeline, and automations — all owned by us.

## **What We’re Replacing**

| GHL Feature | Replacement | API / Technology | Why |
| :---- | :---- | :---- | :---- |
| SMS/iMessage | SendBlue | SendBlue REST API | Blue bubble iMessages with auto SMS/RCS fallback. 2x response rates vs green SMS. Flat-rate pricing. |
| Email sending | Resend | Resend REST API | Developer-first. TypeScript SDK. React Email templates. Supabase native integration. SOC 2 certified. |
| Calendar / Booking | Calendly | Calendly API v2 \+ Embed API \+ Scheduling API | Industry-standard booking. Advisors likely already have Calendly. Handles calendar invites, reminders, Zoom integration natively. |
| Zoom meetings | Zoom API | Zoom REST API (Server-to-Server OAuth) | Create meetings programmatically when appointments are booked. Links sent via SendBlue/Resend. |
| Funnel pages | Self-hosted (Next.js on Vercel) | Our existing tech stack | Full control over design, tracking, performance. Direct content injection from Content Studio. |
| Webinar room | Custom simulive room (Next.js \+ Mux \+ Supabase Realtime) | Video streaming \+ real-time chat | Feels like a live event. Chat, attendee count, timed CTAs. No Zoom Events license required. |
| Video generation | Veo 3 (Google) | Vertex AI API / Gemini API | Text-to-video with native audio. Generate ad creatives, VSL clips, and promo videos from scripts. |
| Automations / Workflows | Custom workflow engine | Supabase \+ serverless functions | Trigger → Condition → Action chains. Full control over logic. |
| Pipeline / Opportunities | Native Growth OS feature | Supabase tables \+ API | Built into the attribution ledger. No sync needed. |
| Conversations | Native inbox | SendBlue webhooks \+ Resend webhooks | Unified inbox: iMessage, SMS, and email threads per contact. |

| Why This Is Better Than GHL No 24-hour token expiry. No Custom Values workaround for content injection. No rate limits from a third-party platform. No dependency on GHL’s roadmap or API limitations. We own every page, every message, every data point. Content from the Content Studio renders directly into our pages and messages — no intermediary. And advisors get iMessage (blue bubbles) instead of carrier SMS. |
| :---- |

## **Tech Stack Summary**

| Layer | Technology |
| :---- | :---- |
| Frontend | Next.js (React) on Vercel |
| Database | Supabase (Postgres \+ RLS) |
| Auth | Supabase Auth |
| iMessage / SMS | SendBlue API |
| Email | Resend API \+ React Email templates |
| Calendar | Calendly API v2 \+ Embed \+ Scheduling API |
| Video meetings | Zoom API (S2S OAuth) |
| Webinar room | Custom simulive: Mux (video streaming) \+ Supabase Realtime (chat) |
| Video generation | Veo 3 via Vertex AI API (Google Cloud) or Gemini API |
| Funnel hosting | Vercel (same deployment as the app) |
| Automation engine | Supabase Edge Functions \+ pg\_cron \+ custom job queue |
| File storage | Supabase Storage |
| AI / LLM | Anthropic API (Claude) |
| Ad management | Meta Marketing API |

# **2\. SendBlue — iMessage & SMS Messaging**

## **What SendBlue Does**

SendBlue is an iMessage API that sends blue bubble messages to iPhone users and auto-falls back to RCS then SMS for Android. It handles Apple’s encryption behind the scenes. Messages are sent from a real phone number (not a short code). Flat-rate pricing — no per-segment costs. Supports media (images, video, files), read receipts, typing indicators, and group messages.

| Key Advantage Advisors’ messages arrive as blue iMessages, not green SMS. Per SendBlue’s data, iMessage response rates are 2x higher than SMS. For a financial advisor sending appointment reminders and nurture sequences, this directly impacts show rates and conversion rates. |
| :---- |

| Future Consideration: Linq Linq (linqapp.com) is an alternative iMessage API we are monitoring. They support iMessage \+ RCS \+ SMS \+ programmatic voice, are SOC 2 Type II certified, just raised $20M Series A (Feb 2026), and claim 90% cheaper than legacy APIs. Their API includes emoji reactions, voice notes, and richer webhook events. We are currently on their waitlist. If Linq’s API surface meets our needs after sandbox testing, it could replace SendBlue as the messaging layer. The abstraction in our automation engine makes this a config swap, not a rewrite. |
| :---- |

## **Authentication**

**Base URL: https://api.sendblue.co**

Two headers required on every request:

* **sb-api-key-id:** Your SendBlue API key ID

* **sb-api-secret-key:** Your SendBlue API secret key

Credentials are obtained from the SendBlue dashboard (https://sendblue.com/dashboard/api). Store encrypted as platform-level secrets.

## **Key Endpoints**

| Endpoint | Method | Purpose | When We Use It |
| :---- | :---- | :---- | :---- |
| /api/send-message | POST | Send iMessage/SMS to a single recipient | Nurture sequences, appointment reminders, no-show recovery, CTA follow-ups |
| /api/send-group-message | POST | Send to a group of recipients | Batch notifications (rare for our use case) |
| /api/status?handle={id} | GET | Check message delivery status | Verify delivery, resolve pending statuses |
| /api/messages | GET | List all messages | Populate the Conversations inbox |
| /api/messages/{id} | GET | Retrieve a specific message | Message detail view |
| /api/contacts | GET/POST/PUT/DELETE | Full CRUD on contacts | Sync contacts between Growth OS and SendBlue |
| /api/contacts/bulk | POST/DELETE | Bulk create or delete contacts | Initial contact import, list cleanup |
| /api/contacts/verify | POST | Verify if a number supports iMessage | Pre-check before sending (optimize routing) |
| /api/lookups | POST | Lookup number capabilities | Determine iMessage vs SMS for a contact |
| /api/typing-indicators | POST | Send typing indicator | Show “...” before sending (adds human feel to automated messages) |
| Webhooks | POST (inbound) | Receive inbound messages \+ delivery status | Power the Conversations inbox, trigger automation responses |

**Send Message — Key Parameters**

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| number | string | Yes | \+1XXXXXXXXXX format. The recipient’s phone number. |
| content | string | Yes | The message text. No character limit for iMessage. SMS falls back to standard limits. |
| media\_url | string | No | URL to an image, video, or file to attach. iMessage supports large files. |
| send\_style | string | No | iMessage expressive effects: “celebration”, “confetti”, “lasers”, “gentle”, “loud”, etc. |
| status\_callback | string | No | Webhook URL to receive delivery status updates for this message. |

**Webhook Events (Inbound)**

Configure a webhook URL in the SendBlue dashboard. SendBlue sends POST requests when:

* **Message received:** A contact replies to your message. Payload includes sender number, content, media\_url, and timestamp.

* **Message status update:** Delivery confirmation. Status values: QUEUED, SENT, DELIVERED, ERROR.

* **Read receipt:** The recipient read the iMessage (iMessage only, not SMS).

## **Documentation Links**

[SendBlue API Documentation](https://docs.sendblue.com/api)

[SendBlue API v2](https://docs.sendblue.com/api-v2/)

[Send Message Endpoint](https://docs.sendblue.com/api/resources/messages/methods/send)

[Get Message Status](https://docs.sendblue.com/api/resources/messages/methods/get_status)

[Webhook Events](https://docs.sendblue.com/api/resources/webhooks)

[Contacts API](https://docs.sendblue.com/api/resources/contacts/methods/list)

[Typing Indicators](https://docs.sendblue.com/api/resources/typing_indicators/methods/send)

[Number Lookup](https://docs.sendblue.com/api/resources/lookups/methods/lookup_number)

[SendBlue \+ Twilio Integration Guide](https://www.sendblue.com/blog/twilio-imessage-integration)

# **3\. Resend — Email Sending**

## **What Resend Does**

Resend is a developer-first email API. TypeScript SDK with full type safety. React Email support means we build email templates in JSX — same component model as the rest of the app. Clean REST API, batch sending, scheduling, webhooks for delivery events, and native Supabase integration.

## **Authentication**

**Base URL: https://api.resend.com**

Single API key in the Authorization header: Bearer re\_xxxxx

Obtain from Resend dashboard. Store encrypted as platform-level secret.

## **Key Endpoints**

| Endpoint | Method | Purpose | When We Use It |
| :---- | :---- | :---- | :---- |
| /emails | POST | Send a single email | Nurture emails, appointment confirmations, booking reminders, welcome emails |
| /emails/batch | POST | Send up to 100 emails in one call | Batch nurture sequence sends, campaign blasts |
| /emails/{id} | GET | Retrieve email details \+ status | Verify delivery, check bounce status |
| /domains | GET/POST | Manage sending domains | Initial setup: verify advisor’s sending domain |
| /audiences | POST/GET | Create and manage contact lists | Organize contacts by campaign, segment |
| /audiences/{id}/contacts | POST/GET/DELETE | Manage contacts within audiences | Add leads to nurture lists, remove on unsubscribe |
| Webhooks | POST (inbound) | Receive delivery events | Track opens, clicks, bounces, complaints for attribution |

**Send Email — Key Parameters**

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| from | string | Yes | "David Mitchell \<david@cornerstonewealth.com\>" — must be a verified domain |
| to | string/array | Yes | Recipient email(s) |
| subject | string | Yes | Email subject line — from approved Content Studio copy |
| html | string | Conditional | HTML email body. Use React Email to render JSX templates to HTML. |
| react | React component | Conditional | Alternative to html: pass a React Email component directly (Node.js SDK only) |
| text | string | No | Plain text fallback |
| reply\_to | string | No | Advisor’s email address for replies |
| scheduled\_at | string | No | ISO 8601 datetime. Schedule email for future delivery. |
| headers.X-Idempotency-Key | string | No | Prevents duplicate sends on retries. Use for automated sequences. |
| tags | array | No | \[{ name: “campaign”, value: “tax-optimization-q1” }\] — for analytics |

**Webhook Events**

* **email.sent:** Email accepted by Resend for delivery.

* **email.delivered:** Email delivered to recipient’s inbox.

* **email.opened:** Recipient opened the email (pixel tracking).

* **email.clicked:** Recipient clicked a link in the email.

* **email.bounced:** Email bounced. Mark contact as invalid.

* **email.complained:** Recipient marked as spam. Remove from sequences immediately.

## **Documentation Links**

[Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email)

[Resend \+ Supabase Integration](https://resend.com/supabase)

[React Email (Template Library)](https://react.email)

[Batch Emails](https://resend.com/docs/api-reference/emails/send-batch-emails)

[Webhooks](https://resend.com/docs/dashboard/webhooks/introduction)

[Domains (Verification)](https://resend.com/docs/api-reference/domains)

[Audiences & Contacts](https://resend.com/docs/api-reference/audiences)

# **4\. Calendly — Calendar & Booking**

## **What Calendly Handles**

Calendly manages all scheduling: appointment types, availability, calendar sync (Google/Outlook), booking UI, calendar invites, reminders, and Zoom meeting creation. We embed Calendly into our funnel pages and receive booking data via webhooks \+ API.

| New: Scheduling API Calendly recently launched a Scheduling API that lets us create bookings programmatically without redirecting to Calendly’s UI. This means we can build a fully native booking experience inside our funnel pages while Calendly handles the backend (calendar invites, conflict checking, reminders, Zoom link generation). |
| :---- |

## **Authentication**

**Base URL: https://api.calendly.com**

Two auth methods:

* **Personal Access Token:** For internal tools. Bearer token in Authorization header.

* **OAuth 2.1:** For multi-user apps. Advisor connects their Calendly account via OAuth. We store their access/refresh tokens.

## **Key Endpoints**

| Endpoint | Method | Purpose | When We Use It |
| :---- | :---- | :---- | :---- |
| /event\_types | GET | List all event types for a user | Show advisor’s available meeting types. Map to the Retirement Readiness Review. |
| /scheduled\_events | GET | List scheduled events | Pull booked appointments into the OS for attribution \+ pipeline tracking. |
| /scheduled\_events/{uuid}/invitees | GET | Get invitee details for an event | Pull contact info (name, email, UTMs) for the lead record. |
| /scheduling\_links | POST | Create single-use scheduling links | Generate unique booking links with pre-filled info \+ UTM tracking. |
| /invitee\_no\_shows | POST | Mark invitee as no-show | Trigger no-show recovery sequence via SendBlue/Resend. |
| /webhook\_subscriptions | POST | Create webhook subscriptions | Listen for invitee.created and invitee.canceled events. |
| Scheduling API (Create Event Invitee) | POST | Book an appointment programmatically | Native booking from our funnel pages without Calendly redirect. |

**Webhook Events**

* **invitee.created:** New appointment booked. Payload includes event details, invitee info, UTM params. Triggers: update pipeline to “Booked”, send confirmation via SendBlue, create Zoom meeting if not auto-created.

* **invitee.canceled:** Appointment canceled. Triggers: update pipeline, send re-engagement sequence.

* **routing\_form\_submission.created:** Routing form submitted (if using Calendly’s routing).

**UTM Tracking Through Calendly**

Calendly supports UTM parameters on scheduling links: utm\_source, utm\_medium, utm\_campaign, utm\_content, utm\_term. These are passed through to the webhook payload and API responses. This is how we track which Meta ad drove each booked call.

## **Documentation Links**

[Calendly Developer Portal](https://developer.calendly.com/)

[Getting Started](https://developer.calendly.com/getting-started)

[API Reference](https://developer.calendly.com/api-docs)

[Webhooks Overview](https://help.calendly.com/hc/en-us/articles/223195488-Webhooks-overview)

[Scheduling API Announcement](https://community.calendly.com/api-webhook-help-61/scheduling-api-now-available-4825)

[FAQs (UTM params, token management)](https://developer.calendly.com/frequently-asked-questions)

# **5\. Zoom — Video Meetings**

## **What We Use Zoom For**

When a prospect books a Retirement Readiness Review through Calendly, we need a Zoom meeting link. Calendly can auto-create Zoom meetings if the advisor’s Zoom account is connected. We also integrate directly with the Zoom API for full control over meeting settings, recording, and tracking.

## **Authentication**

**Base URL: https://api.zoom.us/v2**

Server-to-Server OAuth (recommended for backend automation):

* Create a Server-to-Server OAuth app in the Zoom Marketplace.

* Get account\_id, client\_id, client\_secret.

* Exchange for access token: POST https://zoom.us/oauth/token?grant\_type=account\_credentials\&account\_id={id}

* Token is used in Authorization: Bearer header.

* Tokens expire but are auto-refreshable via the same endpoint.

## **Key Endpoints**

| Endpoint | Method | Purpose |
| :---- | :---- | :---- |
| /users/{userId}/meetings | POST | Create a new Zoom meeting. Returns join\_url and start\_url. |
| /meetings/{meetingId} | GET | Get meeting details (for verification). |
| /meetings/{meetingId} | PATCH | Update meeting settings. |
| /meetings/{meetingId} | DELETE | Cancel a meeting. |
| /meetings/{meetingId}/recordings | GET | Get meeting recordings (if auto-record is enabled). |

**Create Meeting — Key Parameters**

| Parameter | Type | Notes |
| :---- | :---- | :---- |
| topic | string | "Retirement Readiness Review — \[Contact Name\]" |
| type | integer | 2 \= scheduled meeting |
| start\_time | string | ISO 8601 from Calendly booking data |
| duration | integer | 45 (minutes, matching the advisor’s event type) |
| timezone | string | From the contact’s timezone or advisor’s default |
| settings.join\_before\_host | boolean | true — let the prospect join early |
| settings.waiting\_room | boolean | false — no waiting room for a 1:1 consultation |
| settings.auto\_recording | string | "cloud" if we want to auto-record for review |

## **Documentation Links**

[Zoom Developer Docs](https://developers.zoom.us/docs/api/)

[Meetings API](https://developers.zoom.us/docs/api/meetings/)

[Server-to-Server OAuth](https://developers.zoom.us/docs/internal-apps/s2s-oauth/)

[Create an OAuth App](https://developers.zoom.us/docs/integrations/create/)

# **6\. Veo 3 — AI Video Generation**

## **What Veo 3 Does**

Veo 3 is Google’s text-to-video model that generates high-fidelity video with native audio (dialogue, sound effects, ambient sound) from text prompts. It runs on Vertex AI (Google Cloud) and is also available through the Gemini API. We use it to generate ad creative videos, VSL clips, and promo videos from approved scripts in the Content Studio.

| Why Veo 3 Over HeyGen Veo 3 generates complete video scenes with natural audio from a text prompt — no avatar setup, no voice cloning step, no template editing. The Content Studio produces the ad script; Veo 3 turns it directly into video. This eliminates the HeyGen template management overhead and the ElevenLabs voice cloning setup. The tradeoff: Veo 3 produces cinematic/stylized video rather than a talking-head avatar of the advisor. For UGC-style ad creatives and promotional clips, this is the right fit. For advisor-specific talking head videos (where the advisor’s face is shown), the advisor records real video. The AI-generated content is for the marketing creative layer, not advisor impersonation. |
| :---- |

## **API Access Options**

| Method | Base URL | Auth | Best For |
| :---- | :---- | :---- | :---- |
| Vertex AI (Google Cloud) | https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT\_ID}/locations/us-central1/publishers/google/models/veo-3.0-generate-preview:predictLongRunning | Google Cloud service account (OAuth 2.0) | Production use. Enterprise SLAs. GCP billing integration. |
| Gemini API | https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview | API key (Gemini API key) | Simpler setup. Good for prototyping. Pay-per-use. |

## **Generation Flow**

* **Step 1:** Content Studio produces approved ad script (e.g., Hook \+ Relate \+ Educate \+ CTA sections).

* **Step 2:** System constructs a detailed video prompt from the script. Prompt includes scene description, dialogue, tone, visual style, and duration.

* **Step 3:** POST request to Veo 3 API with the prompt. This is an async operation — returns an operation ID.

* **Step 4:** Poll the operation status endpoint until generation is complete (typically 1–5 minutes per clip).

* **Step 5:** Download the generated video. Store in Supabase Storage. Present in the Video Review interface for advisor approval.

* **Step 6:** Approved videos are attached to the campaign and used in Meta ad creatives \+ funnel pages.

**Key API Parameters (Vertex AI)**

| Parameter | Type | Notes |
| :---- | :---- | :---- |
| prompt | string | The text prompt describing the video scene. Include dialogue in quotes for Veo 3 to generate speech. |
| negativePrompt | string | What to avoid (e.g., “blurry, low quality, watermark”). |
| aspectRatio | string | "16:9" (landscape ads, webinar promos) or "9:16" (Reels, Stories). |
| numberOfVideos | integer | 1–4 variations per generation call. |
| durationSeconds | integer | 5–8 seconds per clip for Veo 3 (combine clips for longer videos). |
| personGeneration | string | Set to “allow\_adult” for ads featuring people. |
| outputStorageUri | string | Optional. GCS bucket path. If omitted, video bytes returned in response. |

| Clip Composition Strategy Veo 3 generates 5–8 second clips. For a full 30–60 second ad, generate one clip per script section (Hook \= 1 clip, Relate \= 1 clip, Educate \= 1 clip, CTA \= 1 clip) and stitch them server-side using FFmpeg. This also gives the advisor granular control — they can approve/reject individual scenes, not just the whole video. |
| :---- |

## **Database Tables**

| Table | Key Fields | Purpose |
| :---- | :---- | :---- |
| video\_generations | id, firm\_id, campaign\_id, asset\_id, prompt, negative\_prompt, aspect\_ratio, duration, operation\_id, status (pending/generating/complete/failed), video\_url, thumbnail\_url, created\_at | Track each video generation request and its result. |
| video\_clips | id, video\_generation\_id (FK), clip\_index, section\_key (hook/relate/educate/cta), video\_url, duration\_seconds, approved (bool), created\_at | Individual clips within a multi-clip composition. Advisor approves per clip. |

## **Documentation Links**

[Veo on Vertex AI — API Reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)

[Veo 3 on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-0-generate)

[Veo 3.1 on Gemini API](https://ai.google.dev/gemini-api/docs/video)

[Veo 3.1 Gemini API Model Page](https://ai.google.dev/gemini-api/docs/models/veo-3.1-generate-preview)

[Google Blog: Build with Veo 3](https://developers.googleblog.com/veo-3-now-available-gemini-api/)

[Google Blog: Veo 3.1 Announcement](https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/)

# **7\. Webinar Room — Custom Simulive Experience**

## **The Problem**

The webinar page can’t be a simple “here’s a video with a CTA below it.” It needs to feel like a live event. The advisor records the webinar once. Every time a cohort of prospects registers and gets scheduled for a session, they join what feels like a live webinar room — with a video playing, a chat sidebar, attendee count, and timed calls to action. This is the “simulive” model used by top webinar platforms.

## **Why Not Zoom Simulive?**

Zoom does offer simulive webinars, but there are significant limitations for our use case:

* **Requires Zoom Events or Zoom Sessions license** — additional cost on top of standard Zoom. Per-advisor licensing adds up.

* **Video must be a Zoom cloud recording** — the pre-recorded webinar has to be uploaded as a Zoom recording first (workaround: screen-share the video in a private Zoom meeting to get it into cloud). Clunky.

* **Limited design control** — we can’t customize the webinar room UI, CTA placement, or branding. It looks like Zoom, not like the advisor’s brand.

* **No timed interactions** — we can’t trigger specific CTAs, polls, or urgency elements at precise timestamps in the video.

* **Host must be present for live chat** — during simulive, only chat/Q\&A is available. If nobody monitors it, the “live” illusion breaks.

| Our Solution: Custom-Built Webinar Room Build a simulive webinar room as a Next.js page within the Growth OS. We control the entire experience: video player, real-time chat, attendee count, timed CTAs, countdown timer, and post-webinar redirect. The AI can monitor and respond to chat in real time, maintaining the live illusion without requiring the advisor to be present. |
| :---- |

## **Architecture**

| Component | Technology | Purpose |
| :---- | :---- | :---- |
| Video player | Mux (mux.com) — video streaming API | Host and stream the pre-recorded webinar. Mux provides adaptive bitrate streaming, low latency, and a player SDK. Alternatively: Cloudflare Stream or self-hosted with HLS. |
| Real-time chat | Supabase Realtime (Postgres \+ WebSocket) | Attendees see a live chat sidebar. Messages are stored in a chat\_messages table. Supabase Realtime broadcasts new messages instantly to all connected clients. |
| Attendee tracking | Supabase Realtime (Presence) | Show “47 people watching” in the room. Supabase Presence tracks connected users. Number is displayed (slightly inflated for social proof if needed). |
| Timed CTAs | Custom JS (video player time events) | At specific timestamps (e.g., 22:00, 35:00, 48:00), overlay CTAs appear: “Book Your Retirement Readiness Review Now.” These are configured per campaign in the database. |
| Countdown / lobby | Custom component | Before the scheduled start time, show a “Starting in 5:32” countdown. Creates urgency and the feeling of a live event. |
| Post-webinar redirect | Next.js router | When the video ends, auto-redirect attendees to the booking page (/{firm-slug}/book). This is the conversion moment. |

**Webinar Room Features**

* Full-screen video player with the advisor’s pre-recorded webinar.

* Chat sidebar (right side) — attendees can type messages, see others’ messages. AI responds instantly to common questions.

* Attendee count badge: “47 watching now.” Updates in real-time via Supabase Presence.

* Timed CTA overlays that slide in at configured timestamps (“Book your free review →” with a Calendly link).

* “Starting soon” lobby with countdown before the scheduled session starts.

* Engagement triggers: polls at specific timestamps (“Are you concerned about taxes in retirement? Yes / No”) — increases perceived interactivity.

* Exit-intent detection: if the user tries to leave before the CTA, show a modal (“Wait — the best part is coming up in 2 minutes”).

* Replay availability: after the live session window, the same URL can show an “on-demand” version (video plays immediately, no countdown).

**Session Scheduling**

The simulive model works on a scheduled basis. When a prospect registers, they’re assigned to the next available session (e.g., “Tuesday at 7 PM EST” and “Thursday at 12 PM EST”). This creates urgency and commitment. The session schedule is configured per campaign in the database.

* **webinar\_sessions table:** id, campaign\_id, scheduled\_at, is\_active, attendee\_count, chat\_enabled, replay\_available\_at

* **webinar\_registrations table:** id, session\_id (FK), contact\_id (FK), registered\_at, attended (bool), watch\_duration\_seconds, booked\_call (bool)

* **webinar\_chat\_messages table:** id, session\_id (FK), contact\_id (FK), message, is\_ai\_response (bool), created\_at

* **webinar\_cta\_events table:** id, session\_id (FK), contact\_id (FK), cta\_type (book/poll/link), timestamp\_shown, clicked (bool)

**Mux Video Streaming**

Mux (mux.com) is a developer-first video infrastructure API. We use it to host and stream the pre-recorded webinar video. Key endpoints:

| Endpoint | Method | Purpose |
| :---- | :---- | :---- |
| POST /video/v1/assets | POST | Upload the webinar video. Returns an asset\_id and playback\_id. |
| GET /video/v1/assets/{id} | GET | Check upload/processing status. |
| Playback URL | n/a | https://stream.mux.com/{playback\_id}.m3u8 — HLS stream URL used by the Mux Player SDK. |
| POST /video/v1/live-streams | POST | Alternative: create a “live stream” that plays the pre-recorded video on a schedule (more complex, not needed for MVP). |

| Why Mux? Mux is the Stripe of video. Clean API, excellent docs, adaptive bitrate streaming, analytics (engagement heatmaps, rebuffer rates), and a React player component that drops into our Next.js pages. They also provide Data (video analytics) which feeds into our attribution — we can track exactly how much of the webinar each prospect watched and correlate it with booking rates. |
| :---- |

## **Documentation Links**

[Mux Developer Docs](https://docs.mux.com)

[Mux Video API Reference](https://docs.mux.com/api-reference)

[Mux Player (React)](https://docs.mux.com/guides/mux-player-web)

[Supabase Realtime (Chat / Presence)](https://supabase.com/docs/guides/realtime)

# **8\. Funnel Hosting — Self-Hosted Pages**

## **How This Works**

Instead of GHL’s funnel builder, we host funnel pages as Next.js routes within the Growth OS application on Vercel. Amplified’s templates become React page components. The advisor’s approved copy from the Content Studio is rendered directly into these components — no Custom Values workaround.

**Page Types We Build**

| Page | Route Pattern | Purpose | Key Elements |
| :---- | :---- | :---- | :---- |
| Registration / Landing | /{firm-slug}/register | Convert ad traffic to webinar registrations | Headline, bullets, CTA form (name, email, phone), trust bar, disclaimer |
| Thank You / Pre-VSL | /{firm-slug}/thank-you | Post-registration. VSL video \+ immediate booking option. | VSL video (Veo 3 generated or advisor-recorded), booking CTA (Calendly embed), fallback to webinar session selection |
| Webinar Room | /{firm-slug}/watch/{session-id} | Simulive webinar experience | Full webinar room (see Section 7): video player, chat, attendee count, timed CTAs, countdown |
| Booking Page | /{firm-slug}/book | Final conversion page | Calendly embed (or Scheduling API form), recap copy, FAQ, testimonials |
| Calendar Application Page | /{firm-slug}/calendar-application | Placed before booking in webinar room | Simple form to qualify prospect prior to letting them book |

**Content Injection**

Each page component accepts a campaign object from the database. The campaign object contains all the approved copy from the Content Studio. The page renders it directly:

* Page loads → server-side: fetch campaign data from Supabase (including all approved funnel copy)

* Render the template component with the campaign data as props

* Headline \= campaign.funnel\_copy.registration.headline, CTA \= campaign.funnel\_copy.registration.cta, etc.

* No API calls to a third party. No Custom Values. No delay.

**Custom Domains**

* MVP: All funnels hosted under a subdomain (e.g., app.amplifiedadvisors.com/{firm-slug}/register).

* Future: Advisors can connect their own domain via Vercel’s custom domain API.

**Tracking & Analytics**

* Meta Pixel: Installed on all funnel pages. Fires standard events (PageView, Lead, Schedule, CompleteRegistration).

* Meta Conversions API: Server-side events fired from our backend when form submissions and bookings happen.

* UTM parameters: Captured from the ad click URL, stored with the lead record, passed through to Calendly.

* Internal analytics: Page views, form submissions, conversion rates — all stored in our database.

* Webinar analytics: Watch duration, chat engagement, CTA clicks — from Mux Data \+ our webinar\_registrations table.

# **9\. Automation Engine — Custom Workflow System**

## **How Automations Replace GHL Workflows**

GHL’s workflows are trigger → condition → action chains. We build the same thing natively using a job queue backed by Supabase \+ Edge Functions. Every automation is a sequence of steps with delays, conditions, and actions.

## **Architecture**

| Component | Technology | Purpose |
| :---- | :---- | :---- |
| Workflow definitions | Supabase table (workflow\_definitions) | Stores the structure of each workflow: triggers, steps, conditions, delays |
| Workflow instances | Supabase table (workflow\_instances) | Tracks each contact’s progress through a workflow |
| Job queue | Supabase table (automation\_jobs) \+ pg\_cron | Scheduled jobs that fire at the right time (delays, scheduled sends) |
| Executor | Supabase Edge Function | Picks up jobs from the queue and executes actions (send SMS, send email, update pipeline, etc.) |
| Trigger listener | Webhook handlers \+ database triggers | Listens for events (form submitted, appointment booked, etc.) and enrolls contacts in workflows |

## **Workflow Types We Need at MVP**

| Workflow | Trigger | Steps |
| :---- | :---- | :---- |
| New Lead Nurture (6 emails \+ iMessages) | Form submission on registration page | Immediate: send confirmation email \+ iMessage. Day 2: email \#2. Day 4: email \#3. Day 7: email \#4. Day 10: email \#5. Day 14: email \#6. Each checks if contact has booked — if yes, exit workflow. |
| Webinar Reminder Sequence | Registration \+ session assignment | 24hrs before session: reminder iMessage \+ email. 1hr before: final reminder with link to /{firm-slug}/watch/{session-id}. 15 min before: “We’re starting soon\!” iMessage. |
| Appointment Confirmation | Calendly invitee.created webhook | Immediate: send confirmation iMessage \+ email with prep checklist. 24hrs before: reminder iMessage. 1hr before: final reminder iMessage with Zoom link. |
| No-Show Recovery | Advisor marks no-show (or Calendly no-show event) | 1hr post: empathetic iMessage (“Life happens”). 24hrs post: email with reschedule link. 48hrs post: final iMessage. |
| Long-Term Nurture (10 emails) | 14 days after registration with no booking | Bi-weekly value emails over 90 days. Case studies, market commentary, Social Security tips. Each checks if contact has booked — if yes, exit. |
| Post-Meeting Follow-Up | Pipeline stage moved to “Showed” | Immediate: thank-you iMessage. 24hrs: follow-up email with recap. 3 days: check-in if no proposal sent. |

**Trigger Types**

* **form\_submission:** Prospect fills out a form on a funnel page.

* **webinar\_registration:** Prospect registers and is assigned a session.

* **webinar\_attended:** Prospect watched \>50% of the webinar (from Mux analytics).

* **webinar\_missed:** Prospect registered but didn’t attend the session.

* **appointment\_booked:** Calendly invitee.created webhook fires.

* **appointment\_canceled:** Calendly invitee.canceled webhook fires.

* **no\_show:** Advisor marks as no-show in pipeline OR Calendly no-show event.

* **pipeline\_stage\_changed:** Contact moves to a new pipeline stage.

* **tag\_added:** A tag is applied to a contact (e.g., “hot-lead”).

* **message\_received:** Contact replies via iMessage/SMS (SendBlue webhook).

* **time\_based:** X days after enrollment, at a specific time.

**Action Types**

* **send\_imessage:** Send via SendBlue API. Content from approved Content Studio copy.

* **send\_email:** Send via Resend API. Template from React Email \+ Content Studio copy.

* **wait:** Pause for X hours/days. Job is scheduled in the queue.

* **condition:** Check if contact has booked, attended webinar, has a tag, is in a pipeline stage, etc. Branch accordingly.

* **update\_pipeline:** Move contact to a new pipeline stage.

* **add\_tag:** Apply a tag to the contact.

* **create\_zoom\_meeting:** Create a Zoom meeting via API (if not handled by Calendly).

* **generate\_video:** Trigger Veo 3 video generation for a new creative.

* **notify\_advisor:** Send a notification to the advisor (in-app, email, or iMessage).

* **exit\_workflow:** Remove contact from this workflow.

| Stop-on-Response Logic When a contact replies to an iMessage or email during a nurture sequence, the workflow should pause automated messages and notify the advisor. The advisor handles the live conversation in the Conversations inbox, then can resume or end the automation. This prevents awkward scenarios where the AI keeps sending nurture messages while the advisor is having a real conversation. |
| :---- |

# **10\. Pipeline & Opportunities — Native**

## **Pipeline Stages**

The pipeline is built directly into the Growth OS database. No GHL sync needed.

| Stage | Trigger | Actions | OS Attribution Event |
| :---- | :---- | :---- | :---- |
| New Lead | Form submission | Create contact, enroll in nurture workflow, assign webinar session, create opportunity | Lead captured |
| Registered | Webinar session assigned | Update opportunity, enroll in webinar reminder sequence | Session assigned |
| Attended | Prospect watched \>50% of webinar (Mux analytics) | Update opportunity, add “webinar-attended” tag, enroll in booking push sequence | Webinar attended |
| Booked | Calendly invitee.created | Update opportunity, enroll in confirmation workflow, create Zoom meeting | Call booked |
| Showed | Advisor marks attended (or Zoom API detection) | Update opportunity, enroll in post-meeting follow-up | Meeting attended |
| Follow-Up Meeting Scheduled | Advisor Tags or drags opportunity to stage | Update opportunity | Follow-Up Scheduled |
| Proposal Made | Advisor marks proposal sent | Update opportunity with proposal value | Proposal delivered |
| Won | Advisor marks closed | Log AUM event, calculate campaign ROI, trigger onboarding workflow | Client acquired |
| Lost | Advisor marks lost | Log reason, enroll in long-term nurture, update attribution | Did not close |

# **11\. Conversations Inbox — Unified Messaging**

## **How It Works**

A native inbox that shows all iMessage, SMS, and email threads per contact in one view. Powered by:

* **SendBlue webhooks:** Inbound iMessages and SMS arrive via webhook. Stored in our messages table.

* **SendBlue API:** Outbound messages sent from the inbox via POST /api/send-message.

* **Resend webhooks:** Email delivery, open, and click events. Email replies (via Resend’s inbound webhooks).

* **Thread organization:** Messages grouped by contact\_id. All channels (iMessage, SMS, email) in one chronological thread.

**Key Features**

* Per-contact thread view: see the full conversation history across all channels.

* Channel indicator: each message shows whether it was iMessage (blue), SMS (green), or email.

* Read receipts: show when iMessages were read (from SendBlue).

* Quick actions: book a call (insert Calendly link), send a template message, add a tag, move pipeline stage.

* Automation status: show if the contact is currently in an active workflow and which step they’re on.

* AI suggested replies: the OS suggests response drafts based on the conversation context and the contact’s pipeline stage.

# **12\. Database Tables (New / Modified)**

| Table | Key Fields | Purpose |
| :---- | :---- | :---- |
| contacts | id, firm\_id, first\_name, last\_name, email, phone, imessage\_capable (bool), source, utm\_data (JSON), tags (array), pipeline\_stage, calendly\_invitee\_uri, created\_at | Central contact record. Replaces GHL contacts. |
| opportunities | id, firm\_id, contact\_id (FK), pipeline\_stage, monetary\_value, source\_campaign\_id, source\_ad\_id, booked\_at, showed\_at, won\_at, lost\_at, lost\_reason, notes | Pipeline tracking. Replaces GHL opportunities. |
| messages | id, firm\_id, contact\_id (FK), channel (imessage/sms/email), direction (inbound/outbound), content, media\_url, sendblue\_handle, resend\_email\_id, status, read\_at, sent\_at, created\_at | All messages across all channels. Powers the Conversations inbox. |
| email\_templates | id, firm\_id, campaign\_id, template\_key (e.g., nurture\_email\_1), subject, html\_content, react\_component\_name, created\_at | Email templates built with React Email. Content from Content Studio. |
| workflow\_definitions | id, firm\_id, name, trigger\_type, trigger\_config (JSON), steps (JSON array), is\_active, created\_at | Defines the automation structure (trigger, conditions, actions, delays). |
| workflow\_instances | id, workflow\_definition\_id (FK), contact\_id (FK), current\_step\_index, status (active/paused/completed/exited), enrolled\_at, completed\_at | Tracks each contact’s progress through a workflow. |
| automation\_jobs | id, workflow\_instance\_id (FK), action\_type, action\_config (JSON), scheduled\_for, status (pending/processing/completed/failed), executed\_at, result (JSON) | The job queue. pg\_cron picks up pending jobs and executes them. |
| funnel\_pages | id, firm\_id, campaign\_id, page\_type (registration/vsl/webinar/booking), slug, content (JSON), is\_published, published\_at | Funnel page content. Rendered by Next.js page components. |
| webinar\_sessions | id, campaign\_id, scheduled\_at, is\_active, mux\_playback\_id, chat\_enabled, replay\_available\_at | Scheduled simulive webinar sessions. |
| webinar\_registrations | id, session\_id (FK), contact\_id (FK), registered\_at, attended (bool), watch\_duration\_seconds, booked\_call (bool) | Track attendance and engagement per session. |
| webinar\_chat\_messages | id, session\_id (FK), contact\_id (FK), message, is\_ai\_response (bool), created\_at | Chat messages during webinar sessions. |
| webinar\_cta\_events | id, session\_id (FK), contact\_id (FK), cta\_type, timestamp\_shown, clicked (bool) | Track CTA interactions during webinars. |
| video\_generations | id, firm\_id, campaign\_id, asset\_id, prompt, aspect\_ratio, duration, operation\_id, status, video\_url, thumbnail\_url, created\_at | Veo 3 video generation requests and results. |
| video\_clips | id, video\_generation\_id (FK), clip\_index, section\_key, video\_url, duration\_seconds, approved (bool), created\_at | Individual clips within a multi-clip composition. |
| calendly\_connections | id, firm\_id, access\_token (encrypted), refresh\_token (encrypted), calendly\_user\_uri, event\_type\_uri, connected\_at | OAuth connection to Calendly per firm. |
| zoom\_connections | id, firm\_id, account\_id, client\_id, client\_secret (encrypted), connected\_at | Zoom S2S OAuth credentials per firm. |
| sendblue\_config | id, firm\_id, phone\_number, api\_key\_id (encrypted), api\_secret (encrypted), webhook\_url, connected\_at | SendBlue configuration per firm. |
| page\_analytics | id, firm\_id, page\_id (FK), event\_type, contact\_id, utm\_data (JSON), referrer, created\_at | Funnel page analytics for conversion tracking. |

# **13\. Implementation Phases**

| Phase | Scope | Effort | Dependencies |
| :---- | :---- | :---- | :---- |
| Phase 1: Messaging Layer | SendBlue integration (send/receive iMessage \+ SMS). Resend integration (send email). Webhook handlers for both. Messages table. Basic Conversations inbox UI. | 10–14 days | SendBlue account \+ API keys. Resend account \+ verified domain. Webhook endpoint infrastructure. |
| Phase 2: Funnel Pages \+ Forms | Next.js page templates for registration, thank-you, and booking pages. Form submission handler. Lead creation. UTM capture. Meta Pixel \+ CAPI integration. | 7–10 days | Phase 1 complete (for confirmation messages). Content Studio approval flow. Meta Pixel setup. |
| Phase 3: Calendar \+ Zoom | Calendly OAuth connection. Webhook listeners (invitee.created, canceled). Zoom meeting creation. Booking data sync to pipeline. | 5–7 days | Phase 2 complete (Calendly embed on booking page). Zoom S2S OAuth app. |
| Phase 4: Webinar Room | Mux integration (video upload \+ streaming). Supabase Realtime chat. Attendee presence tracking. Timed CTA system. Countdown lobby. Webinar session scheduling. AI chat responder. | 10–14 days | Mux account. Supabase Realtime configured. Webinar video recorded and uploaded. |
| Phase 5: Video Generation | Veo 3 API integration. Prompt construction from Content Studio scripts. Async generation \+ polling. Clip stitching (FFmpeg). Video Review interface. Storage in Supabase. | 7–10 days | Google Cloud project with Vertex AI enabled (or Gemini API key). Content Studio producing approved scripts. |
| Phase 6: Automation Engine | Workflow definitions table. Job queue \+ executor. All MVP workflow types (including webinar reminders). Stop-on-response logic. Trigger listeners. | 12–16 days | Phases 1–4 complete. All messaging, calendar, and webinar APIs working. |
| Phase 7: Pipeline \+ Conversations | Full pipeline UI (Kanban \+ list views). Conversations inbox with threaded view. AI suggested replies. Contact detail view with full history. | 8–12 days | Phase 6 complete. All data flowing through the system. |

| Total Estimated Build: 59–83 Days This is a larger effort than the original GHL-dependent version because we’re now building the webinar room and video generation layer natively. The tradeoff: zero third-party platform dependencies (aside from APIs we control). Start with Phase 1 (messaging) because it’s the foundation. Phases 2–3 (funnel pages \+ calendar) follow quickly. Phase 4 (webinar room) is the marquee feature. Phase 5 (Veo 3\) can run in parallel with Phase 4\. Phases 6–7 (automations \+ pipeline) tie everything together. |
| :---- |

