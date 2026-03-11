Question:

OK, so I’m working on this platform where I’m essentially building the VL funnel stuff and one of the things I need to do is a host webinar right and I’m going to be using MUX and I think Verel domain subduing stuff look I’ve heard that like how webinar kid does it is you have like a subdomain and then they just added it on there because something I’m gonna need to track is essentially I’m gonna be building that webpage that’s the landing page go to market call Action right of like hey register on this form right and so how I think is that every client technically would have a subdomain and it would be there like leaning page or whatever where it’s like this is the call to action they registered you that there and then all that seem like subdomain I can host URLs of like the webinar right you know scale out as I needed, but I could see a world where I’m having like multiple multiple webinars all happening every single day so excessive reliability is the upmost importance. This cannot ever go down in their pre-recorded videos right then I’ll be streaming into this but the thing is I’m just gonna have a lot of connections right and also I’m gonna be like simulating a live environment so like users will be able to like chat or they’ll put like stuff in there but the point is like we’re almost mocking it right so it’s like I don’t know how to webinar kid does in these platforms but right now how we have it is yeah user registers they go to a page and then what other thing is like from a accounting integration part the user will connect their county account and that way we can merge into their their Zoom right for one to ones because the other thing is like once you register right for the webinar you can get tape to another call the action page for like a one to one and that is really cool and what we wanna do is we wanna manage that right in that calendar link on our end so we can control the ranges whatever but they connect their calmly to it and that’s how the ship should all work. Let’s talk through like some of the stuff and like the webinar integration I feel like it’s pretty straightforward. I have a lot of this code already written, but I really want you to teach me about this verse subdomain shit and using MUX to play the videos and stuff and where does where are those videos hosted though that were pre-recording are they on the MUX platform? I mean I’m really new to this. I have blob set up and all that stuff in Versace though.

Thought for 8s
Yes — the clean way to think about this is:

Vercel handles the web app and subdomains.
Mux handles the video files, transcoding, playback delivery, and video reliability.
Your backend handles webinar state, chat simulation, registration, and redirects.

That split is the right mental model for what you’re building.

1. The subdomain part
   What you’re describing is basically a multi-tenant app.

Example:

advisor1.yourplatform.com

advisor2.yourplatform.com

advisor3.yourplatform.com

Each advisor/client gets their own branded “tenant” space, but it is still the same deployed app underneath. Vercel explicitly supports this pattern with wildcard domains like \*.yourdomain.com, and their multi-tenant docs/starter kit are built around that exact setup.

So in practice:

you add yourdomain.com

you add \*.yourdomain.com

your app reads the hostname on each request

advisor1.yourdomain.com maps to tenant record advisor1 in your DB

then you load that advisor’s branding, webinar page, registration form, event settings, Calendly connection, etc.

So no, you do not need a separate Vercel project for each client. Usually you want one app, one codebase, wildcard subdomains, tenant config in DB. That is the standard scalable version.

2. What WebinarKit-style subdomains are probably doing
   They are very likely doing one of these two patterns:

Pattern A: platform subdomain

clientname.platform.com/webinar/some-event

Pattern B: full custom domain

events.clientfirm.com

Pattern A is easiest first. Pattern B is a premium feature later.

For your MVP, I would do:

clientslug.yourdomain.com = client home / branded landing

clientslug.yourdomain.com/register/[eventSlug]

clientslug.yourdomain.com/live/[sessionId]

clientslug.yourdomain.com/book/[eventSlug]

That gives you stable URLs and simple routing logic. Vercel’s wildcard domain support is exactly for this kind of tenant routing.

3. Where the prerecorded videos actually live
   If you use Mux, then yes: the videos are effectively hosted on Mux.

More precisely:

you upload a video file to Mux

Mux stores it

Mux transcodes it into streaming-ready formats

Mux gives you a Playback ID

your front end plays it back from Mux’s delivery network using HLS/adaptive streaming

So your Vercel Blob is not where I’d serve webinar playback from in production if reliability matters most.

Use Blob only if you need:

temporary source uploads

file staging

thumbnails or misc assets

backups or raw archival workflow

But for actual webinar playback, the clean architecture is:

source video → upload to Mux → Mux stores/transcodes/delivers → your webinar page embeds Mux playback.

4. Why Mux makes sense here
   For your use case, Mux is strong because you are not building video infra yourself. Their APIs are built around:

video asset ingestion

live streaming

playback IDs

adaptive streaming delivery

secure playback options

player analytics / quality analytics

That means you do not need to figure out:

transcoding pipelines

HLS packaging

CDN video delivery

bitrate adaptation

global playback handling

That is exactly the stuff you do not want to own as a lean startup.

