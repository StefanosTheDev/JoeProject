

**AMPLIFIED ADVISORS**

**Growth OS — Feature Specification**

MVP Build Scope \+ Future Roadmap

|  |  |
| :---- | :---- |
| Document Type | Developer Feature Specification |
| Version | 1.0 |
| Date | March 2026 |
| Status | Ready for Developer Review |
| Audience | Development team, technical stakeholders |

| How to Read This Document Section 1 covers the MVP features to build now. Section 2 covers future features to build after the MVP is proven and generating revenue. Each feature includes what it does, why it exists, key technical considerations, and acceptance criteria. Features are ordered by build priority. |
| :---- |

**SECTION 1**

**Initial MVP — Build Now**

| MVP Scope Rule Every feature in this section must pass three tests: (1) Reduces user error without human support, (2) Creates switching costs and stickiness, (3) Ties directly to measurable outcomes (booked calls, meetings, AUM events). If it doesn’t pass all three, it doesn’t ship. |
| :---- |

# **1\. Guided Campaign Workflow Builder**

## **What It Does**

A step-locked wizard that guides advisors from firm setup through campaign launch. The advisor cannot skip steps, cannot proceed without completing required inputs, and is constrained to structured choices at every stage. This is the backbone of the entire application — every other feature feeds into or out of this flow.

## **User Flow**

| Step | What the Advisor Does | What the System Does |
| :---- | :---- | :---- |
| 1\. Firm Profile | Provides website URL, confirms firm description, selects service model, describes current clients, sets geography and credentials | Scrapes and analyzes website via AI. Extracts services, client signals, tone, credentials. Stores structured firm profile. |
| 2\. ICP Discovery | Reviews AI-generated Ideal Client Profile. Adjusts age range, asset band, concerns, tone via constrained controls (sliders, toggles, ranked selects). | Processes firm profile through AI prompt chain. Generates structured ICP recommendation. Maps to internal archetype classification (not shown to user). Locks ICP for campaign use. |
| 3\. Offer Selection | Reviews 2–3 recommended offer archetypes ranked by fit. Selects one. Configures meeting type, length, and exclusions. | Matches ICP to offer archetype library. Presents ranked recommendations. Stores offer config linked to ICP and firm. |
| 4\. Campaign Config | Names campaign (auto-suggested), selects primary channel (Paid Social, Email, Organic), sets optional budget range and launch date. | Creates campaign record linking firm \+ ICP \+ offer. Sets channel flags for asset generation. |
| 5\. Asset Generation | Reviews generated assets category by category. Approves, revises, or removes individual pieces via structured feedback. | Generates assets using prompt chains fed by all prior inputs. Iterates on revision requests. See Feature 2 for full detail. |
| 6\. Review & Approve | Final review of complete asset package. Completes compliance self-check (3 checkboxes). | Logs compliance acknowledgment with timestamp and asset versions. Moves campaign to Approved status. |
| 7\. Deploy | Reviews build packet. Marks checklist items complete as they deploy. Clicks Launch. | Generates deployment package (asset export, HighLevel snapshot reference, setup checklist, config values). Moves campaign to Active. |

## **Key Technical Considerations**

* **Step gating:** Each step has a completion state (not\_started, in\_progress, complete). The UI must enforce sequential progression. Backend should also validate — don’t rely solely on frontend gating.

* **Completion states are persistent:** If the advisor leaves mid-flow and returns later, they pick up exactly where they left off. All in-progress data must be saved on every step transition.

* **Firm profile is one-time:** Steps 1 (Firm Profile) is completed once and reused for all future campaigns. Steps 2–7 repeat per campaign. The UI should reflect this — returning users skip to Step 2 with their firm profile pre-loaded.

* **Only 1 free-text input:** The firm description field (Step 1\) is the only free-text input in the entire flow. Everything else is structured: sliders, toggles, multi-select, dropdowns, radio buttons, range selectors.

## **Acceptance Criteria**

* Advisor can complete full flow from sign-up to deployment package without contacting Amplified for help.

* Advisor cannot skip or bypass any required step.

* All in-progress data persists across sessions.

* Second campaign for the same firm pre-loads firm profile and takes significantly less time.

# **2\. AI Asset Generator**

## **What It Does**

Generates a full campaign asset package using pre-built AI prompt chains fed by the advisor’s firm profile, ICP, offer config, and campaign parameters. The advisor never writes prompts or sees prompts. They provide structured inputs earlier in the flow, and the system produces compliant, deployment-ready assets. Generation is iterative — the advisor reviews and refines category by category, not all-at-once.

## **Asset Categories (in generation order)**

