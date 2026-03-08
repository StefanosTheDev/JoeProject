

**AMPLIFIED ADVISORS**

**Meta Ads Integration**

Developer Guide — Full API Reference, Endpoints & Build Plan

**Scope:** Everything needed to integrate Meta’s Marketing API, Insights API, and Conversions API into the Growth OS. Covers all four implementation phases through full campaign automation, server-side tracking, and AI-powered optimization.

|  |  |
| :---- | :---- |
| Version | 1.0 |
| Date | March 2026 |
| Status | Developer Reference |
| API Version | Meta Marketing API v25.0 (February 2026\) |

*Confidential — For internal use only.*

# **1\. Overview: What We’re Building**

The Growth OS needs a full Meta advertising integration that allows advisors to launch, manage, optimize, and report on Facebook and Instagram ad campaigns without leaving the platform. This document covers every API, endpoint, permission, and data structure needed to make that work — through all four phases of the integration.

## **Three APIs, One Integration**

Meta’s advertising infrastructure is split across three APIs. We’ll use all three:

* **Marketing API (Core):** Campaign creation, management, editing, deletion. Upload creative assets. Configure targeting, budgets, placements, and scheduling. This is the main engine.

* **Insights API:** Performance reporting. Pull spend, impressions, CPM, CTR, conversions, cost per result, and 70+ other metrics with breakdowns by age, gender, placement, device, and time.

* **Conversions API (CAPI):** Server-side event tracking. Send conversion events (lead captured, appointment booked, client onboarded) directly from our server to Meta, bypassing browser/pixel limitations. Critical for accurate attribution.

## **Documentation Links — Bookmark These**