5. Important distinction: Mux VOD vs “fake live webinar”
   You said these are prerecorded webinars, but presented like live.

That is not the same as true live streaming.

You likely want VOD assets scheduled as if live:

upload prerecorded video to Mux as an asset

store its duration and playback ID

create a webinar_session record in your DB with a start time

when attendees join, your frontend computes:

current session time = now - webinar_start_time

player starts at that offset

disable manual seeking if you want the live illusion

reveal chat/prompts/CTA at timed checkpoints based on session clock

That is way simpler than actually live streaming into Mux every time.

So for your product, I would not start with Mux Live unless you truly need real live broadcasts. For simulated live webinars, Mux on-demand assets + your own timing logic is the simpler and safer architecture. Mux does support live streaming, but that’s a different workflow than simply playing prerecorded content.

6. The most reliable architecture for what you described
   Here’s the lean, reliable version:

Frontend

Next.js on Vercel

wildcard subdomains

server-rendered landing/register/live/book pages

Backend

FastAPI on Railway or another stable API host

handles auth, tenant lookup, webinar session state, registrations, chat events, CTA logic, Calendly tokens/webhooks

Database

Postgres

tenant config, webinar config, sessions, registrants, event timeline, CTA rules, booking redirects

Video

Mux for upload/storage/transcoding/playback

Realtime-ish features

for fake chat: don’t overbuild

use pre-seeded scheduled chat messages plus optional attendee message posting

lightweight websockets / SSE / polling for the room state

store “timeline events” in DB or Redis

Scheduling

Calendly OAuth connection per advisor

store their connected scheduling data/tokens

use Calendly API/webhooks to know booking state

That keeps your hardest reliability problem — video delivery — off your plate, and keeps your app infra mostly normal SaaS infra. Calendly’s current docs support OAuth, webhooks, embeds, and their Scheduling API for deeper integrations.

7. On the “this cannot ever go down” part
   Nothing is literally perfect, but the right way to reduce risk is to avoid making your app responsible for video streaming.

Your app should mostly be responsible for:

rendering pages

checking registration/access

telling the player which Mux playback ID to use

deciding where the viewer is in the webinar timeline

triggering CTA / booking

If your API has a hiccup, the page experience is bad.
If your video infra has a hiccup, the whole product dies.

So you want the video served by Mux, not by your own servers. That is the correct reliability decision.

8. How the actual webinar URL flow should work
   A good flow is:

User lands on
advisor1.yourdomain.com/register/retirement-tax-strategy

They submit the form

You create:

registrant record

session assignment

optional unique attendee token

At webinar time they go to
advisor1.yourdomain.com/live/abc123

Your frontend:

validates access

fetches webinar session info

loads Mux playback ID

calculates offset

starts playing at current simulated-live position

shows fake/live chat and timed CTA

When CTA moment hits:

show “Book your 1:1”

either open your own scheduling UI backed by Calendly

or redirect to your managed booking step

That is much better than generating tons of one-off infrastructure per webinar. The URL is stable because it’s just your normal multi-tenant app route.

9. Should the webinar be its own temporary instance?
   No — not usually.

Do not think of each webinar as spinning up its own whole app deployment.

Think of each webinar as:

a DB record

a route

a Mux playback asset

a session clock

attendee state

So instead of “temporary infrastructure per webinar,” use shared application infrastructure with per-webinar data/state.

That scales much better.

10. What Vercel Blob is for here
    Blob is fine, but I would not make it your core webinar video layer.

Use Blob for things like:

advisor logo uploads

landing page images

downloadable PDFs/checklists

maybe raw uploaded source files before processing

But once it comes to the actual prerecorded webinar video, send it to Mux and let Mux own playback delivery.

11. Security / access control you’ll probably want
    You are in wealth advisor territory, so don’t just leave everything public forever.

Mux supports secured playback with signed URLs/tokens. That lets you control who can watch and when. For example, you can require your app to mint short-lived playback authorization for only registered attendees.

A practical version:

public registration page

protected attendee page

short-lived signed playback token

optional expiration after the event window

That is cleaner than exposing a raw public video URL everywhere.

12. Best recommendation for your stage
    I would build it like this:

Phase 1

one Next.js app on Vercel

wildcard subdomains

Mux for prerecorded webinar video

Postgres for webinar/session/tenant state

fake-live timeline logic in your app

simple simulated chat

Calendly OAuth + booking redirect / embedded flow

Phase 2

signed Mux playback

custom branded domains per client

Redis for room/session state and faster event fanout

better analytics and attendance tracking

failover API hosting / queueing for critical webhooks

That gives you the fewest moving parts while still being production-grade.

13. The blunt answer to your main question
    “Where are those videos hosted though that were prerecorded?”