Assets are generated in this sequence because each category’s approved output informs the next category’s generation:

**Category A: Ad Creative**

| Output | Count | Details |
| :---- | :---- | :---- |
| Hook variations | 3–5 | The attention-grabbing first line. Multiple angles (fear, curiosity, authority, social proof, direct). |
| Primary text | 2–3 | Body copy for the ad. Matched to hook angles. |
| Headlines | 3–5 | Short, punchy. Paired with primary text. |
| Description text | 2–3 | Supporting line beneath headline. |
| Disclaimers | 1–2 | Compliance-safe legal language auto-generated based on firm’s compliance profile and service model. |

* **Display:** Each variation shown as a mock ad card layout, not raw text. The advisor should see something that resembles what the ad will look like.

* **Minimum to proceed:** At least 2 approved ad variations.

**Category B: Landing Page / Funnel Copy**

| Section | Details |
| :---- | :---- |
| Headline \+ subhead | Informed by approved ad hooks for messaging consistency. |
| Problem section | Speaks to ICP’s primary pain/concern. |
| Solution section | Positions the advisor’s offer as the answer. |
| Credibility section | Leverages credentials, experience, firm differentiators. |
| Social proof framework | Suggested testimonial structure, case study prompts, trust signals. |
| About the advisor | Generated from firm profile data. Warm, professional. |
| CTA section | Matched to offer archetype. Calendar booking or form submission. |
| FAQ section | 5–8 questions based on ICP objections and common concerns. |
| Objection handling blocks | Preemptive responses to top objections identified in ICP. |
| Footer disclaimer | Compliance language matched to service model. |

* **Display:** Section by section, not a single wall of text. Each section is independently reviewable.

* **Minimum to proceed:** Headline, problem, solution, CTA, and disclaimer must all be approved.

**Category C: Follow-Up Sequences (Email \+ SMS)**

| Sequence | Message Count | Timeline | Purpose |
| :---- | :---- | :---- | :---- |
| New lead nurture | 5–7 messages | Over 14 days | Warm the lead, build trust, drive booking |
| Appointment confirmation | 3 messages | Booking → appointment | Confirm, 24hr reminder, 1hr reminder |
| Show-up / pre-meeting | 2–3 messages | 24hrs before meeting | Reduce no-shows, set expectations, build anticipation |
| No-show recovery | 3 messages | Over 48 hours post no-show | Re-engage, reschedule, preserve relationship |
| Long-term nurture | 8–12 messages | Over 90 days | For leads who don’t book immediately. Drip value \+ social proof. |

* **Display:** Each sequence shown as a vertical timeline. Individual messages are expandable to show subject line (email), body, and send timing.

* **Both email and SMS variants:** Each touchpoint should generate both an email version and an SMS version where applicable. SMS versions are shorter with direct CTAs.

**Category D: Call Preparation Kit**

* Discovery questions tailored to ICP (8–12 questions)

* Meeting agenda framework

* Objection rebuttals specific to this persona (5–8 objections with responses)

* Closing framework / next-steps script

## **The Iterative Review Loop**

This is critical — generation is NOT one-shot. For each category, the flow is:

| Step | Actor | Action |
| :---- | :---- | :---- |
| 1 | System | Generates initial output for the category using all structured inputs \+ any previously approved assets as context. |
| 2 | Advisor | Reviews each individual asset (each ad hook, each email, each section). For each: Approve, Request Revision, or Flag for Removal. |
| 3 | Advisor | For revisions: selects WHAT to change via structured options (tone, length, angle, proof emphasis, claim strength, compliance concern). Optional short note (100 char max). |
| 4 | System | Regenerates ONLY the flagged assets using the feedback as additional constraints appended to the original prompt. Does not regenerate approved assets. |
| 5 | Both | Repeat until all assets in the category are approved. Then advance to next category. |

| Why Iterative Matters A one-shot model creates a binary outcome: accept everything or reject everything. The iterative model lets the advisor shape output without starting over. It also means earlier approved assets inform later generation — ad hooks shape landing page headlines, which shape email subject lines. Coherence across the campaign happens naturally. |
| :---- |

## **Key Technical Considerations**

* **Prompt chain architecture:** Each category has a master system prompt stored in the database (not hardcoded). Variable injection inserts firm profile, ICP, offer, and prior approved assets. Output format is specified as structured JSON for reliable parsing.

* **Revision prompts:** Revisions append constraints to the original prompt, not replace it. Example: “Soften tone, reduce urgency language” gets added as an additional constraint.

* **Version history:** Every generation and revision stored with version number, input parameters, and output. Non-negotiable for audit trails.

