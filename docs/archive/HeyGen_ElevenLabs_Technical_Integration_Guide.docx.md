

**AMPLIFIED ADVISORS**

**HeyGen \+ ElevenLabs**

Technical Integration Guide — API Endpoints, Parameters & Implementation

**Scope:** Complete technical reference for integrating HeyGen’s video generation API and ElevenLabs’ voice cloning API into the Growth OS. Covers authentication, avatar creation, voice cloning, template-based video generation, direct avatar video generation, status polling, webhooks, data models, rate limits, and all endpoint parameters with sample requests.

|  |  |
| :---- | :---- |
| Version | 1.0 |
| Date | March 2026 |
| Status | Developer Reference |
| HeyGen API | V2/V3 (New AI Studio) |
| HeyGen Base URL | https://api.heygen.com |
| ElevenLabs Base URL | https://api.elevenlabs.io |

*Confidential — For internal use only.*

# **1\. Architecture Overview**

This document covers the technical implementation of AI video generation for the Growth OS using two APIs working together: HeyGen for avatar video rendering and lip-sync, and ElevenLabs for voice cloning and speech synthesis. All endpoints, parameters, authentication flows, data models, and integration patterns are documented here.

## **System Architecture**

**Base URLs:**

* **HeyGen API:** https://api.heygen.com

* **ElevenLabs API:** https://api.elevenlabs.io

**Request Flow for Video Generation**

1\. Growth OS receives “Generate Video” request from advisor (approved script \+ format selection).

2\. OS retrieves advisor’s avatar\_id (HeyGen) and voice\_id (ElevenLabs) from our database.

3\. OS determines the correct HeyGen template\_id based on ad type and aspect ratio.

4\. OS calls GET /v3/template/{template\_id} to retrieve the template’s variable schema.

5\. OS maps the approved script sections to the template’s variable slots.

6\. OS calls POST /v2/template/{template\_id}/generate with avatar, ElevenLabs voice, and script variables.

7\. HeyGen renders the video (HeyGen handles ElevenLabs TTS internally using the voice\_id and elevenlabs\_settings we pass).

8\. OS polls GET /v1/video\_status.get?video\_id={id} until status \= completed.

9\. OS downloads the video from the returned URL and stores it in our storage.

10\. Video appears in the Content Studio for advisor review.

| Key Insight: HeyGen Handles ElevenLabs Internally When we pass an ElevenLabs voice\_id and elevenlabs\_settings to HeyGen’s API, HeyGen calls ElevenLabs internally to generate the speech audio, then renders the avatar video with that audio and handles all lip-sync. We do NOT need to call ElevenLabs TTS separately and then upload audio to HeyGen. The only direct ElevenLabs API call we make is the one-time voice clone creation. |
| :---- |

# **2\. Authentication**

## **HeyGen Authentication**

HeyGen supports two auth methods. For our integration:

| Method | How | When to Use |
| :---- | :---- | :---- |
| API Key | Header: X-Api-Key: {key} | Direct API calls (video generation, avatars, templates). This is our primary auth method. |
| OAuth 2.0 | Standard OAuth flow with tokens | If we build a HeyGen Marketplace app. Not needed for MVP. |

API Key location: HeyGen Dashboard → Settings → API. Store encrypted in our database as a platform-level secret (not per-advisor).

| Billing Model HeyGen API uses a credit balance system separate from the web plan subscription. API credits are purchased via the API dashboard at https://app.heygen.com/avatar?from=avatar\&nav=API. Monitor balance programmatically and alert when credits are low. |
| :---- |

## **ElevenLabs Authentication**

All requests use an API key in the header:

xi-api-key: {your\_elevenlabs\_api\_key}

API Key location: ElevenLabs Dashboard → Profile → API Keys. Store encrypted as a platform-level secret.

| ElevenLabs Key Permissions for HeyGen Integration When the advisor’s cloned voice is used inside HeyGen, HeyGen calls ElevenLabs using THEIR OWN key (configured in the HeyGen platform or passed via API). For the API integration, we pass the ElevenLabs voice\_id to HeyGen and HeyGen handles the rest. Make sure to enable the necessary permissions on the ElevenLabs API key: voices, text-to-speech, and voice cloning scopes. |
| :---- |