If you use Mux correctly, they are hosted and streamed by Mux, not by Vercel.
Your app just references the Mux asset/playback ID and embeds the player.

“What is the subdomain thing really?”

It’s just wildcard multi-tenant routing:
one app, many tenant subdomains, tenant config loaded from DB.

“Do I spin up infrastructure per webinar?”

No. Usually each webinar is just a record + route + playback asset + session state, not a separate deployment.

If you want, I’ll map this into a concrete schema next — like the exact DB tables and request flow for tenant, webinar, session, registrant, chat_message, and booking_connection.

So now on these pages right for the go to call action page right for that we’re gonna wanna pull like all different analytics on that experience right so we’re gonna be driving traffic to that register page so like for example, any like metric possible like we wanna know everything there is to know about the user experience on these pages. Obviously this is a technology. It’s already been done before and tracking. What is like the right steps there should we integrate something that just sits on top of the app I assume a company has already solved this at a very high level, right?

Thought for 11s
Yes — you should assume this has already been solved, and you should not build your own analytics stack from scratch for this.

For your webinar funnel pages, the right move is usually to put an analytics layer on top of the app and instrument the funnel intentionally: page views, registration starts, registration completes, drop-off points, CTA clicks, booking clicks, booking completions, session/watch behavior, and UX friction like rage clicks or dead clicks. Vercel Web Analytics can automatically track page views and supports custom events, so it’s a decent lightweight baseline, but it is not the full “know everything about user behavior” stack by itself.

What you actually want is usually three layers:

Basic web/performance analytics for page views, referrers, device/browser, and page performance.

Product analytics for funnel steps and conversion analysis.

Session replay / heatmaps for seeing where users got stuck, hesitated, or abandoned.

That combination is what gives you the “everything there is to know” view without overengineering your own tooling. Vercel covers some of layer 1, while tools like PostHog, Amplitude, and Mixpanel cover layers 2 and 3 at a much deeper level.

For your stage, the strongest answer is probably PostHog first. PostHog’s platform combines product analytics, web analytics, session replay, feature flags, experiments, and surveys in one system, which is useful because your funnel is not just “traffic analytics” — it is a product flow with registration, fake-live webinar timing, CTA exposure, and scheduling conversion. That makes PostHog especially good for a startup trying to move fast without stitching together five vendors.

If you want a more enterprise-style analytics stack, Amplitude is strong for product analytics plus session replay and experimentation. Their docs position Session Replay as a way to connect qualitative session behavior with quantitative analytics, which is exactly what you’d want when trying to diagnose why people don’t finish registration or don’t click through to the 1:1 booking CTA.

Mixpanel is also good if you care heavily about event analytics and funnels, and it now supports heatmaps powered by session replay data. So it is a real option too, but for your use case I’d still lean PostHog or Amplitude first because you want a tighter all-in-one workflow around funnels, replay, experimentation, and release control.

The practical setup I’d recommend is:

Vercel Web Analytics + Speed Insights for lightweight baseline page/perf visibility on the Vercel side.

PostHog for product analytics, funnel tracking, replay, heatmaps, feature flags, and experiments.

Optional later: route data into a warehouse/CDP if you grow into serious BI/reporting needs.

That gives you speed now and avoids locking yourself into only infra-level analytics. Vercel explicitly tracks page views and custom events, and can break analytics down by feature flags, but it is not a replacement for full product analytics and session replay.

For your actual funnel, I would track events like:

landing page viewed

registration form started

registration submitted

registration failed

webinar room entered

webinar watched 25 / 50 / 75 / 95%

CTA shown

CTA clicked

booking page loaded

Calendly connected / unavailable / booking completed

exit before register

exit before CTA

replay/rage/dead click indicators

Those event-level metrics are what let you answer the questions that matter: “Which advisors’ pages convert best?”, “Which traffic sources produce real bookings?”, “Where in the webinar do people drop?”, and “Does a new page variation increase booked calls?” That’s the core of product analytics and experimentation rather than just raw web traffic stats.

One important note: because you’re in a wealth-advisor context, be thoughtful about privacy, consent, and masking. Session replay tools are powerful, but you should configure them to mask sensitive form fields and avoid capturing data you don’t need. The tooling supports this kind of controlled capture, but you want to design that up front rather than after launch.

My blunt recommendation:

Use PostHog as the main analytics system.
Keep Vercel Analytics on for lightweight infra/page visibility.
Do not build your own analytics backend right now.

That’s the highest-leverage setup for a funnel/webinar SaaS at your stage.

I can map out the exact event schema next — like the actual event names, properties, funnel dashboards, and replay filters you should create for register -> attend -> CTA -> booked call.