* **Compliance layer:** System prompts include compliance guardrails (no performance guarantees, no specific return claims, conservative language). Post-generation validation should regex-check for banned phrases.

* **Rate limiting revisions:** Max 5 revisions per individual asset. After that, surface a message suggesting they contact support.

* **Performance:** Each category generation should complete in under 30 seconds. Parallelize API calls where possible (e.g., 3–5 ad variations can generate simultaneously).

## **Acceptance Criteria**

* Advisor receives a complete asset package across all 4 categories from structured inputs only.

* Advisor can revise individual assets without regenerating the entire category.

* Approved assets from earlier categories visibly influence later category outputs (messaging coherence).

* All outputs respect the compliance profile — no performance guarantees or risky claims.

* Full version history is maintained and queryable.

# **3\. Video Editing Pipeline \+ Credit System**

## **What It Does**

A submission pipeline within the app that allows advisors to upload raw video footage and request editing from Amplified’s overseas editing team. Usage is tracked via a credit system. This is a service layer built into the software, not AI-driven (initially).

## **How It Works**

**Submission Flow**

* Advisor uploads raw video file(s) or provides a link (Google Drive, Dropbox, etc.).

* Advisor selects editing type: Social clip (short-form for ads/organic), Webinar/VSL edit (long-form), Testimonial/case study edit.

* Advisor provides brief direction using structured inputs: desired length, key moments to include (timestamps), tone/style preference (select from presets), text overlays or CTA to include, music preference (from licensed library or none).

* Submission deducts credits from their balance. System confirms credit deduction and estimated turnaround.

* Editing team receives the request via an internal admin queue. Completed edits are uploaded back to the app.

* Advisor reviews, approves, or requests one round of revisions (included in credit cost).

**Credit System**

| Edit Type | Credit Cost | Estimated Turnaround |
| :---- | :---- | :---- |
| Social clip (under 60s) | 1 credit | 48 hours |
| Webinar/VSL edit (5–30 min) | 3 credits | 5 business days |
| Testimonial/case study | 2 credits | 3 business days |
| Revision round | 0 (1 included per submission) | — |

* Monthly credit allotment included with software license (e.g., 4 credits/month).

* Additional credit packs available for purchase (e.g., 5 credits for $X, 10 for $Y).

* Credits do not roll over month-to-month (prevents hoarding, keeps demand predictable).

* Dashboard shows: credits remaining, credits used this month, submission history with status.

## **Key Technical Considerations**

* **File upload:** Use Supabase Storage or a dedicated file service. Videos can be large — support up to 2GB uploads. Show progress indicator. Allow link-based submission as alternative.

* **Admin queue:** Build a simple internal admin view where the editing team sees pending requests, downloads source files, uploads finished edits, and marks submissions complete.

* **Credit tracking:** credits\_balance table with firm\_id, current\_balance, monthly\_allotment, reset\_date. Transaction log for every credit deduction and addition.

* **Notifications:** Email the advisor when their edit is ready for review.

## **Acceptance Criteria**

* Advisor can submit a video editing request and track its status within the app.

* Credits are accurately tracked, deducted on submission, and displayed in a dashboard.

* Editing team can view and manage the queue from an admin interface.

* Advisor is notified when their edited video is ready.

# **4\. Deployment Mechanism**

## **What It Does**

Packages all approved campaign assets into a structured deployment kit and provides clear instructions for getting the campaign live. For MVP, this is a guided manual process with two deployment paths.

## **Path A: HighLevel Snapshot Deployment**

* System identifies the correct pre-built Amplified snapshot based on campaign type (offer archetype \+ channel).

* Generates a step-by-step setup checklist specific to that snapshot: install snapshot, connect domain, connect calendar (Calendly or GHL calendar), set up phone number (if SMS sequences), install tracking pixel, configure UTM parameters (auto-generated by the OS), paste in generated copy (organized by placement with copy buttons).

* Each checklist item has a “Completed” toggle. Advisor marks items done as they set up.

* Campaign can be marked “Launched” once minimum items are complete. Do not hard-block launch.

## **Path B: Amplified-Hosted Pages**

* For advisors who don’t want to manage HighLevel infrastructure, offer simple page hosting on Amplified’s domain/subdomain.

* The OS generates the landing page using approved funnel copy and a standardized template.

* Embedded scheduling widget (Calendly or similar) and/or form for lead capture.

* UTM tracking built in automatically.

| MVP Scope for Path B Path B does not require a full page builder. It means deploying the approved funnel copy into 1–2 standardized, well-designed page templates. The advisor picks the template; the system populates the content. Domain mapping (advisor’s subdomain pointing to hosted page) is a nice-to-have for MVP, not required. |
| :---- |