[HeyGen: Authentication Methods](https://docs.heygen.com/docs/authentication-methods)

[HeyGen: API Key Setup](https://docs.heygen.com/docs/api-key)

[HeyGen: OAuth 2.0 (if needed later)](https://docs.heygen.com/docs/connecting-your-app-to-heygen-with-oauth-20)

[HeyGen: Limits & Credit Pricing](https://docs.heygen.com/reference/limits)

[ElevenLabs: API Reference](https://elevenlabs.io/docs/api-reference)

[ElevenLabs: API Key Setup](https://elevenlabs.io/developers)

# **3\. ElevenLabs — Voice Cloning (One-Time Per Advisor)**

## **Step 1: Record Voice Sample**

The advisor records a 30–60 second voice sample in the Growth OS. The OS provides a pre-written paragraph designed to capture natural cadence, tone, and range. The recording is captured via the browser’s MediaRecorder API and stored as an MP3 or WAV file.

## **Step 2: Create Instant Voice Clone**

**Endpoint: POST https://api.elevenlabs.io/v1/voices/add**

Content-Type: multipart/form-data

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| name | string | Yes | "David Mitchell — Cornerstone Wealth Partners" |
| files | file(s) | Yes | The voice sample audio file(s). MP3, WAV, or M4A. Multiple files improve quality. |
| description | string | No | "Advisor voice clone for Growth OS video generation" |
| labels | JSON string | No | {"firm\_id":"xxx","type":"advisor\_clone","environment":"production"} |
| remove\_background\_noise | boolean | No | true — recommended. Cleans the sample before cloning. |

Response includes the voice\_id. Store this in our advisor\_voices table linked to firm\_id.

**Sample cURL**

curl \-X POST https://api.elevenlabs.io/v1/voices/add \\

  \-H "xi-api-key: $ELEVENLABS\_API\_KEY" \\

  \-F "name=David Mitchell \- Cornerstone Wealth" \\

  \-F "files=@/path/to/voice\_sample.mp3" \\

  \-F "description=Advisor voice clone" \\

  \-F "remove\_background\_noise=true"

## **Step 3: Verify Clone Quality**

**Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice\_id}**

Generate a short test clip for the advisor to preview and confirm their cloned voice sounds acceptable.

| Parameter | Type | Notes |
| :---- | :---- | :---- |
| text | string | A short preview sentence: "Hi, I’m David Mitchell. Welcome to this training on retirement planning." |
| model\_id | string | "eleven\_multilingual\_v2" or "eleven\_flash\_v2\_5" for faster preview |
| voice\_settings.stability | float | 0.5 for natural variation, 1.0 for consistent narration |
| voice\_settings.similarity\_boost | float | 0.75 recommended for cloned voices |

## **Step 4: Get Voice ID for HeyGen**

Once the advisor approves their voice, we need the voice\_id to pass to HeyGen. List voices to verify:

**Endpoint: GET https://api.elevenlabs.io/v1/voices**

Returns all voices in the account, including cloned voices. Filter by labels to find advisor-specific clones.

[ElevenLabs: Create IVC Voice (Clone)](https://elevenlabs.io/docs/api-reference/voices/ivc/create)

[ElevenLabs: Voice Cloning Overview](https://elevenlabs.io/docs/creative-platform/voices/voice-cloning)

[ElevenLabs: Instant Voice Cloning Quickstart](https://elevenlabs.io/docs/developers/guides/cookbooks/voices/instant-voice-cloning)

[ElevenLabs: Text-to-Speech API](https://elevenlabs.io/docs/api-reference)

# **4\. HeyGen — Avatar Creation (One-Time Per Advisor)**

## **Two Avatar Types**

| Type | Source Material | Quality | API Availability | Our Recommendation |
| :---- | :---- | :---- | :---- | :---- |
| Photo Avatar | 1–3 static photos | Good — Avatar IV motion from photos | Available on all API plans | Use for MVP. Lower barrier for advisors (just upload photos). |
| Digital Twin | 2+ minute training video \+ consent video | Best — highest fidelity motion and expressions | Enterprise API plans only | Use when advisor can provide video. Superior quality for premium feel. |

## **Path A: Photo Avatar (MVP)**

**Upload Photo Asset**

**Endpoint: POST https://api.heygen.com/v1/asset**

Upload the advisor’s photo. Returns an asset\_id.

**Generate Photo Avatar**

**Endpoint: POST https://api.heygen.com/v1/photo\_avatar/generate**

Creates an avatar from the uploaded photo. Use with Avatar IV engine for best motion quality.

**Train Photo Avatar (Optional — Higher Quality)**

**Endpoint: POST https://api.heygen.com/v1/photo\_avatar/train**

Trains a photo avatar group for consistent results across multiple generations. Takes longer but produces better consistency.

## **Path B: Digital Twin (Premium)**

**Prerequisites**

* **Training footage:** MP4, at least 2 minutes, 720p or higher. Clear, well-lit, person speaking naturally to camera.

* **Consent video:** MP4 of the person explicitly granting HeyGen permission to create their avatar. Required for compliance.

* **Both files must be uploaded to publicly accessible URLs** (S3, GCS, or Supabase Storage with signed URLs).

**Create Digital Twin**

**Endpoint: POST https://api.heygen.com/v2/video\_avatar**

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| training\_footage\_url | string | Yes | Public URL to the training video MP4 |
| video\_consent\_url | string | Yes | Public URL to the consent video MP4 |
| avatar\_name | string | Yes | "David Mitchell — Cornerstone Wealth" |

Returns avatar\_id. Training takes several hours. Poll for status:

**Endpoint: GET https://api.heygen.com/v2/video\_avatar/{avatar\_id}**

Status values: in\_progress, complete, failed.

## **List All Avatars**

**Endpoint: GET https://api.heygen.com/v2/avatars**

Returns all avatars including stock avatars and custom instant avatars. Filter by avatar\_type to find the advisor’s custom avatar. Store the avatar\_id in advisor\_avatars table.

[HeyGen: Photo Avatar API](https://docs.heygen.com/docs/photo-avatars-api)

[HeyGen: Digital Twin API](https://docs.heygen.com/docs/video-avatars-api)

[HeyGen: Generate Photo Avatar Photos](https://docs.heygen.com/reference/generate-photo-avatar-photos)

[HeyGen: Create Digital Twin](https://docs.heygen.com/reference/submit-video-avatar-creation-request)

[HeyGen: Train Photo Avatar Groups](https://docs.heygen.com/docs/create-and-train-photo-avatar-groups)

[HeyGen: List All Avatars](https://docs.heygen.com/reference/list-avatars-v2)

[HeyGen: Digital Twin Guide (Help Center)](https://help.heygen.com/en/articles/12089286-create-your-first-digital-twin-video-avatar-with-avatar-iv)

# **5\. Video Generation — Two Methods**

## **Method 1: Avatar Video API (Direct Script → Video)**

Use when: generating a simple talking-head video from a single script without multi-scene structure, transitions, or text overlays.

**Endpoint: POST https://api.heygen.com/v2/video/generate**

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| video\_inputs\[\].character.type | string | Yes | "avatar" |
| video\_inputs\[\].character.avatar\_id | string | Yes | The advisor’s avatar\_id |
| video\_inputs\[\].character.avatar\_style | string | No | "normal" (default), "circle", "closeUp" |
| video\_inputs\[\].voice.type | string | Yes | "text" for TTS, "audio" for pre-recorded audio |
| video\_inputs\[\].voice.input\_text | string | Conditional | The script text. Required when type \= "text". Max 5,000 chars. |
| video\_inputs\[\].voice.voice\_id | string | Yes | The ElevenLabs cloned voice\_id |
| video\_inputs\[\].voice.speed | float | No | Speech speed. 0.5–1.5. Default 1.0. |
| video\_inputs\[\].voice.pitch | float | No | Voice pitch adjustment. |
| video\_inputs\[\].voice.emotion | string | No | "Excited", "Friendly", "Serious", "Soothing" |
| video\_inputs\[\].voice.elevenlabs\_settings.stability | float | No | 0, 0.5, or 1.0. Default 1.0. Controls voice consistency. |
| video\_inputs\[\].voice.elevenlabs\_settings.model\_id | string | No | "eleven\_multilingual\_v2" or "eleven\_v3" (recommended) |
| video\_inputs\[\].background.type | string | No | "color", "image", "video" |
| video\_inputs\[\].background.value | string | No | Hex color, image URL, or video URL |
| dimension.width | int | No | 1920 (1080p), 1080 (9:16 vertical), 1080 (1:1 square) |
| dimension.height | int | No | 1080, 1920, or 1080 respectively |
| caption | boolean | No | true — auto-generate captions. Critical for muted playback. |
| title | string | No | Internal title for tracking. |
| test | boolean | No | true \= no credits consumed. Use for development. |

**Avatar IV Endpoint (Newest — Best Quality)**

**Endpoint: POST https://api.heygen.com/v2/video/av4/generate**

Dedicated Avatar IV endpoint for highest-quality photorealistic output. Same parameter structure as above but uses the latest rendering engine. Use this when available.

**Sample cURL — Direct Avatar Video**

curl \-X POST https://api.heygen.com/v2/video/generate \\

  \-H "X-Api-Key: $HEYGEN\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "test": true,

    "caption": true,

    "title": "Tax Time Bomb Ad \- David Mitchell",

    "dimension": { "width": 1080, "height": 1920 },

    "video\_inputs": \[{

      "character": {

        "type": "avatar",

        "avatar\_id": "advisor\_avatar\_id\_here"

      },

      "voice": {

        "type": "text",

        "input\_text": "Most retirees think their biggest risk is the stock market...",

        "voice\_id": "elevenlabs\_voice\_id\_here",

        "speed": 1.0,

        "emotion": "Friendly",

        "elevenlabs\_settings": {

          "stability": 1.0,

          "model\_id": "eleven\_multilingual\_v2"

        }

      },

      "background": {

        "type": "color",

        "value": "\#f5f5f5"

      }

    }\]

  }'

## **Method 2: Template API (Structured Multi-Scene Videos)**

Use when: generating ads with multiple scenes, transitions, text overlays, branded elements, and consistent editing structure. This is the PRIMARY method for production ads.

| Template API \= Governed Video Production Templates are built once in HeyGen’s web editor by Amplified’s team following the video SOP. They define scene count, timing, transitions, text overlays, backgrounds, avatar positioning. The API ONLY fills in the content (script text, avatar, voice). The advisor gets a consistently professional video every time. This is the same governance pattern as GHL Custom Values. |
| :---- |

**Step 1: List Available Templates**

**Endpoint: GET https://api.heygen.com/v2/templates**

Returns all templates. Each has a template\_id and name. Our system maps template names to ad types.

**Step 2: Get Template Variable Schema**

**Endpoint: GET https://api.heygen.com/v3/template/{template\_id}**

Returns the complete variable schema: which scenes exist, what variables each scene accepts (script text, images, text overlays), and the structure. Parse this to know which variables to fill.

**Example response structure:**

{

  "variables": {

    "hook\_script": { "name": "hook\_script", "type": "text", "properties": { "content": "" } },

    "relate\_script": { "name": "relate\_script", "type": "text", "properties": { "content": "" } },

    "stat\_text": { "name": "stat\_text", "type": "text", "properties": { "content": "" } },

    "advisor\_name": { "name": "advisor\_name", "type": "text", "properties": { "content": "" } }

  },

  "scenes": \[

    { "id": "scene\_1", "script": "", "variables": { "hook\_script": "hook\_script" } },

    { "id": "scene\_2", "script": "", "variables": { "relate\_script": "relate\_script" } }

  \]

}

**Step 3: Generate Video from Template**

**Endpoint: POST https://api.heygen.com/v2/template/{template\_id}/generate**

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| test | boolean | No | true \= no credits consumed |
| caption | boolean | No | true — always enable for Meta ads |
| title | string | No | "\[Ad Name\] — \[Advisor\] — \[Format\]" |
| variables.{variable\_name}.name | string | Yes | Must match the variable name from the template schema |
| variables.{variable\_name}.type | string | Yes | "text", "image", "video", "audio", "avatar" |
| variables.{variable\_name}.properties.content | string | Conditional | The script text content (for text variables) |
| variables.{variable\_name}.properties.url | string | Conditional | Image/video URL (for media variables) |
| variables.{variable\_name}.properties.voice\_id | string | Conditional | ElevenLabs voice\_id (for script/voice replacement) |

**Sample cURL — Template Video**

curl \-X POST https://api.heygen.com/v2/template/TEMPLATE\_ID/generate \\

  \-H "X-Api-Key: $HEYGEN\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "test": false,

    "caption": true,

    "title": "Tax Time Bomb — David Mitchell — Reel 9:16",

    "variables": {

      "hook\_script": {

        "name": "hook\_script", "type": "text",

        "properties": { "content": "Most retirees think their biggest risk is..." }

      },

      "relate\_script": {

        "name": "relate\_script", "type": "text",

        "properties": { "content": "If you have been saving into a 401k..." }

      },

      "advisor\_name": {

        "name": "advisor\_name", "type": "text",

        "properties": { "content": "David Mitchell, CFP, CPA" }

      }

    }

  }'

| Template Guidelines Scripts must be contained within a scene, or scenes must be contained within a script. Failing this alignment causes the error: “End of scene 1 does not align with script.” When building templates in HeyGen’s editor, ensure each scene has its own script section. Script text per scene must be under 5,000 characters. |
| :---- |

[HeyGen: Generate Video Quick Start](https://docs.heygen.com/docs/create-video)

[HeyGen: Create Avatar Video V2 (API Reference)](https://docs.heygen.com/reference/create-an-avatar-video-v2)

[HeyGen: Create Avatar IV Video](https://docs.heygen.com/reference/create-avatar-iv-video)

[HeyGen: Generate Video from Template V3](https://docs.heygen.com/docs/generate-video-from-template-v3)

[HeyGen: Replace Text/Voice in Template](https://docs.heygen.com/docs/replace-textvoice-in-template)

[HeyGen: Replace Avatar in Template](https://docs.heygen.com/docs/replace-avatar-in-template-1)

[HeyGen: Replace Image in Template](https://docs.heygen.com/docs/replace-image-in-template-1)

[HeyGen: Replace Audio in Template](https://docs.heygen.com/docs/replace-audio-in-template-1)

[HeyGen: Template Guidelines](https://docs.heygen.com/docs/generate-video-from-template-v2-1)

[HeyGen: Python Tutorial — Multi-Scene Template](https://docs.heygen.com/docs/guide-simple-python-app-for-generating-videos-from-heygen-templates)

[HeyGen: Video Playback Styles in Template](https://docs.heygen.com/docs/video-playback-styles-in-template)

[HeyGen: Customize Video Background](https://docs.heygen.com/docs/customize-video-background)

[HeyGen: Using Audio Source as Voice](https://docs.heygen.com/docs/using-audio-source-as-voice)

# **6\. Video Status, Retrieval & Webhooks**

## **Polling for Video Status**

**Endpoint: GET https://api.heygen.com/v1/video\_status.get?video\_id={video\_id}**

| Status | Meaning | Action |
| :---- | :---- | :---- |
| pending | Queued, waiting to start | Continue polling. Interval: 10 seconds. |
| waiting | In waiting state | Continue polling. |
| processing | Currently rendering | Continue polling. Typical render time: 1–5 minutes. |
| completed | Ready for download | Download video from returned video\_url. Store in our storage. |
| failed | Rendering error | Log error details. Check if duration exceeds plan limits or script was malformed. Notify advisor. |

| Video URLs Expire in 7 Days The video\_url returned in the completed response expires after 7 days. Download and store the video in our own storage (Supabase Storage or S3) immediately upon completion. Do not rely on HeyGen’s hosted URL as a permanent link. |
| :---- |

## **Webhook Events (Alternative to Polling)**

Instead of polling, HeyGen can send webhook notifications when video status changes. This is more efficient for production.

Configure webhook URL in HeyGen Dashboard or via API. Relevant events:

* **avatar\_video.success:** Video generation completed successfully. Payload includes video\_id and video\_url.

* **avatar\_video.fail:** Video generation failed. Payload includes video\_id and error details.

* **avatar\_video.progress:** Progress update during rendering.

[HeyGen: Webhook Events](https://docs.heygen.com/docs/using-heygens-webhook-events)

[HeyGen: Write Webhook Endpoint](https://docs.heygen.com/docs/write-your-endpoint-to-process-webhook-events)

[HeyGen: Retrieve Video Status](https://docs.heygen.com/reference/video-status)

# **7\. Video Agent (One-Shot Generation)**

HeyGen’s Video Agent is a newer “one-prompt” endpoint that generates a complete video from a natural language description. No avatar or template selection needed — the AI handles everything.

**Endpoint: POST https://api.heygen.com/v1/video\_agent/generate**

| Parameter | Type | Notes |
| :---- | :---- | :---- |
| prompt | string | Natural language description of the desired video |

This could be useful for quick-turnaround content (social media clips, announcement videos) where the full template workflow is overkill. Consider as a future feature — not part of the primary ad generation pipeline, which needs the consistency and governance of templates.

[HeyGen: Video Agent Documentation](https://docs.heygen.com/docs/overview-video-agent)

[HeyGen: Video Agent API Reference](https://docs.heygen.com/reference/generate-video-agent)

# **8\. HeyGen MCP Server (AI Agent Integration)**

HeyGen offers an MCP (Model Context Protocol) server that allows AI agents (like Claude) to interact with HeyGen directly. This is a future integration point for the Growth OS — an AI agent in the OS could generate videos conversationally.

The MCP server uses OAuth authentication (separate from the API key flow) and bills against the web plan \+ premium credits.

[HeyGen: Remote MCP Server](https://docs.heygen.com/docs/heygen-remote-mcp-server)

[HeyGen: Skills for Claude Code](https://docs.heygen.com/docs/heygen-skills-for-claude-code)

# **9\. Database Tables**

| Table | Key Fields | Purpose |
| :---- | :---- | :---- |
| advisor\_avatars | id, firm\_id, heygen\_avatar\_id, avatar\_type (photo/digital\_twin), source\_asset\_url, consent\_video\_url (for DT), status (pending/training/active/failed), created\_at | Stores each advisor’s HeyGen avatar. One active avatar per firm. |
| advisor\_voices | id, firm\_id, elevenlabs\_voice\_id, voice\_name, sample\_audio\_url, model\_id (eleven\_v3/eleven\_multilingual\_v2), stability\_setting, status (active/inactive), created\_at | Stores each advisor’s ElevenLabs cloned voice. |
| video\_templates | id, heygen\_template\_id, name, ad\_type (ugc\_4scene/educational\_5scene/quick\_hit/testimonial/webinar\_promo), aspect\_ratio (9:16/1:1/16:9), scene\_count, variable\_schema (JSON), is\_active, created\_at, updated\_at | Maps Amplified’s templates to ad types. System-level table (not per-firm). |
| generated\_videos | id, firm\_id, campaign\_id, asset\_id (FK to Content Studio script), template\_id (FK), heygen\_video\_id, generation\_method (template/direct/agent), status (pending/processing/completed/failed/approved/rejected), video\_url (our storage), thumbnail\_url, duration\_seconds, aspect\_ratio, captions\_enabled, test\_mode, created\_at, completed\_at, approved\_at | Every generated video linked to its source script, campaign, and template. |
| video\_generation\_log | id, generated\_video\_id (FK), request\_type (avatar\_create/voice\_clone/video\_generate/status\_poll), endpoint\_called, request\_payload (JSON), response\_payload (JSON), http\_status, credits\_consumed, latency\_ms, created\_at | Full audit trail of every API call to HeyGen and ElevenLabs. For debugging and cost analysis. |

# **10\. Rate Limits, Costs & Gotchas**

## **HeyGen Limits**

* **Script text:** 5,000 characters max per scene/input.

* **Video duration:** Plan-dependent. Check plan limits. Exceeding causes “failed” status.

* **Resolution:** Free API plan \= 720p max. Paid plans support 1080p. Default is now 1080p on paid plans.

* **Concurrent generation:** Plan-dependent. Queue requests if hitting limits.

* **Video URL expiry:** 7 days. Download immediately on completion.

* **Credit consumption:** 1 API credit \= 1 minute of video. Varies by avatar type and features.

## **ElevenLabs Limits**

* **Character limits:** Plan-dependent. Starter: 30K chars/month. Scale plans: much higher.

* **Voice clones:** Plan-dependent. Most plans allow 10–30 instant clones.

* **Rate limits:** 429 errors \= throttled. Implement exponential backoff.

* **Commercial license:** Requires paid plan. Free tier is non-commercial.

## **Common Gotchas**

* **HeyGen templates must be created in the web editor.** No API for template creation. Plan template building as a manual Amplified task.

* **Template scripts must align with scenes.** If a script spans multiple scenes, it must be contained within those scenes. Misalignment causes the “End of scene does not align” error.

* **ElevenLabs API key permissions.** When integrating with HeyGen, the ElevenLabs key must have voices, text-to-speech, and voice cloning permissions enabled. “Invalid API key” errors usually mean permissions are restricted.

* **Voice clone quality \= sample quality.** Bad recording in \= bad voice out. Provide advisors with clear recording instructions: quiet room, close to mic, natural pace, no background noise.

* **Test mode is your best friend.** Pass test: true during development. No credits consumed. Remove for production.

* **Avatar IV is not available on all plans.** Digital Twin creation is Enterprise-only. Photo avatars with Avatar IV motion are more broadly available. Confirm plan access before building.

* **HeyGen V2 vs V3 template APIs.** V2 template endpoints correspond to Legacy AI Studio and will be deprecated. Build against V3 (GET /v3/template/{id}) for the new AI Studio. The generation endpoint (POST /v2/template/{id}/generate) still works for both.

[HeyGen: API Limits & Credit Costs](https://docs.heygen.com/reference/limits)

[HeyGen: Postman Collection](https://docs.heygen.com/reference/postman-collections)

[HeyGen: Full API Reference](https://docs.heygen.com/reference)

[HeyGen: Changelog (Stay Current)](https://docs.heygen.com/changelog)

[HeyGen: Developer Discussions](https://docs.heygen.com/discuss)