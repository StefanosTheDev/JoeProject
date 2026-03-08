

**AMPLIFIED ADVISORS**

**GoHighLevel Integration**

Developer Guide — API Reference, Custom Values Strategy & Build Plan dsfsd

**Scope:** Complete integration guide for connecting the Growth OS to GoHighLevel. Covers the Custom Values content injection strategy, Contacts/Calendar/Pipeline sync, Webhooks for real-time events, Snapshot deployment automation, and MCP server for AI agent operations.

|  |  |
| :---- | :---- |
| Version | 1.0 |
| Date | March 2026 |
| Status | Developer Reference |
| GHL API Version | V2 (OAuth 2.0) |
| Base URL | https://services.leadconnectorhq.com |

*Confidential — For internal use only.*

# **1\. Overview: What We’re Building with GHL**

GoHighLevel (GHL) is the execution engine our advisors use for funnels, automations, SMS/email sending, calendars, and CRM. The Growth OS does not replace GHL — it governs what goes into GHL and automates the setup, configuration, and content injection. This document covers every API endpoint, integration pattern, and data structure needed to connect the Growth OS to GHL.

## **The Core Strategy: Custom Values as Content Variables**

| This Is the Most Important Concept in This Document GHL’s Workflows API does NOT allow editing the text content inside workflow actions (SMS body, email body, etc.) via API. Instead, we build all Amplified snapshots so that every message action references Custom Values instead of hardcoded text. Example: the SMS body says {{custom.sms\_new\_lead\_msg\_1}} instead of actual copy. The Growth OS then uses the API to update those Custom Values with the approved copy from the Content Studio. The advisor never touches GHL to update content — they approve it in the OS and it flows through automatically. |
| :---- |

This approach gives us three things: the advisor can’t go off-script (governance), content updates don’t require rebuilding workflows (efficiency), and the Growth OS is always the source of truth for messaging (consistency).

## **What We Use GHL For (and What the OS Controls)**

| Function | Lives in GHL | Controlled by Growth OS |
| :---- | :---- | :---- |
| Funnel pages (landing, registration, webinar, booking) | Yes — hosted in GHL | Copy injected via Custom Values. Structure via snapshots. |
| Email/SMS sequences (nurture, confirmation, no-show, drip) | Yes — workflows send messages | Message content injected via Custom Values. Timing/structure via snapshots. |
| Calendar/booking | Yes — GHL calendars | Calendar config via API. Booking data pulled into OS for attribution. |
| Contact/lead management | Yes — GHL CRM | Contacts created/tagged via API with UTM data from Meta campaigns. |
| Pipeline/opportunities | Yes — GHL pipelines | Opportunity stages synced to OS attribution ledger. |
| Phone numbers / Twilio | Yes — GHL handles sending | Not controlled by OS. Standard GHL setup. |

## **Documentation Links — Bookmark These**