## **Shared: Asset Export**

* "Download All Assets" button exports everything as a structured ZIP: ad copy (formatted for Meta Ads Manager copy/paste), funnel copy (section by section with placement labels), sequences (formatted for email/SMS tool import), call prep kit (standalone PDF), UTM configuration sheet.

## **Acceptance Criteria**

* Advisor has a clear, actionable path to get their campaign live.

* All generated copy is organized by placement and copy-paste ready.

* UTM parameters are auto-generated and consistent.

* Full asset package is downloadable as a single export.

# **5\. Attribution Foundation (Appointment Ledger)**

## **What It Does**

A tracking and logging system that connects marketing activity to business outcomes. For MVP, this is primarily a structured appointment log with source tracking and manual AUM event logging. Integrates with GoHighLevel initially for appointment data, with the architecture designed to support deeper integrations later.

## **Components**

**5a. GHL Integration (Appointment Sync)**

* Pull appointment/booking data from GoHighLevel via API or webhook.

* Sync booked appointments into the OS with: contact info, booking source, campaign association (via UTM matching), appointment date/time, status (booked, confirmed, showed, no-show, cancelled).

* Appointments auto-associate to campaigns based on UTM/source tags.

**5b. UTM Enforcement \+ Source Tagging**

* The OS generates standardized UTM parameters for every campaign: utm\_source, utm\_medium, utm\_campaign, utm\_content (maps to specific ad variation).

* UTMs are auto-applied in the deployment package. Advisors don’t create their own.

* Inbound leads tagged with source, channel, campaign ID, and specific asset IDs where possible.

**5c. Lead → Household Mapping**

* Create a Household entity as the primary relationship container. Multiple leads/contacts can map to one household.

* When a new lead comes in, system prompts for household association (new household or existing).

* All reporting rolls up to household level, not individual contact level.

**5d. AUM Event Ledger (Manual Logging)**

Advisors manually log business outcomes tied to households. Each entry captures:

| Field | Type | Options / Notes |
| :---- | :---- | :---- |
| Became client? | Yes / No toggle | — |
| Estimated assets moved | Range selector | $0–$100K, $100K–$250K, $250K–$500K, $500K–$1M, $1M–$3M, $3M+ |
| Date of funding | Date picker | When assets transferred |
| Custodian | Text / dropdown | Schwab, Fidelity, Pershing, TD, LPL, Other |
| Account type | Multi-select | IRA, Roth IRA, Joint, Trust, 401k rollover, Other |
| Transfer type | Single select | Full transfer, Partial transfer, New money, Follow-on add |
| Associated campaign | Auto-linked | Via household → lead → campaign chain |

| Framing Matters Reporting outputs use "AUM Influenced" not "AUM Generated." This is a defensible, conservative framing. The ledger tracks what marketing influenced, not what it directly caused. This distinction matters for compliance and credibility. |
| :---- |

**5e. Reporting Dashboard (MVP)**

Basic dashboard pulling from appointment sync \+ manual ledger:

* Cost per booked call (by campaign / channel)

* Show rate and no-show rate

* Close rate (household level)

* AUM events count and total influenced range

* Pipeline view: lead → booked → showed → closed → funded

* Export: ledger data exportable as CSV for compliance conversations or board reporting

## **Acceptance Criteria**

* Appointments sync from GHL and auto-associate to campaigns.

* UTMs are generated consistently and tracked end-to-end.

* Advisors can log AUM events tied to households and campaigns.

* Dashboard displays key metrics accurately.

* All data is exportable.

# **6\. Admin, Compliance & Quality Controls**

## **What It Does**

System-level controls that ensure output quality, maintain audit trails, and protect both Amplified and the advisor from compliance risk.

## **Components**

**6a. Approval Gates**

* Campaign cannot advance past asset generation without all required assets approved.

* Campaign cannot be marked “Launched” without compliance self-check completed.

* Optional: Amplified admin can flag campaigns for manual review before deployment (useful during founding cohort).

**6b. Compliance-Safe Language Locks**

* AI generation system prompts include hard rules: no performance guarantees, no specific return claims, no misleading urgency, conservative income projections only.

* Post-generation validation: regex/pattern matching scans all generated text for banned phrases and flags violations before showing to the advisor.

* Compliance profile per firm: some firms are more conservative than others. The compliance profile (set during firm onboarding) adjusts the constraint level on generation.

**6c. Asset Versioning**

* Every generated asset has a version number. Every revision creates a new version.