[Marketing API Overview](https://developers.facebook.com/docs/marketing-api)

[Marketing API Reference (All Endpoints)](https://developers.facebook.com/docs/marketing-api/reference/)

[Campaign Structure Guide](https://developers.facebook.com/docs/marketing-api/campaign-structure)

[Ad Creative Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative)

[Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights)

[Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/)

[Conversions API Setup Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started)

[Automated Rules API](https://developers.facebook.com/docs/marketing-api/ad-rules)

[Graph API Explorer (Testing)](https://developers.facebook.com/tools/explorer/)

[Marketing API Changelog](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/)

[Meta Business SDK (Python)](https://github.com/facebook/facebook-python-business-sdk)

[Meta Business SDK (Node.js)](https://github.com/facebook/facebook-nodejs-business-sdk)

[Postman Collection (MAPI)](https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi)

[Advantage+ Campaigns Migration Guide](https://developers.facebook.com/docs/marketing-api/advantage-plus-shopping/migration)

[Rate Limiting Documentation](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting)

# **2\. Authentication & Account Setup**

## **What We Need Before Writing Any Code**

* **Meta Developer Account:** Register at developers.facebook.com. This is the gateway to the App Dashboard.

* **Meta App:** Create a new app in the Developer Dashboard. Select “Business” as the app type. Add the Marketing API product to the app.

* **Business Verification:** Required for Advanced Access permissions. Submit business documents through Meta Business Settings. This can take 2–5 business days.

* **App Review:** For production access (managing other people’s ad accounts), the app must pass Meta’s App Review process. Requires a screencast demo and clear description of the app’s purpose.

[Developer Registration](https://developers.facebook.com/docs/development/register)

[Create a Meta App](https://developers.facebook.com/docs/development/create-an-app)

[Business Verification Guide](https://developers.facebook.com/docs/development/release/business-verification)

[App Review Process](https://developers.facebook.com/docs/resp-plat-initiatives/app-review)

## **Required Permissions**

| Permission | Access Level | What It Grants | Required For |
| :---- | :---- | :---- | :---- |
| ads\_read | Standard | Read campaign data, performance metrics, ad account info | Phase 2+ (Reporting) |
| ads\_management | Advanced | Full CRUD on campaigns, ad sets, ads, creatives. Budget management. | Phase 3+ (Campaign launch) |
| pages\_read\_engagement | Standard | Read Page posts (needed for ad creative referencing Page posts) | Phase 3+ |
| business\_management | Advanced | Manage Business Manager assets, ad accounts, permissions | Phase 3+ (Multi-account) |
| pages\_manage\_ads | Standard | Create ads that reference Page content | Phase 3+ |

[Permissions Reference](https://developers.facebook.com/docs/permissions/reference)

## **OAuth 2.0 Flow (How Advisors Connect)**

Each advisor connects their Meta Business account to the Growth OS via a standard OAuth flow:

* Advisor clicks “Connect Meta Account” in the Growth OS settings.

* Redirected to Facebook login → grant permissions dialog → approve ads\_read \+ ads\_management.

* Meta returns an authorization code to our callback URL.

* We exchange the code for a short-lived token, then exchange that for a long-lived token (60 days).

* Store the long-lived token encrypted in the database, linked to the firm\_id.

* Implement token refresh: tokens must be refreshed before expiry. Set up a scheduled job that refreshes all tokens at 50 days.

| Critical: Token Management Tokens expire after 60 days. If a token expires, the advisor’s campaign data stops syncing and any automated rules stop working. Build a monitoring system that alerts when tokens are within 7 days of expiry, and auto-refresh where possible. Also handle the case where an advisor revokes access from their Facebook settings — the OS should detect this gracefully and prompt re-connection. |
| :---- |

[Access Token Documentation](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)

[Long-Lived Token Exchange](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)

# **3\. Meta’s Ad Object Hierarchy**

Everything in Meta’s ad system follows a strict hierarchy. Understanding this is essential before building anything:

| Level | Object | What It Controls | OS Equivalent |
| :---- | :---- | :---- | :---- |
| 1 | Business Manager | Top-level container. Holds ad accounts, Pages, users, permissions. | Firm tenant (one BM per advisor firm) |
| 2 | Ad Account | Billing, spending limits, currency. One BM can have multiple ad accounts. | Linked during OAuth. Most advisors have one. |
| 3 | Campaign | Objective (Leads, Traffic, Awareness). Top-level budget (optional). Buying type. | Maps to a Growth OS Campaign record. |
| 4 | Ad Set | Targeting, placement, budget, schedule, optimization goal, bid strategy. | Generated from Marketing Blueprint (ICP → targeting params). |
| 5 | Ad | The actual creative \+ copy \+ CTA. References an Ad Creative object. | Generated from Content Studio (approved ad scripts \+ uploaded video). |
| 6 | Ad Creative | The creative asset itself: image/video, text, headline, link, CTA button. | Built from approved ad copy \+ media files. |

| How This Maps to Our System When an advisor hits “Launch Campaign” in the Growth OS, we need to create objects at levels 3–6 in sequence: first the Campaign (with objective), then the Ad Set (with targeting from the ICP), then the Ad Creative (with the copy and video from Content Studio), then the Ad (linking the creative to the ad set). Each level has required fields and dependencies on the level above. |
| :---- |

[Campaign Structure Documentation](https://developers.facebook.com/docs/marketing-api/campaign-structure)

# **4\. Campaign Creation — Full Endpoint Reference**

## **Step 1: Create Campaign**

Endpoint: POST /{ad\_account\_id}/campaigns

| Parameter | Type | Required | Our Value / Notes |
| :---- | :---- | :---- | :---- |
| name | string | Yes | Auto-generated: “\[Market\] \[Persona\] — \[Offer\] — \[Date\]” from campaign record |
| objective | enum | Yes | OUTCOME\_LEADS (for webinar registrations / booked calls). Use Advantage+ objectives (ODAX). |
| status | enum | Yes | PAUSED (always launch paused, advisor confirms to activate) |
| special\_ad\_categories | array | Yes | \[\] (empty — financial advisors are NOT a special ad category unless running credit/housing/employment ads) |
| buying\_type | enum | No | AUCTION (default). Don’t use RESERVED. |
| bid\_strategy | enum | No | LOWEST\_COST\_WITHOUT\_CAP (default) or COST\_CAP if advisor sets a target CPA |
| daily\_budget / lifetime\_budget | integer | One required | In cents. $50/day \= 5000\. Pull from campaign config in the OS. |

[Campaign API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group)

| Important: ODAX Objectives Required As of v21.0+, Meta requires Outcome-Driven Ad Experience (ODAX) objectives. Legacy objectives are deprecated. Always use the new objective format: OUTCOME\_LEADS, OUTCOME\_TRAFFIC, OUTCOME\_AWARENESS, OUTCOME\_SALES, etc. The legacy objective names (LEAD\_GENERATION, CONVERSIONS, etc.) will stop working. |
| :---- |

## **Step 2: Create Ad Set**

Endpoint: POST /{ad\_account\_id}/adsets

| Parameter | Type | Required | Our Value / Notes |
| :---- | :---- | :---- | :---- |
| name | string | Yes | Auto: “\[Persona Label\] — \[Geo\] — \[Targeting Type\]” |
| campaign\_id | string | Yes | ID returned from Step 1 |
| billing\_event | enum | Yes | IMPRESSIONS |
| optimization\_goal | enum | Yes | LEAD\_GENERATION or OFFSITE\_CONVERSIONS depending on funnel setup |
| daily\_budget | integer | Conditional | In cents. Set here if not set at campaign level. |
| targeting | object | Yes | See Targeting Object breakdown below |
| start\_time | datetime | No | ISO 8601\. From campaign launch date. |
| end\_time | datetime | No | Optional. Most advisor campaigns run continuously. |
| promoted\_object | object | Yes | { pixel\_id: “xxx”, custom\_event\_type: “LEAD” } or { page\_id: “xxx” } for lead forms |
| status | enum | Yes | PAUSED (matches campaign) |

**Targeting Object (Built from Marketing Blueprint)**

The targeting object is where the ICP data from the Marketing Blueprint translates into Meta’s targeting parameters:

| Field | Type | Maps From | Example |
| :---- | :---- | :---- | :---- |
| age\_min | integer | ICP age range lower bound | 55 |
| age\_max | integer | ICP age range upper bound | 67 |
| genders | array | Usually \[0\] for all genders | \[0\] |
| geo\_locations.cities | array | Firm geography from profile | \[{ key: “2418956”, radius: 25, distance\_unit: “mile” }\] |
| geo\_locations.regions | array | Alternative: state-level targeting | \[{ key: “3847” }\] (Colorado) |
| interests | array | From Marketing Blueprint targeting | \[{ id: “6003107902433”, name: “Retirement planning” }\] |
| publisher\_platforms | array | Typically both FB \+ IG | \[“facebook”, “instagram”\] |
| facebook\_positions | array | Feed \+ Reels are primary | \[“feed”, “marketplace”, “video\_feeds”, “reels”\] |
| instagram\_positions | array | Feed \+ Reels \+ Stories | \[“stream”, “story”, “reels”, “explore”\] |

[Targeting API Reference](https://developers.facebook.com/docs/marketing-api/audiences/reference/basic-targeting)

[Interest Search API (for finding interest IDs)](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search)

[Geo Location Targeting](https://developers.facebook.com/docs/marketing-api/audiences/reference/basic-targeting#location)

| Advantage+ Broad Targeting Meta’s Andromeda algorithm performs best with broader targeting and diverse creative. Our Marketing Blueprint strategy already aligns with this — we use broad geo \+ age targeting and let the creative do the audience filtering through specific messaging. Consider using Advantage+ audience (advantage\_audience field) which lets Meta expand beyond the specified targeting when it predicts better performance. This is the direction Meta is pushing in 2025/2026. |
| :---- |

## **Step 3: Upload Creative Assets**

Before creating an Ad Creative, we need to upload the video files (from the edited videos in the OS) to the ad account.

**Endpoint: POST /{ad\_account\_id}/advideos**

* Upload the advisor’s edited video file (from the Video Editing pipeline).

* Supports files up to 4GB. Recommended: H.264, MP4, aspect ratios 1:1 (feed), 9:16 (stories/reels), 16:9 (in-stream).

* Returns a video\_id that we reference in the Ad Creative.

* For images: POST /{ad\_account\_id}/adimages. Returns an image hash.

[Ad Video API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-video)

[Ad Image API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-image)

[Video Ad Specs (Formats & Sizes)](https://developers.facebook.com/docs/marketing-api/video/specs)

## **Step 4: Create Ad Creative**

Endpoint: POST /{ad\_account\_id}/adcreatives

| Parameter | Type | Maps From | Notes |
| :---- | :---- | :---- | :---- |
| name | string | Ad script title from Content Studio | “Tax Time Bomb — UGC — v1” |
| object\_story\_spec | object | Contains all the ad content | See sub-fields below |
| → page\_id | string | Advisor’s Facebook Page ID | Captured during OAuth |
| → instagram\_actor\_id | string | Advisor’s IG account ID | Use ig\_user\_id (updated field name) |
| → video\_data.video\_id | string | From Step 3 upload | The uploaded video asset |
| → video\_data.message | string | Primary text from approved ad script | The body copy of the ad |
| → video\_data.title | string | Headline from approved ad script | Short headline text |
| → video\_data.link\_description | string | Description from approved ad script | Below-headline text |
| → video\_data.call\_to\_action | object | CTA button config | { type: “LEARN\_MORE”, value: { link: “https://...” } } |
| degrees\_of\_freedom\_spec | object | Advantage+ creative settings | Controls Standard Enhancements (text expansion, media optimization, etc.) |
| url\_tags | string | UTM parameters from the OS | Auto-generated: utm\_source=meta\&utm\_medium=paid\&utm\_campaign={campaign\_id}\&utm\_content={ad\_id} |

[Ad Creative API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative)

[Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)

## **Step 5: Create Ad**

Endpoint: POST /{ad\_account\_id}/ads

| Parameter | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| name | string | Yes | Ad name for internal tracking |
| adset\_id | string | Yes | ID from Step 2 |
| creative | object | Yes | { creative\_id: “xxx” } from Step 4 |
| status | enum | Yes | PAUSED (advisor activates from the OS launch preview) |
| tracking\_specs | array | No | Pixel \+ conversion tracking configuration |

[Ad API Reference](https://developers.facebook.com/docs/marketing-api/reference/adgroup)

# **5\. Performance Reporting (Insights API)**

## **How We Pull Data Into the OS Dashboard**

The Insights API is an “edge” on campaign, ad set, and ad objects. You request metrics with breakdowns and date ranges, and it returns structured performance data.

**Endpoint: GET /{object\_id}/insights**

**Metrics to Pull (Minimum Set for MVP Dashboard)**

| Metric | What It Measures | Dashboard Display |
| :---- | :---- | :---- |
| spend | Total amount spent | Total spend card \+ daily chart |
| impressions | Times ads were shown | Impressions card |
| reach | Unique people who saw ads (use viewers metric post-June 2026\) | Reach card |
| clicks | Total clicks | Clicks card |
| cpm | Cost per 1,000 impressions | CPM metric |
| cpc | Cost per click | CPC metric |
| ctr | Click-through rate | CTR metric (key performance indicator) |
| actions (lead type) | Number of leads generated | Leads card (primary outcome metric) |
| cost\_per\_action\_type (lead) | Cost per lead | CPL card (key efficiency metric) |
| frequency | Average times each person saw the ad | Frequency metric (fatigue indicator) |
| video\_p25\_watched\_actions | 25% video views | Video performance section |
| video\_p50\_watched\_actions | 50% video views | Video performance section |
| video\_p75\_watched\_actions | 75% video views | Video performance section |
| video\_p100\_watched\_actions | 100% video views | Video performance section (key for UGC ads) |

**Breakdowns (How We Slice the Data)**

* **age:** Performance by age group. Critical for validating ICP targeting.

* **gender:** Performance by gender.

* **placement:** Feed vs Reels vs Stories vs Explore. Shows where ads perform best.

* **device\_platform:** Mobile vs Desktop.

* **publisher\_platform:** Facebook vs Instagram.

| Reporting Cadence Pull insights data on a schedule: every 6 hours for active campaigns, once daily for paused campaigns. Store historical data in our own database — don’t rely on Meta as the historical source. Meta limits reach data to 13 months with breakdowns. Build our own data warehouse from day one. |
| :---- |

[Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights)

[Insights Parameters](https://developers.facebook.com/docs/marketing-api/insights/parameters/v21.0)

[Breakdowns Reference](https://developers.facebook.com/docs/marketing-api/insights/breakdowns)

# **6\. Conversions API (Server-Side Tracking)**

## **Why This Is Critical**

Browser-based pixel tracking misses a significant portion of conversions due to ad blockers, iOS privacy restrictions, and cookie deprecation. The Conversions API sends events directly from our server to Meta, bypassing all browser limitations. This gives Meta better data for ad optimization and gives us more accurate attribution.

## **Events We Send to Meta**

| Event Name | When It Fires | Source in Our System | Priority |
| :---- | :---- | :---- | :---- |
| Lead | Prospect registers for webinar or submits form on landing page | Funnel / landing page form submission | Critical |
| Schedule | Prospect books a call (Calendly / GHL calendar) | Calendar booking webhook | Critical |
| Contact | Advisor marks prospect as contacted post-meeting | Appointment ledger status update | High |
| CompleteRegistration | Prospect completes full webinar viewing | Webinar platform completion event | Medium |
| Purchase (custom) | Advisor logs new client in AUM ledger | AUM event ledger entry | High (for optimization) |

## **Implementation Details**

**Endpoint: POST /v25.0/{pixel\_id}/events**

* **Each event must include:** event\_name, event\_time (Unix timestamp), action\_source (“website” or “system\_generated”), and user\_data (hashed email, phone, or fbp/fbc identifiers for matching).

* **Deduplication:** Every event sent via CAPI must include an event\_id that matches the pixel event\_id. This prevents double-counting. The event\_id must be a string, not a number.

* **User data hashing:** Email and phone must be hashed (SHA-256) before sending. Meta will NOT accept plaintext PII.

* **Send within 48 hours:** The deduplication window is 48 hours. Events sent after that are counted as separate conversions.

[Conversions API Get Started](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started)

[Conversions API Parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters)

[Event Deduplication Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)

[User Data Hashing Requirements](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)

# **7\. Automated Rules & AI Optimization**

## **Rules-Based Campaign Management**

Meta’s API supports automated rules that can pause, adjust, or alert based on performance thresholds. We use these to protect advisor budgets and surface optimization opportunities:

| Rule | Trigger Condition | Action | Why |
| :---- | :---- | :---- | :---- |
| Pause high-spend, low-result ads | Cost per lead \> 2x target AND spend \> $50 | Pause the ad | Prevent budget waste on underperformers |
| Alert on ad fatigue | Frequency \> 3.0 | Notify advisor in OS dashboard | Creative fatigue \= declining performance |
| Budget shift to winners | CTR \> 2x account average AND CPL \< target | Increase daily budget by 20% | Scale what’s working automatically |
| Pause low-engagement ads | CTR \< 0.5% after 1,000 impressions | Pause the ad | Low CTR hurts account quality score |
| Weekend budget adjustment | Day \= Saturday or Sunday | Reduce budget by 30% | Most advisor leads don’t convert on weekends |

[Ad Rules API Reference](https://developers.facebook.com/docs/marketing-api/ad-rules)

## **AI-Powered Suggestions (Growth OS Layer)**

Beyond Meta’s built-in rules, the Growth OS adds its own intelligence layer:

* **Creative fatigue detection:** When frequency hits 3.0+ and CTR starts declining, the OS suggests generating a new ad variation from the Content Studio using the same angle but different hook.

* **ICP validation:** Compare age/gender breakdown from Insights with the Marketing Blueprint ICP. If the best-performing demographic differs from the target ICP, surface this as an insight.

* **Budget optimization:** Analyze cost per lead across all active campaigns and suggest budget reallocation from worst to best performers.

* **Auto-regenerate creative:** When an ad is paused due to fatigue, automatically trigger the AI asset generator to create a replacement using the same ICP/offer but a different angle from the Marketing Blueprint.

# **8\. Data Model for Meta Integration**

New tables needed to support the Meta integration:

| Table | Key Fields | Purpose |
| :---- | :---- | :---- |
| meta\_connections | id, firm\_id, access\_token (encrypted), token\_expires\_at, ad\_account\_id, page\_id, ig\_user\_id, pixel\_id, status, connected\_at | Stores the OAuth connection for each firm |
| meta\_campaigns | id, campaign\_id (FK to our campaigns table), meta\_campaign\_id (from Meta API), meta\_adset\_id, status, created\_at | Maps our campaign records to Meta’s campaign objects |
| meta\_ads | id, meta\_campaign\_id (FK), meta\_ad\_id (from Meta), asset\_id (FK to our assets table), meta\_creative\_id, status, created\_at | Maps our ad scripts to Meta’s ad objects |
| meta\_insights | id, meta\_campaign\_id (FK), date, spend, impressions, reach, clicks, cpm, ctr, leads, cost\_per\_lead, frequency, fetched\_at | Stores pulled performance data (one row per campaign per day) |
| meta\_insights\_breakdowns | id, meta\_insights\_id (FK), breakdown\_type (age/gender/placement), breakdown\_value, spend, impressions, clicks, leads | Stores breakdown-level performance data |
| meta\_conversions\_log | id, firm\_id, event\_name, event\_id, event\_time, user\_data\_hash, meta\_response, sent\_at | Audit log for every CAPI event sent |
| meta\_rules | id, firm\_id, rule\_type, condition\_json, action\_type, is\_active, last\_triggered\_at | Stores automated rule configurations per firm |

# **9\. Rate Limits, Versioning & Gotchas**

## **Rate Limits**

* **Marketing API uses “Business Use Case” rate limiting.** Each ad account gets a certain number of calls per hour based on its tier. Higher-spend accounts get higher limits.

* **Insights API calls are the most expensive.** Batch insight requests and cache results. Don’t pull insights on every page load — pull on a schedule and serve from our database.

* **Error codes 613 and 80004** indicate rate limiting. Implement exponential backoff with jitter.

* **Use async reports for large data pulls.** POST /{ad\_account\_id}/insights creates an async job. Poll for completion, then fetch results.

[Rate Limiting Documentation](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting)

## **API Versioning**

* **Meta releases a new API version roughly quarterly.** Each version is supported for 2 years before deprecation.

* **Current version: v25.0 (released Feb 2026).** Build against the latest stable version.

* **Advantage+ Shopping Campaigns and Advantage+ App Campaigns** are being deprecated. All new campaign creation should use the unified Advantage+ campaign structure.

* **Legacy reach metrics are being replaced by “Viewers” metrics** by June 2026\. Plan for this migration in the reporting pipeline.

[API Changelog](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/)

[Advantage+ Campaign Migration](https://developers.facebook.com/docs/marketing-api/advantage-plus-shopping/migration)

## **Common Gotchas**

* **Budgets are in cents, not dollars.** $50/day \= 5000\. Getting this wrong means spending 100x or 0.01x intended budget.

* **Always launch campaigns as PAUSED.** Never auto-activate. Let the advisor review and confirm.

* **Test with sandbox ad accounts first.** Create a sandbox in the Meta Developer App settings. No real money spent.

* **UTM parameters must be set on the creative, not the campaign.** Use the url\_tags field on Ad Creative.

* **instagram\_actor\_id is deprecated.** Use ig\_user\_id instead (as of v22.0+).

* **Token expiration is silent.** API calls just start failing with auth errors. Monitor proactively.

# **10\. Implementation Phases**

| Phase | Scope | Effort | Dependencies |
| :---- | :---- | :---- | :---- |
| Phase 2: Read-Only Reporting | OAuth connection \+ pull Insights data into OS dashboard. No campaign creation. | 7–10 days | OAuth flow, meta\_connections table, meta\_insights table, scheduled data pull job, dashboard UI |
| Phase 3: Campaign Launch | Full campaign creation from OS. Upload creative, create Campaign → Ad Set → Ad Creative → Ad. Launch preview \+ advisor confirmation. Edit/pause/resume from OS. | 15–20 days | Phase 2 complete. All campaign creation endpoints. Creative upload pipeline. Launch preview UI. |
| Phase 4: CAPI \+ Automation | Server-side conversion tracking (CAPI). Automated rules engine. AI optimization suggestions. Creative fatigue detection \+ auto-regeneration. | 10–15 days | Phase 3 complete. CAPI event pipeline. Rules engine. Integration with Content Studio for auto-regeneration. |

| Recommendation: Start with Phase 2 Read-only reporting is the fastest path to value. Advisors connect their Meta account, and immediately see their campaign performance in the OS dashboard alongside their Content Studio and Attribution ledger. This validates the integration architecture, proves value to the founding cohort, and builds the data foundation needed for Phases 3 and 4\. Don’t try to build launch capability and reporting at the same time. |
| :---- |