[GHL Developer Marketplace & API Docs (Main Hub)](https://marketplace.gohighlevel.com/docs/)

[Getting Started Guide](https://marketplace.gohighlevel.com/docs/oauth/GettingStarted/index.html)

[OAuth 2.0 Authorization](https://marketplace.gohighlevel.com/docs/Authorization/authorization_doc)

[Agency vs Sub-Account (Architecture)](https://marketplace.gohighlevel.com/docs/oauth/AgencyVsSubAccount)

[Contacts API](https://marketplace.gohighlevel.com/docs/ghl/contacts/contacts-api)

[Conversations API (Messaging)](https://marketplace.gohighlevel.com/docs/ghl/conversations/conversations-api)

[Calendars API](https://marketplace.gohighlevel.com/docs/ghl/calendars/calendars-api)

[Campaigns API](https://marketplace.gohighlevel.com/docs/ghl/campaigns/campaigns-api)

[Custom Fields V2 API](https://marketplace.gohighlevel.com/docs/ghl/custom-fields/custom-fields-v-2-api)

[Sub-Account (Location) API — Custom Values live here](https://marketplace.gohighlevel.com/docs/ghl/locations/sub-account-formerly-location-api)

[Update Custom Value Endpoint](https://marketplace.gohighlevel.com/docs/ghl/locations/update-custom-value/index.html)

[Funnels API](https://marketplace.gohighlevel.com/docs/ghl/funnels/funnels-api)

[Opportunities API (Pipeline)](https://marketplace.gohighlevel.com/docs/ghl/opportunities/opportunities-api)

[Workflows API](https://marketplace.gohighlevel.com/docs/ghl/workflows/workflows-api)

[Snapshots API](https://marketplace.gohighlevel.com/docs/ghl/snapshots/snapshots-api)

[Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide)

[MCP Server Documentation](https://marketplace.gohighlevel.com/docs/other/mcp/index.html)

[SDK Overview](https://marketplace.gohighlevel.com/docs/sdk/GettingStartedSDK)

[GitHub: Official API Docs (OpenAPI Specs)](https://github.com/GoHighLevel/highlevel-api-docs)

[GitHub: Community GHL MCP Server (269+ tools)](https://github.com/mastanley13/GoHighLevel-MCP)

[GHL Developer Slack Community](https://developers.gohighlevel.com/join-dev-community)

[GHL API Feature Requests](https://ideas.gohighlevel.com/apis)

# **2\. Authentication & Connection Setup**

## **Two Auth Methods**

| Method | Best For | Token Lifetime | Our Use Case |
| :---- | :---- | :---- | :---- |
| OAuth 2.0 (Marketplace App) | Multi-account apps managing multiple sub-accounts | Access token: 24 hours. Refresh token: long-lived. | Primary method. Each advisor connects their GHL sub-account to the Growth OS via OAuth. |
| Private Integration Token (PIT) | Single-account internal tools | Does not expire (but can be revoked) | Use for development, testing, and MCP server connections. |

## **OAuth 2.0 Flow (How Advisors Connect)**

* Register at marketplace.gohighlevel.com and create a Marketplace App.

* Configure the app: set redirect URI to our callback URL, add required scopes (see below), set webhook delivery URL.

* Advisor clicks “Connect HighLevel” in the Growth OS settings.

* Redirected to GHL authorization page → selects their sub-account (location) → approves.

* GHL returns an authorization code to our redirect URI.

* Exchange code for access\_token \+ refresh\_token via POST to https://services.leadconnectorhq.com/oauth/token

* Store tokens encrypted in database linked to firm\_id. The locationId returned in the token response is the sub-account ID — store this too.

| Critical: Access Tokens Expire Every 24 Hours GHL access tokens only last 24 hours. You MUST implement automatic token refresh using the refresh\_token. Build a scheduled job that refreshes tokens proactively (every 20 hours) rather than waiting for a 401 error. If the refresh fails, alert the advisor to re-connect. Every API call should check token freshness first. |
| :---- |

## **Required Scopes**

| Scope | What It Grants | Needed For |
| :---- | :---- | :---- |
| contacts.readonly | Read contacts, search, get by ID | Syncing lead data to attribution ledger |
| contacts.write | Create, update, delete contacts. Manage tags. | Creating leads from Meta campaigns, applying UTM tags |
| locations.readonly | Read sub-account info | Verifying connection, getting location config |
| locations/customValues.readonly | Read Custom Values | Reading current message content in GHL |
| locations/customValues.write | Create and update Custom Values | THE CORE FUNCTION: Pushing approved copy from Content Studio into GHL |
| locations/customFields.readonly | Read Custom Fields | Reading contact field definitions |
| locations/customFields.write | Create and update Custom Fields | Not requested in OAuth (Marketplace may reject as invalid scope). Create UTM/custom fields in GHL UI if needed. |
| calendars.readonly | Read calendar data | Pulling appointment data for attribution |
| calendars/events.readonly | Read calendar events/appointments | Syncing booked calls to the OS ledger |
| conversations.readonly | Read conversations and messages | Monitoring message delivery status |
| conversations/message.write | Send messages | Sending direct messages if needed (outside workflows) |
| workflows.readonly | Read workflows and their status | Monitoring which workflows are active, getting workflow IDs |
| opportunities.readonly | Read opportunities/pipeline | Syncing pipeline stage data to attribution ledger |
| opportunities.write | Create/update opportunities | Creating opportunities when leads book calls |
| campaigns.readonly | Read campaign data | Monitoring GHL campaign status |
| funnels/funnel.readonly | Read funnel data | List funnels, verify deployment |
| funnels/page.readonly | Read funnel page data | List funnel pages, verify page structure |
| snapshots.readonly | Read snapshots | Listing available Amplified snapshots for deployment |

### **Marketplace App Setup (Lockstep Checklist)**

Do this in [marketplace.gohighlevel.com](https://marketplace.gohighlevel.com) → your app → **Advanced Settings** → **Auth**.

1. **Redirect URL**  
   Add exactly one URL (must match backend). Example:  
   `http://localhost:8000/api/connect/oauth/callback`  
   For production, use your backend base URL + `/api/connect/oauth/callback`.  
   **Note:** Do not use paths containing "ghl" or "highlevel"—the Marketplace rejects them. We use `/api/connect/oauth/callback` for this reason.  
   Save.

2. **Scopes**  
   In the Auth section, add every scope from the “Required Scopes” table above. The backend sends these when building the connect URL; the Marketplace app must have them enabled or the token will not include the permissions. Copy this list into the Marketplace “Select Scope” / add-scopes UI (one by one or as allowed):

   - `contacts.readonly`
   - `contacts.write`
   - `locations.readonly`
   - `locations/customValues.readonly`
   - `locations/customValues.write`
   - `locations/customFields.readonly`
   - *(Do not add `locations/customFields.write` — Marketplace may return "Invalid scope(s)".)*
   - `calendars.readonly`
   - `calendars/events.readonly`
   - `conversations.readonly`
   - `conversations/message.write`
   - `workflows.readonly`
   - `opportunities.readonly`
   - `opportunities.write`
   - `campaigns.readonly`
   - `funnels/funnel.readonly`
   - `funnels/page.readonly`
   - `snapshots.readonly`

   Save.

3. **Client Keys**  
   In the Client Keys section: **Add** (or “Create client key”), give a name (e.g. “Amplify OS”).  
   Copy **Client ID** and **Client Secret** immediately — the secret is shown only once.  
   Store in backend `.env` (see below).

4. **Backend `.env`**  
   In the project’s `backend/.env` add (replace with your values):

   ```
   GHL_CLIENT_ID=<paste Client ID from Marketplace>
   GHL_CLIENT_SECRET=<paste Client Secret from Marketplace>
   GHL_REDIRECT_URI=http://localhost:8000/api/connect/oauth/callback
   GHL_VERSION_ID=<optional; for DRAFT apps copy from Install Link URL (version_id=...)>
   GHL_WHITELABEL_INSTALL=<optional; set to 1 or true to use Whitelabel install host (marketplace.leadconnectorhq.com). Omit or false = Standard (marketplace.gohighlevel.com)>
   ```

   `GHL_REDIRECT_URI` must match the Redirect URL you added in step 1 exactly.  
   **Draft apps:** If you get an "AppVersion ID" error when opening the connect link (e.g. in a new browser), add `GHL_VERSION_ID` with the value from the Install Link URL (Auth → Show Installation URLs).  
   **Standard vs Whitelabel:** On the same Auth page you get two Install Links — Standard (`marketplace.gohighlevel.com`) and Whitelabel (`marketplace.leadconnectorhq.com`). The backend uses Standard by default; set `GHL_WHITELABEL_INSTALL=true` to use the Whitelabel host. Client ID/Secret are the same for both (from the same Secrets section).

5. **Webhook delivery URL** (optional for Phase 1)  
   The doc mentions “set webhook delivery URL.” You can leave this blank until you implement webhooks (Phase 2+). When you do, set it to your single webhook endpoint (e.g. `https://your-api.com/api/connect/webhooks`)    and subscribe to the events you need.

### **Next steps — what to do now**

1. **Set `.env`**  
   In `backend/.env` ensure you have at least:  
   `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_REDIRECT_URI`.  
   For a **draft** app add `GHL_VERSION_ID` (from the Install Link; e.g. `69acc95c332a0a29f14623fd`).  
   Restart the backend after changing `.env`.

2. **Test the connection flow**  
   - Start the backend (e.g. `uvicorn app.main:app --host 127.0.0.1 --port 8000`).  
   - Get the OAuth URL: open  
     `http://localhost:8000/api/connect/oauth/url?firm_id=test-firm-1`  
     in the browser. You should get JSON with `"url": "https://marketplace.gohighlevel.com/oauth/chooselocation?..."`.  
   - Open that `url` in the same or a new browser. Log into GHL if needed, choose the sub-account (location) to connect, and approve.  
   - You should be redirected to the callback, then to the success page.  
   - Check that the connection was saved:  
     `http://localhost:8000/api/connect/connection?firm_id=test-firm-1`  
     should return `"connected": true` and a `location_id`.

3. **Use it in the app**  
   In Amplify OS, open **Deploy → HighLevel Setup**. Use **Connect to HighLevel** to start OAuth from the app; after connecting, the tab shows connected status and `location_id`. The backend then has a valid token to call GHL APIs (Custom Values, Contacts, etc.) for that firm.

4. **Later**  
   When you implement Custom Values updates, use `get_valid_access_token(pool, firm_id)` before each GHL API call so the backend refreshes the token if needed.

[Full Scopes Reference](https://marketplace.gohighlevel.com/docs/oauth/GettingStarted/index.html)

# **3\. Custom Values System (The Core Integration)**

## **How This Works End-to-End**

This is the most important section of this document. The entire GHL integration hinges on Custom Values as the bridge between the Growth OS Content Studio and GHL’s workflow execution.

* **Step 1:** Amplified builds GHL snapshots where every SMS, email, and funnel text block references a Custom Value (e.g., {{custom.sms\_nurture\_1}}) instead of hardcoded copy.

* **Step 2:** Advisor deploys the Amplified snapshot to their GHL sub-account (initially manual, later automated via Snapshots API).

* **Step 3:** Advisor goes through the Growth OS Content Studio and approves their email/SMS sequences.

* **Step 4:** When assets are approved, the Growth OS calls the GHL API to update the Custom Values in the advisor’s sub-account with the approved copy.

* **Step 5:** The GHL workflow fires as normal. When it hits the “Send SMS” action, it reads {{custom.sms\_nurture\_1}} and sends the approved content.

* **Step 6:** If the advisor later revises copy in the Content Studio and re-approves, the OS pushes the updated Custom Value. The workflow doesn’t change — it just reads the new value.

## **Custom Value Naming Convention**

Every Custom Value we create follows a strict naming convention so they’re organized and predictable:

| Pattern | Example | Used In |
| :---- | :---- | :---- |
| sms\_{sequence}\_{number} | sms\_nurture\_1, sms\_nurture\_2, sms\_noshow\_1 | SMS actions in workflows |
| email\_subject\_{sequence}\_{number} | email\_subject\_nurture\_1 | Email subject lines |
| email\_body\_{sequence}\_{number} | email\_body\_nurture\_1 | Email body content |
| funnel\_{page}\_{section} | funnel\_landing\_headline, funnel\_landing\_subhead, funnel\_landing\_cta | Funnel page text blocks |
| funnel\_{page}\_faq\_{number} | funnel\_landing\_faq\_1, funnel\_landing\_faq\_2 | FAQ sections on funnel pages |
| campaign\_utm\_source | campaign\_utm\_source | UTM parameter defaults |
| firm\_name | firm\_name | Firm name used across all templates |
| advisor\_name | advisor\_name | Advisor’s name for personalization |
| advisor\_credentials | advisor\_credentials | CFP®, CPA, etc. |
| booking\_link | booking\_link | Calendar booking URL |

## **API Endpoints for Custom Values**

**Base URL: https://services.leadconnectorhq.com**

**Get All Custom Values**

GET /locations/{locationId}/customValues

Returns all Custom Values for the sub-account. Use this on initial connection to verify which values exist and need to be created vs. updated.

**Create Custom Value**

POST /locations/{locationId}/customValues

Creates a new Custom Value. Use during snapshot deployment when the values don’t exist yet.

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| name | string | Yes | Display name (e.g., “SMS Nurture Message 1”) |
| value | string | Yes | The actual content (the approved copy from Content Studio) |

**Update Custom Value**

PUT /locations/{locationId}/customValues/{customValueId}

Updates an existing Custom Value. This is the primary endpoint — called every time an advisor approves or revises content in the Content Studio.

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| name | string | No | Update the display name if needed |
| value | string | Yes | The new content (updated approved copy) |

[Update Custom Value Endpoint](https://marketplace.gohighlevel.com/docs/ghl/locations/update-custom-value/index.html)

[Sub-Account (Location) API](https://marketplace.gohighlevel.com/docs/ghl/locations/sub-account-formerly-location-api)

**Delete Custom Value**

DELETE /locations/{locationId}/customValues/{customValueId}

Rarely used. Only for cleanup when a campaign is deleted from the OS.

| Implementation Pattern: Batch Update on Approval When an advisor approves a full sequence in the Content Studio (e.g., the 6-email nurture), the OS should batch all Custom Value updates in a single operation. For a 6-email sequence, that’s 12 API calls (6 subjects \+ 6 bodies). At GHL’s rate limit of 100 calls per 10 seconds, this completes instantly. Fire all updates, verify responses, then mark the GHL sync as complete in the OS. |
| :---- |

# **4\. Contacts API — Lead Sync & Attribution Tagging**

## **What We Use Contacts For**

When a lead comes in from a Meta ad campaign, the Growth OS creates or updates a contact in GHL with full attribution data. This connects the Meta ad spend to the GHL pipeline.

## **Key Endpoints**

**Create Contact**

POST /contacts/

| Field | Type | Maps From | Notes |
| :---- | :---- | :---- | :---- |
| locationId | string | Stored from OAuth connection | Required — the advisor’s sub-account |
| firstName | string | Lead form submission | From funnel registration |
| lastName | string | Lead form submission | From funnel registration |
| email | string | Lead form submission | Primary identifier |
| phone | string | Lead form submission | For SMS sequences |
| tags | array | Campaign data from OS | \[“webinar-registrant”, “campaign-tax-optimization”, “source-meta-paid”\] |
| source | string | UTM data | e.g., “Meta Ads” |
| customFields | array | Campaign \+ UTM data | See custom fields table below |

**Update Contact**

PUT /contacts/{contactId}

Used to update contact status, add tags, or modify custom fields as the lead progresses through the pipeline.

**Search Contacts**

POST /contacts/search

Search by email, phone, tag, or custom field value. Use this to check if a contact already exists before creating a duplicate. Also used to pull lead counts for the attribution dashboard.

**Update Tags (Bulk)**

POST /contacts/bulk/tags

Add or remove tags from multiple contacts at once. Useful for campaign-level operations.

## **Custom Fields We Create for Attribution**

| Field Name | Field Key | Type | Purpose |
| :---- | :---- | :---- | :---- |
| Campaign ID | campaign\_id | Text | Links contact to the Growth OS campaign record |
| Ad Creative ID | ad\_creative\_id | Text | Which specific ad brought this lead in |
| UTM Source | utm\_source | Text | meta, google, organic, referral, etc. |
| UTM Medium | utm\_medium | Text | paid, email, social, etc. |
| UTM Campaign | utm\_campaign | Text | Maps to the OS campaign name |
| UTM Content | utm\_content | Text | Maps to specific ad variation |
| Household ID | household\_id | Text | Links to the OS household entity for AUM tracking |
| Lead Score | lead\_score | Number | Calculated by the OS based on engagement |

[Contacts API Reference](https://marketplace.gohighlevel.com/docs/ghl/contacts/contacts-api)

[Create Contact](https://marketplace.gohighlevel.com/docs/ghl/contacts/create-contact/index.html)

[Update Contact](https://marketplace.gohighlevel.com/docs/ghl/contacts/update-contact/index.html)

[Custom Fields V2 API](https://marketplace.gohighlevel.com/docs/ghl/custom-fields/custom-fields-v-2-api)

# **5\. Calendars & Appointments — Booking Data Sync**

## **What We Pull Into the OS**

When an advisor’s prospect books a call through the GHL calendar, we need that data in the Growth OS for attribution tracking. The Calendars API \+ Webhooks give us real-time booking data.

**Get Calendar Events**

GET /calendars/events

Pull upcoming and past appointments. Filter by date range, calendar ID, or contact. Use for initial sync and periodic reconciliation.

**Webhooks (Real-Time)**

Instead of polling, use GHL webhooks for real-time appointment updates:

* **AppointmentCreate:** Fires when a new appointment is booked. Pull contact info, booking time, calendar used.

* **AppointmentUpdate:** Fires when appointment status changes (confirmed, rescheduled, cancelled).

* **AppointmentDelete:** Fires when appointment is deleted.

* **AppointmentNoShow:** Fires when marked as no-show. Triggers no-show recovery sequence.

Each webhook payload includes the contact ID, appointment details, and calendar ID. Map these to the OS attribution ledger: contact → household → campaign → appointment outcome.

[Calendars API](https://marketplace.gohighlevel.com/docs/ghl/calendars/calendars-api)

[Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide)

# **6\. Opportunities & Pipeline — Deal Tracking**

## **How Pipelines Map to Attribution**

GHL Opportunities represent deals moving through a sales pipeline. We use the Opportunities API to sync pipeline status into the Growth OS attribution ledger. The pipeline stages should map directly to our tracking funnel:

| Pipeline Stage (GHL) | OS Attribution Event | Action |
| :---- | :---- | :---- |
| New Lead | Lead captured | Created automatically when contact is added |
| Booked | Call booked | Moved when appointment is created (webhook) |
| Showed | Attended meeting | Moved by advisor or automation after call |
| 2nd Meeting Booked | Post-meeting follow-up | Moved by advisor |
| Proposal Meeting Booked | New Client Opportunity | Moved by advisor |
| Won / Closed | Client acquired | Triggers AUM event logging in OS |
| Lost | Did not close | Logs reason for attribution analysis |

## **Key Endpoints**

POST /opportunities/ — Create new opportunity when a lead enters the pipeline.

PUT /opportunities/{opportunityId} — Update stage, status, or monetary value.

GET /opportunities/search — Search by pipeline, stage, contact, or date range.

Use webhooks for real-time sync: OpportunityCreate, OpportunityStageUpdate, OpportunityStatusUpdate, OpportunityMonetaryValueUpdate.

[Opportunities API](https://marketplace.gohighlevel.com/docs/ghl/opportunities/opportunities-api)

# **7\. Snapshots — Automated Deployment**

## **What Snapshots Do For Us**

Amplified’s pre-built snapshots contain the entire campaign infrastructure: funnel pages, workflow automations, pipeline stages, calendar configs, email templates, and SMS templates. When an advisor is ready to deploy, we install the snapshot into their GHL sub-account. Initially this is manual; the Snapshots API enables automation.

**Get Snapshots**

GET /snapshots/ — List all available snapshots in the agency account. Use to present the advisor with the correct snapshot for their campaign type.

**Snapshot Deployment Flow**

* OS determines the correct snapshot based on the campaign’s offer archetype and channel.

* Present the advisor with a deployment preview showing what will be installed.

* On confirmation, deploy the snapshot to their sub-account.

* After deployment, immediately run the Custom Value push to populate all message content with their approved copy.

* Run a verification check: confirm all Custom Values are populated, all workflows are present, pipeline stages are correct.

* Mark deployment as complete in the OS.

[Snapshots API](https://marketplace.gohighlevel.com/docs/ghl/snapshots/snapshots-api)

# **8\. Funnels API — Page Content Injection**

## **How We Use Funnels**

The Funnels API lets us read funnel structure and page data. For MVP, funnel pages are deployed via snapshots with content injected through Custom Values (same pattern as workflows). The funnel page template contains {{custom.funnel\_landing\_headline}}, {{custom.funnel\_landing\_subhead}}, etc., and the OS pushes the approved funnel copy into those values.

**Get Funnels**

GET /funnels/ — List all funnels in the sub-account. Use to verify deployment.

**Get Funnel Pages**

GET /funnels/{funnelId}/pages — List pages within a funnel. Verify correct page structure.

| Future: Direct Page Editing GHL’s new AI Funnel Builder supports intelligent page creation and editing. As this API matures, we may be able to push content directly into page elements rather than relying on Custom Values. Monitor the Funnels API changelog for new write endpoints. |
| :---- |

[Funnels API](https://marketplace.gohighlevel.com/docs/ghl/funnels/funnels-api)

# **9\. Webhooks — Real-Time Event Sync**

## **Events We Listen For**

GHL sends webhook payloads when events occur in the advisor’s sub-account. We use these for real-time data sync to the Growth OS attribution ledger.

| Event | Webhook Name | What We Do With It |
| :---- | :---- | :---- |
| New contact created | ContactCreate | Sync to OS. Check for UTM tags. Link to campaign if matching. |
| Contact tag added | ContactTagUpdate | Update OS contact status. May trigger pipeline advancement. |
| Appointment booked | AppointmentCreate | Log “Booked” event in attribution ledger. Calculate cost per booked call. |
| Appointment status changed | AppointmentUpdate | Update show/no-show status. Trigger no-show recovery if applicable. |
| Opportunity created | OpportunityCreate | Sync new pipeline deal to OS ledger. |
| Opportunity stage changed | OpportunityStageUpdate | Update pipeline stage in OS. Trigger AUM logging prompt if “Won.” |
| Opportunity value changed | OpportunityMonetaryValueUpdate | Update deal value in OS for revenue attribution. |
| Inbound message received | InboundMessage | Log conversation activity. Potential trigger for “Stop on response” logic. |
| Note added to contact | NoteCreate | Sync advisor notes to OS for meeting context. |

## **Webhook Setup**

* Configure the webhook delivery URL in the Marketplace App settings.

* Only one webhook URL per app — build a router that parses the event type and dispatches to the correct handler.

* Webhook payloads do NOT include full contact data. They include the contact ID — make a follow-up API call to GET /contacts/{contactId} for full details.

* Implement webhook signature verification for security.

* Build a dead-letter queue for failed webhook processing — GHL does not retry.

[Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide)

[Webhook Logs Dashboard](https://marketplace.gohighlevel.com/docs/webhook/WebhookLogsDashboard)

# **10\. MCP Server — AI Agent Integration**

## **What the MCP Server Enables**

GHL’s official MCP (Model Context Protocol) server lets AI agents interact directly with a GHL sub-account. This is how we enable agent-driven operations in the Growth OS — an AI agent that can query and modify GHL data through natural language.

**MCP Server Configuration**

**URL: https://services.leadconnectorhq.com/mcp/**

Authentication: Bearer token (Private Integration Token)

Required header: x-location-id (the advisor’s sub-account ID)

**What AI Agents Can Do via MCP**

* Query contacts: “How many leads came in this week from the Tax Time Bomb campaign?”

* Create contacts: “Add John Smith as a new lead with tag webinar-registrant”

* Manage opportunities: “Move the opportunity for Jane Doe to the Showed stage”

* Send messages: “Send a follow-up SMS to all no-shows from yesterday”

* Check appointments: “What appointments are booked for tomorrow?”

* Update custom values: “Update the nurture sequence message 3 with this new copy”

| MCP as the Future Interface Long-term, the MCP server may replace many direct API calls in our system. Instead of the OS making 12 API calls to update Custom Values, it could tell the AI agent: “Update all nurture sequence messages with this approved copy.” The agent handles the execution. This simplifies our integration layer significantly. Monitor GHL’s MCP development closely — they’re actively expanding capabilities. |
| :---- |

[GHL MCP Server Documentation](https://marketplace.gohighlevel.com/docs/other/mcp/index.html)

[Community MCP Implementation (GitHub)](https://github.com/mastanley13/GoHighLevel-MCP)

# **11\. Data Model for GHL Integration**

| Table | Key Fields | Purpose |
| :---- | :---- | :---- |
| ghl\_connections | id, firm\_id, access\_token (encrypted), refresh\_token (encrypted), token\_expires\_at, location\_id, company\_id, connected\_at, status | OAuth connection per firm |
| ghl\_custom\_values | id, firm\_id, ghl\_custom\_value\_id, key (naming convention), asset\_id (FK to OS assets), current\_value\_hash, last\_synced\_at | Tracks which Custom Values map to which OS assets. Hash detects drift. |
| ghl\_contacts\_sync | id, firm\_id, ghl\_contact\_id, os\_lead\_id (FK), campaign\_id, utm\_data (JSON), last\_synced\_at | Maps GHL contacts to OS lead records |
| ghl\_appointments | id, firm\_id, ghl\_appointment\_id, ghl\_contact\_id, os\_lead\_id, calendar\_id, status, booked\_at, appointment\_time | Appointment data synced from webhooks |
| ghl\_opportunities | id, firm\_id, ghl\_opportunity\_id, ghl\_contact\_id, os\_lead\_id, pipeline\_id, stage, monetary\_value, last\_updated\_at | Pipeline deal data synced from webhooks |
| ghl\_webhook\_log | id, firm\_id, event\_type, payload (JSON), processed\_at, status (success/failed/pending) | Audit log of all received webhooks |
| ghl\_sync\_queue | id, firm\_id, action\_type, payload (JSON), status (pending/processing/complete/failed), created\_at, completed\_at | Queue for outbound API calls to GHL. Handles rate limiting and retries. |

# **12\. Rate Limits, Gotchas & Best Practices**

## **Rate Limits**

* **Burst:** 100 API requests per 10 seconds per app per location (sub-account).

* **Daily:** 200,000 API requests per day per app per location.

* **Monitor via headers:** GHL returns rate limit headers in every response. Track x-ratelimit-remaining and x-ratelimit-reset.

* **Build a queue:** All outbound API calls should go through a queue (ghl\_sync\_queue table) that respects rate limits and handles retries with exponential backoff.

## **Common Gotchas**

* **Access tokens expire every 24 hours.** This is much shorter than Meta (60 days). Auto-refresh is non-negotiable.

* **Webhook payloads are incomplete.** They include IDs, not full data. Always follow up with a GET call for complete details.

* **Only one webhook URL per app.** Build a router/dispatcher. Don’t try to register multiple URLs.

* **Custom Values have a character limit.** Long email bodies may need to be split across multiple Custom Values (email\_body\_nurture\_1\_part1, email\_body\_nurture\_1\_part2) and concatenated in the GHL template.

* **GHL doesn’t retry failed webhooks.** If our server is down, we miss events. Build a reconciliation job that periodically polls for contacts and appointments to catch any missed webhooks.

* **API V1 is dead.** Only use V2 endpoints via services.leadconnectorhq.com. All V1 documentation is obsolete.

* **Test with a sandbox sub-account.** Create a dedicated test sub-account in the Amplified agency. Never test against a live advisor’s account.

# **13\. Implementation Phases**

| Phase | Scope | Effort | Dependencies |
| :---- | :---- | :---- | :---- |
| Phase 1: Connection \+ Custom Values | OAuth flow. Token management. Custom Value CRUD. Build the “push approved copy to GHL” pipeline. This is the core integration. | 7–10 days | Amplified snapshots must use Custom Value variables. Content Studio approval flow must be complete. |
| Phase 2: Contact Sync \+ Attribution | Create/update contacts with UTM tags. Custom Fields for attribution. Webhook listeners for contact and appointment events. Sync to OS ledger. | 7–10 days | Phase 1 complete. Meta integration (for UTM source data). Attribution ledger data model. |
| Phase 3: Pipeline \+ Snapshot Automation | Opportunity sync. Pipeline stage webhooks. Automated snapshot deployment. Post-deployment verification. | 5–7 days | Phase 2 complete. Snapshots API testing. |
| Phase 4: MCP Agent Layer | MCP server integration. AI agent that can query and modify GHL data via natural language from within the Growth OS. | 5–8 days | Phase 3 complete. MCP server access. Agent architecture in the OS. |

| Start Here: Phase 1 Is the Unlock The Custom Values pipeline is the single most impactful integration. Once this works, advisors can approve copy in the Growth OS and have it live in their GHL workflows within seconds. This alone eliminates the biggest manual step in campaign setup and validates the entire integration architecture. Get Phase 1 working, test with 2–3 founding cohort advisors, then build forward. |
| :---- |