* Full history is queryable: who generated it, when, what inputs were used, what feedback was provided, what changed.

* Compliance acknowledgment logs reference specific asset version IDs.

**6d. Role-Based Access (MVP)**

| Role | Permissions |
| :---- | :---- |
| Admin (firm) | Full access: create campaigns, approve assets, view reports, edit firm profile, manage team members |
| Member (firm) | View-only: can see campaigns and assets but cannot create, approve, or edit |
| Amplified Admin | Super-access: view all firms, flag campaigns for review, manage offer archetypes and prompt templates, view system-wide metrics |

**6e. Audit Exports**

* Advisors can export a compliance package for any campaign: all asset versions, compliance acknowledgments, generation parameters, timestamps.

* Formatted as a PDF or structured ZIP suitable for sharing with a compliance officer or broker-dealer.

## **Acceptance Criteria**

* No campaign can go live without approval gates cleared.

* Generated content is checked against compliance rules before display.

* Full version history exists for every asset.

* RBAC enforced at both UI and backend level.

**SECTION 2**

**Future Roadmap — Build After MVP is Proven**

| Sequencing Rule These features are only built after the MVP has paying users, validated retention, and demonstrated that the core workflow \+ AI generation loop delivers value. Do not build any of these in parallel with the MVP. The temptation will be strong. Resist. |
| :---- |

| Priority | Feature | What It Does | Trigger to Build |
| :---- | :---- | :---- | :---- |
| 1 | Meta Ads Manager Integration | Connect to Meta’s Marketing API. Pull campaign spend, impressions, clicks, and CPM into the OS dashboard for automatic attribution. Later: launch ad campaigns directly from the OS without opening Ads Manager. | After 10+ firms are running paid campaigns through the OS and manually reporting spend. |
| 2 | Email / Website UTM Integration \+ CRM Sync | Direct integrations with email platforms, website analytics, and CRM tools to automatically match UTM sources across all channels. Eliminates manual source tagging. Connects the full picture: ad click → website visit → email engagement → appointment → client. | After attribution ledger v1 proves the data model works with manual input. |
| 3 | Funnel Builder / Page Hosting (Full) | Full landing page builder within the OS. AI-assisted creation of webinar watch rooms, VSL pages, opt-in pages. Domain integration (custom domains), SSL, hosting. Think Lovable-style builder but mapped to financial advisor use cases with pre-built compliant templates. | After Path B (simple hosted pages) validates demand. After revenue justifies engineering investment. |
| 4 | Integrated Email / SMS (Twilio) | Twilio connection for native email and SMS sending within the platform. Eliminates dependency on HighLevel or third-party sending tools. Full sequence management, deliverability monitoring, and engagement tracking built in. | After follow-up sequences prove high value in MVP and advisors request native sending. |
| 5 | AI Video Editing / AI Video Generation | Replace the overseas editing team with AI-powered video editing. Auto-generate social clips from long-form video. AI-driven caption overlays, b-roll suggestions, thumbnail generation. Later: AI avatar/presenter generation for advisors who don’t want to be on camera. | After video pipeline (Feature 3 MVP) has significant volume. After AI video tools mature enough for professional quality. High risk — compliance implications for AI-generated advisor likenesses. |

# **Quick Reference: Build Priority Matrix**

|  | Feature | Phase | Effort Est. | Revenue Impact |
| :---- | :---- | :---- | :---- | :---- |
| MVP | Guided Campaign Workflow | Now | 10–15 days | Core — nothing works without this |
| MVP | AI Asset Generator | Now | 10–15 days | Core — this is the product’s value |
| MVP | Video Editing Pipeline | Now | 5–7 days | Medium — service revenue \+ stickiness |
| MVP | Deployment Mechanism | Now | 5–7 days | High — completes the loop to launch |
| MVP | Attribution Foundation | Now | 7–10 days | High — proves ROI, drives retention |
| MVP | Admin / Compliance | Now | 3–5 days | Required — trust and audit trails |
| Future | Meta Ads Integration | Post-MVP | 10–15 days | High — automates attribution |
| Future | UTM / CRM Integration | Post-MVP | 7–10 days | Medium — data completeness |
| Future | Full Funnel Builder | Post-MVP | 20–30 days | High — eliminates HighLevel dependency |
| Future | Native Email / SMS | Post-MVP | 15–20 days | Medium — platform consolidation |
| Future | AI Video | Post-MVP | 20+ days | Medium — cost reduction \+ scale |

**End of Feature Specification**

Refer to the MVP Build Specification document for data models, technical architecture, and detailed prompt chain architecture.