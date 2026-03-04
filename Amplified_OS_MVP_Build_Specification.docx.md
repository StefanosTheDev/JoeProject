

**AMPLIFIED ADVISORS**

**Growth Operating System**

MVP Build Specification & Developer Guide

**Document Purpose:** This document defines the complete MVP user flow, data model, technical architecture, and build priorities for the Amplified Advisors Growth OS. It is written for the development team and intended to provide enough detail to begin building without ambiguity on scope, user experience, or system behavior.

**Version:** 1.0  |  **Date:** March 2026  |  **Status:** Draft for Developer Review

**Confidential** \- For internal use only. Do not distribute.

**Table of Contents**

1\. Executive Summary & Product Vision

2\. End-to-End User Journey Overview

3\. Phase 0: Account Creation

4\. Phase 1: Firm Profile Setup

5\. Phase 2: AI-Driven ICP Discovery

6\. Phase 3: Offer Configuration

7\. Phase 4: Campaign Setup

8\. Phase 5: Iterative Asset Generation

9\. Phase 6: Final Review & Compliance

10\. Phase 7: Deployment Package

11\. Data Model & Entity Relationships

12\. Technical Architecture

13\. AI/Prompt Architecture Considerations

14\. Authentication, Multi-Tenancy & Security

15\. MVP Scope Boundaries

16\. Build Sequence & Priority Order

# **1\. Executive Summary & Product Vision**

## **What We Are Building**

The Amplified Advisors Growth OS is a web application that replaces the current agency-and-community model with a governed, AI-native software platform for fiduciary financial advisors (RIAs). The system guides advisors through a step-locked workflow to define their target client, select a proven offer structure, and then uses AI to generate a full campaign asset package (ad copy, funnel copy, email/SMS sequences, and call preparation materials) within compliance-safe guardrails.

## **The Core Problem**

Advisors have too many choices, too much room for error, and too much reliance on human guidance from the Amplified team. The current model does not scale. The OS solves this by embedding Amplified’s expertise into structured workflows and AI prompt chains so that advisors provide simple inputs and the system produces consistent, compliant outputs.

## **What Makes This Different From Existing Tools**

* This is not a CRM, a generic funnel builder, or a content writing tool.

* The system constrains user behavior by design. Advisors cannot go off-script, skip steps, or break best practices.

* AI generation uses pre-built prompt chains with structured variables. Advisors never write prompts or see prompts.

* Every output is shaped by the advisor’s firm profile, ICP, and compliance profile — not generic templates.

* The system produces deployment-ready asset packages, not “ideas” or “templates to customize.”

## **MVP Success Criteria**

1. An advisor can go from sign-up to a complete, deployment-ready campaign without contacting Amplified for guidance.

2. Outputs are consistent across advisors — quality does not depend on the user’s marketing sophistication.

3. Support load drops significantly for campaign setup and asset creation.

4. The product is sellable at $15K–$25K/year as a standalone software license.

| Key Design Principle Only one free-text input exists in the entire MVP flow (the firm description). Everything else is structured: sliders, toggles, multi-select, confirmations. The system makes decisions; the advisor validates them. |
| :---- |

# **2\. End-to-End User Journey Overview**

The MVP user journey consists of 8 phases. Phases 0–7 represent the complete path from account creation to a deployed campaign. The final phase (Post-Launch) is noted for context but is not part of the MVP build.

| Phase | Name | Time Est. | What Happens |
| :---- | :---- | :---- | :---- |
| 0 | Account Creation | 2 min | Sign up, create tenant |
| 1 | Firm Profile Setup | 8–12 min | One-time deep intake (website analysis, services, clients, geo) |
| 2 | ICP Discovery | 5 min | AI generates ICP recommendation, advisor refines |
| 3 | Offer Configuration | 3–5 min | AI recommends offer archetypes, advisor selects and tailors |
| 4 | Campaign Setup | 2 min | Name campaign, set channel/budget parameters |
| 5 | Asset Generation | 15–25 min | Iterative AI generation with advisor feedback loop |
| 6 | Review & Compliance | 5–10 min | Final review, compliance acknowledgment |
| 7 | Deployment Package | 5 min | Build packet, checklists, HighLevel snapshot reference |

**First-time total:** \~45–65 minutes.  **Repeat campaign (same firm):** \~25–35 minutes (firm profile and ICP are pre-loaded, advisor adjusts and regenerates).

# **3\. Phase 0: Account Creation**

## **Purpose**

Create the user account and firm tenant. Keep this fast and frictionless. No credit card collection at this stage for founding cohort users.

## **User Inputs**

| Field | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| Email | Email input | Yes | Used for login. Verify via email confirmation. |
| Password | Password input | Yes | Minimum 8 chars. Standard strength requirements. |
| Full Name | Text | Yes | Advisor’s name (display \+ personalization). |
| Firm Name | Text | Yes | Creates the tenant record. Used throughout the app. |
| Phone | Phone input | No | Optional. Useful for SMS-based features later. |

## **System Behavior**

* Create a Firm (tenant) record in the database.

* Create a User record associated with the firm, with a default role of “Admin.”

* Generate a unique firm\_id that acts as the tenant isolation key for all downstream data.

* Send email verification. Redirect to the Firm Profile Setup flow upon first login.

## **Developer Notes**

| Auth Consideration Supabase Auth handles email/password out of the box. Use Supabase’s built-in email confirmation flow. The firm\_id should be stored in the user’s app\_metadata or a separate profiles table linked to auth.users. All subsequent queries must filter by firm\_id for multi-tenant isolation via Row-Level Security (RLS). |
| :---- |

# **4\. Phase 1: Firm Profile Setup**

## **Purpose**

This is a one-time deep intake that captures everything the system needs to understand the advisor’s practice. It runs once on first login and can be edited later from a settings page. The data collected here feeds ICP generation, offer recommendations, asset generation, and compliance guardrails.

## **Step 1.1: Website Analysis**

**What the user does:** Pastes their website URL into a single input field.

**What the system does:** Scrapes the website and uses AI to extract structured data about the firm.

**AI Extraction Targets:**

* Services offered (AUM management, financial planning, tax, insurance, estate)

* Client type indicators (retirees, pre-retirees, business owners, high-net-worth, etc.)

* Geographic mentions (city, state, metro area, “virtual/nationwide” signals)

* Credentials and designations (CFP, CPA, CFA, RICP, ChFC, etc.)

* Tone and language style (conservative/institutional vs. approachable/conversational)

* Differentiators or specialization claims

* Team size signals (solo practitioner vs. multi-advisor firm)

| UX Requirement Show a loading state with specific progress indicators (“Analyzing your services...”, “Identifying your positioning...”). This is the first AI-powered moment in the app. It must feel intelligent, not generic. If the scrape fails or the site is minimal, the system should gracefully fall back to manual input and not block the flow. |
| :---- |

## **Step 1.2: Firm Description**

**What the user does:** Reviews a pre-filled firm description (generated from the website analysis) and edits it if needed. This is the only free-text input in the MVP.

**Input:** Textarea, 300 character max. Pre-filled from website analysis. Prompt: “Tell us about your firm and what makes you different.”

**System action:** NLP extraction of differentiators, philosophy, and specialization. Cross-referenced with website analysis to build a composite firm profile.

## **Step 1.3: Service Model**

**What the user does:** Selects their service model and fee structure using toggle cards.

| Field | Type | Options / Range | Why It Matters |
| :---- | :---- | :---- | :---- |
| Fee Model | Multi-select toggle cards | AUM-based, Financial planning fees, Insurance products, Tax preparation, Hybrid | Determines compliance guardrails and offer framing |
| AUM Range | Range slider | $0–$10M, $10M–$50M, $50M–$100M, $100M–$500M, $500M+ | Segments firm size. Affects messaging sophistication level. |
| Primary Service Focus | Single-select cards | Retirement Planning, Tax Strategy, Wealth Management, Estate/Legacy, Comprehensive | Drives ICP weighting and offer archetype ranking |

## **Step 1.4: Current Client Profile**

**What the user does:** Describes their existing best clients using structured inputs. This is the strongest signal for ICP generation — who they actually serve well today, not who they aspire to serve.

| Field | Type | Details |
| :---- | :---- | :---- |
| Typical Client Age Range | Dual-handle slider | Range: 25–85. Default: 55–70. |
| Most Common Client Situation | Multi-select | Approaching retirement, Recently retired, Business owner, High-income earner, Inherited wealth, Federal employee, Divorcee/widow, Other |
| Average Household AUM | Range selector | $100K–$250K, $250K–$500K, $500K–$1M, $1M–$3M, $3M–$5M, $5M+ |
| Household Count | Number input | Approximate number of client households. Helps calibrate firm maturity. |

## **Step 1.5: Geography & Credentials**

| Field | Type | Details |
| :---- | :---- | :---- |
| Primary Market | Location autocomplete | City or metro area. Use Google Places API or similar. |
| Service Radius | Single-select | Local only, Regional, Statewide, Nationwide/Virtual |
| Credentials | Multi-select chips | CFP, CPA, CFA, RICP, ChFC, CLU, EA, JD, Other. Pre-check any detected from website. |

## **Data Storage**

All firm profile data stores in a firm\_profiles table (or equivalent) keyed by firm\_id. This data is referenced by every downstream AI generation call. Changes to the firm profile should trigger a prompt to re-evaluate existing ICP profiles.

# **5\. Phase 2: AI-Driven ICP Discovery**

## **Purpose**

The system processes all firm intake data and produces a structured Ideal Client Profile (ICP) recommendation. The advisor does not build their ICP from scratch. They review the AI’s recommendation and refine it using constrained controls. This is the moment the advisor should think “this system understands my business.”

## **Step 2.1: AI Generates ICP Recommendation**

**Trigger:** Automatic upon completing Firm Profile Setup.

**Inputs to AI:** Full firm profile (website analysis output, firm description, service model, current client profile, geography, credentials).

**AI Output Structure (the “ICP Card”):**

| Field | Example Output | How It’s Used Downstream |
| :---- | :---- | :---- |
| Persona Label | Pre-Retirees Focused on Tax-Efficient Income | Display name for the campaign; reference in prompts |
| Age Range | 55–67 | Ad targeting parameters; copy tone calibration |
| Income / Asset Band | $500K–$2M investable assets | Offer framing; messaging specificity |
| Life Stage | 5–10 years from retirement | Emotional trigger selection; urgency framing |
| Primary Financial Concern | Minimizing taxes on retirement income | Core ad angle; funnel headline direction |
| Secondary Concerns | Social Security optimization, healthcare costs | Supporting copy points; FAQ generation |
| Emotional Triggers | Fear of running out of money, desire for certainty, distrust of Wall Street | Hook variations; objection handling |
| Common Objections | I already have an advisor, I’m not ready yet, I can do this myself | Call prep; objection rebuttal generation |
| Recommended Tone | Professional but warm; avoid jargon; lead with empathy | Style constraint for all asset generation |

| Internal Classification (Not Shown to User) Behind the scenes, the AI maps the firm into one of Amplified’s archetype buckets: (1) Retirement-focused generalist, (2) Tax-heavy strategist, (3) Legacy/estate planner, or a weighted blend. This classification drives which prompt chains fire and which offer archetypes get ranked highest. The advisor never sees this label. |
| :---- |

## **Step 2.2: Advisor Refines ICP**

**What the user does:** Reviews the ICP Card and adjusts specific attributes using constrained controls. No free-text editing.

| Attribute | Control Type | Behavior |
| :---- | :---- | :---- |
| Age Range | Dual-handle slider | Adjust the range. System updates downstream copy calibration. |
| Asset Band | Dropdown selector | Choose from predefined ranges. |
| Primary Concern | Ranked radio buttons | Reorder by relevance to their practice. Top pick drives headline direction. |
| Emotional Triggers | Multi-select with toggle | Enable/disable specific triggers. Affects hook generation. |
| Tone | Slider: Conservative ↔ Conversational | Adjusts the style constraint applied to all generated copy. |

**System behavior:** Updates the ICP profile record. Recalculates generation parameters. The ICP is now “locked” for campaign use but can be duplicated or edited for future campaigns.

| Developer Note The ICP recommendation quality is the single most important AI interaction in the product. If this feels generic or wrong, the advisor loses trust immediately. The prompt engineering here needs to be exceptionally good at extracting real signal from the firm profile data — not just restating what the advisor already told us. Budget significant testing time for this step. |
| :---- |

# **6\. Phase 3: Offer Configuration**

## **Purpose**

Based on the confirmed ICP and firm profile, the system recommends proven offer types and the advisor selects and configures one. The offer archetype determines the CTA, funnel structure, sequence logic, and ad angle direction for the entire campaign.

## **Step 3.1: AI Recommends Offer Archetypes**

**System presents:** 2–3 offer types ranked by fit, each shown as a card with a brief description of why it matches their ICP.

**Offer Archetype Library (MVP):**

| Offer Archetype | Best Fit For | CTA Structure | Meeting Format |
| :---- | :---- | :---- | :---- |
| Retirement Readiness Review | Pre-retirees, recently retired | "Find out if you’re on track for the retirement you want" | 45-min assessment call |
| Tax Strategy Session | High-income, accumulators, Roth conversion candidates | "Discover if you’re overpaying in taxes on your investments" | 30-min tax review |
| Second Opinion Review | Broad appeal; people with existing advisors | "Get an objective second look at your current financial plan" | 45-min portfolio review |
| Estate & Legacy Consultation | Wealth transfer, older clients, family planning | "Start building a plan to protect what you’ve built" | 60-min planning session |
| Federal Employee Benefits Review | FERS/TSP-specific | "Make sure you’re maximizing your federal benefits" | 30-min benefits review |

| Expansion Note This library will grow over time as Amplified validates new offer types. The system should be architected so that adding a new offer archetype is a configuration/content change, not a code change. Each archetype should be a database record with associated prompt templates, not hardcoded logic. |
| :---- |

## **Step 3.2: Offer Customization**

**What the user does:** Tailors the selected offer within constrained bounds.

| Field | Type | Default | Notes |
| :---- | :---- | :---- | :---- |
| Meeting Type | Toggle: In-person / Virtual / Phone | Virtual | Affects CTA copy and scheduling logic |
| Meeting Length | Radio: 30 / 45 / 60 min | Per archetype default | Affects calendar setup instructions |
| Offer Name | Short text (40 char max) | Pre-filled from archetype | Optional override. Most will keep the default. |
| Exclusions | Multi-select chips | None | "Remove insurance language", "Remove tax language", etc. Adds negative constraints to generation. |

# **7\. Phase 4: Campaign Setup**

## **Purpose**

Create the campaign container that holds all generated assets and tracking parameters. This is a quick configuration step, not a deep workflow.

## **User Inputs**

| Field | Type | Default / Behavior |
| :---- | :---- | :---- |
| Campaign Name | Text (auto-suggested) | Auto-generated: “\[Market\] \[Persona Label\] — \[Offer Name\] — \[Quarter Year\]” |
| Target Launch Date | Date picker | Optional. Helps with deployment planning. |
| Primary Channel | Single-select cards | Paid Social (Meta), Email/Cold Outreach, Organic/Content (greyed out / future) |
| Monthly Ad Budget | Range selector | $500–$1K, $1K–$3K, $3K–$5K, $5K–$10K, $10K+. Optional. Helps calibrate expectations. |

## **System Behavior**

* Creates a Campaign record linked to firm\_id, icp\_id, and offer\_id.

* Sets channel flags that determine which asset types get generated in the next phase.

* Campaign status set to “In Progress.”

# **8\. Phase 5: Iterative Asset Generation**

| Critical Design Decision Asset generation is NOT a one-shot process where the advisor clicks "Generate" and gets a final package. It is an iterative, category-by-category flow where the advisor reviews each asset type, provides structured feedback, and the system refines before moving to the next category. This ensures the advisor feels ownership over the output without giving them a blank page. |
| :---- |

## **How the Iterative Flow Works**

The system generates assets in a defined sequence, one category at a time. For each category, the loop is:

1. System generates initial output for the category (using firm profile \+ ICP \+ offer \+ campaign config \+ any prior approved assets as context).

2. Advisor reviews the output. Each individual asset (e.g., each ad hook, each email in a sequence) is displayed as a reviewable card.

3. Advisor acts on each asset: Approve, Request Revision, or Flag for Removal.

4. For revision requests, the advisor provides structured feedback (not free-text rewriting): select what to change (tone, length, angle, proof emphasis, specific claim, compliance concern) and optionally add a brief note (100 char max).

5. System regenerates only the flagged assets using the feedback as additional constraints.

6. Repeat until the advisor approves all assets in the category, then advance to the next category.

| Why Iterative Matters A one-shot generation model creates a binary outcome: the advisor either accepts everything (unlikely) or rejects everything and loses confidence. The iterative model lets them shape the output without starting over. It also means earlier approved assets (e.g., ad copy) can inform later generation (e.g., landing page copy), creating coherence across the campaign. |
| :---- |

## **Generation Sequence & Asset Categories**

Assets are generated in this specific order because each category builds context for the next:

**Category 1: Ad Creative**

**What gets generated:** 3–5 hook variations (the attention-grabbing first line), primary text options (the body copy), headlines, and description text. All within compliance guardrails set by the firm’s compliance profile.

Display format: Each variation shown as a “mock ad card” with the hook, primary text, headline, and CTA laid out visually — not as raw text blocks.

Advisor actions per variation: Approve, Revise (select what to change: hook angle, tone, length, claim strength, add/remove proof element), or Remove.

**Minimum to proceed:** At least 2 approved ad variations.

**Category 2: Landing Page / Funnel Copy**

**What gets generated:** Section-by-section funnel copy: headline, subheadline, body sections (problem, solution, credibility, social proof framework, about the advisor), CTA section, and footer disclaimer. Not a single block of text — each section is independently reviewable.

**Context from prior step:** Approved ad creative informs the landing page headline and messaging consistency.

Advisor actions per section: Approve, Revise (what to change: messaging angle, length, tone, proof type, specificity level), or Flag.

**Minimum to proceed:** All required sections approved (headline, body, CTA at minimum).

**Category 3: Email / SMS Nurture Sequences**

**What gets generated:** Four distinct sequences, each shown as a timeline with individual messages:

* New lead nurture (5–7 messages over 14 days)

* Appointment confirmation \+ reminders (3 messages: confirmation, 24-hour reminder, 1-hour reminder)

* No-show recovery (3 messages over 48 hours)

* Long-term nurture (8–12 messages over 90 days for leads that don’t book immediately)

Display format: Each sequence shown as a vertical timeline. Each message is expandable to show subject line, body preview, and send timing.

Advisor actions per message: Approve, Revise (tone, urgency level, length, CTA strength), or Remove (with minimum count enforced per sequence).

**Category 4: Call Preparation Kit**

**What gets generated:** 

* Discovery questions tailored to the ICP (8–12 questions)

* Meeting agenda framework

* Objection rebuttals specific to this persona (5–8 objections with suggested responses)

* Closing framework / next-steps script

Advisor actions: Same approve/revise/remove pattern. This category typically has the fastest approval since advisors know their own sales process.

## **Technical Considerations for Generation**

* Each category’s prompt chain receives: the full firm profile, confirmed ICP, selected offer archetype, campaign config, AND all previously approved assets from earlier categories. This ensures messaging coherence across the campaign.

* Revision requests append structured constraints to the regeneration prompt, not replace the original prompt. Example: if an advisor flags an ad hook as “too aggressive,” the revision prompt adds “Constraint: soften tone, reduce urgency language” to the original generation parameters.

* Version history: every generation and revision is stored with a version number and the input parameters used. This matters for audit trails and future debugging.

* Rate limiting: put sensible limits on revision cycles (e.g., max 5 revisions per individual asset) to prevent infinite loops. If an advisor hits the limit, surface a message suggesting they contact support.

| Performance Note Generation for each category should complete in under 30 seconds. If using a large language model API, consider generating assets in parallel where dependencies allow. The ad creative generation can likely run 3–5 parallel API calls (one per variation) simultaneously. Sequence generation should batch efficiently. |
| :---- |

# **9\. Phase 6: Final Review & Compliance**

## **Purpose**

After all asset categories are approved through the iterative process, the advisor does a final review of the complete campaign package and completes a compliance acknowledgment before the system generates the deployment package.

## **Step 6.1: Campaign Summary View**

Present a read-only summary of all approved assets organized by category. The advisor can scroll through everything in one view to ensure consistency across the campaign. No editing at this stage — if they want to change something, they go back to the relevant category in Phase 5\.

## **Step 6.2: Compliance Self-Check**

A short checklist the advisor acknowledges before finalizing:

* "I confirm these assets do not contain performance guarantees or misleading claims."

* "I understand that my compliance team should review these materials before live deployment."

* "I confirm the firm information used to generate these assets is accurate and current."

**System behavior:** Logs the compliance acknowledgment with timestamp, user ID, and the specific asset versions acknowledged. This creates an audit trail. Campaign status moves to “Approved.”

| Legal Note This compliance check protects Amplified, not the advisor. It establishes that Amplified generated suggested materials and the advisor accepted responsibility for compliance review. Keep the language simple and non-intimidating — 3 checkboxes max. |
| :---- |

# **10\. Phase 7: Deployment Package**

## **Purpose**

Compile all approved assets into a structured deployment package that the advisor (or their team) can use to set up the campaign in HighLevel and other tools. For MVP, this is a guided manual process, not automated deployment.

## **What the System Produces**

1. Asset Export: All approved copy organized by placement. Ad copy in one section (formatted for Meta Ads Manager copy/paste), funnel copy in another (section by section with placement labels), sequences formatted for email/SMS tool import, call prep kit as a standalone document.

2. HighLevel Snapshot Reference: Which pre-built Amplified snapshot to deploy in their HighLevel sub-account. Instructions for requesting/installing the snapshot.

3. Setup Checklist: Step-by-step list of actions needed to go live. Includes domain connection, calendar integration (Calendly/HighLevel calendar), phone number provisioning, tracking pixel installation, UTM parameter configuration.

4. Configuration Values: Specific text/settings to enter in HighLevel or other tools. Copy-paste ready. Organized by where each value goes.

## **User Experience**

* The deployment package is presented as a multi-tab or multi-section view within the app.

* Each checklist item has a toggle for “Completed.” Advisor marks items done as they set up.

* A “Mark as Launched” button becomes available once a minimum number of checklist items are complete. Do not block launch if some items are incomplete — the advisor may have a team handling some steps.

* Offer a “Download All Assets” option that exports everything as a structured PDF or ZIP file.

## **Post-Launch**

* Campaign status moves to “Active.”

* The system could send automated check-in reminders (email) at 7, 14, and 30 days asking how the campaign is performing. This is optional for MVP but trivial to add.

* A simple results logging interface (manual input: booked calls, shows, closes, estimated AUM) is a strong future add but not required for MVP launch.

# **11\. Data Model & Entity Relationships**

## **Core Entities**

The following entities represent the minimum data model needed for MVP. Each entity includes its key fields and relationships.

| Entity | Key Fields | Relationships |
| :---- | :---- | :---- |
| Firm | firm\_id (PK), name, website\_url, website\_analysis (JSON), firm\_description, service\_model, aum\_range, primary\_focus, geography, created\_at | Has many: Users, ICP Profiles, Campaigns |
| User | user\_id (PK), firm\_id (FK), name, email, role (admin/member), created\_at | Belongs to: Firm |
| Firm Profile | profile\_id (PK), firm\_id (FK), client\_age\_range, client\_situations, avg\_household\_aum, household\_count, credentials, service\_radius, compliance\_flags (JSON) | Belongs to: Firm |
| ICP Profile | icp\_id (PK), firm\_id (FK), persona\_label, age\_range, asset\_band, life\_stage, primary\_concern, secondary\_concerns, emotional\_triggers, objections, tone\_setting, archetype\_classification, version, status | Belongs to: Firm. Used by: Campaigns |
| Offer | offer\_id (PK), archetype\_id (FK), firm\_id (FK), icp\_id (FK), meeting\_type, meeting\_length, custom\_name, exclusions, status | Belongs to: Firm, ICP Profile. References: Offer Archetype |
| Offer Archetype | archetype\_id (PK), name, description, best\_fit\_icp\_types, cta\_template, meeting\_format, prompt\_template\_ids (JSON) | Referenced by: Offers. This is a system-level table, not per-firm. |
| Campaign | campaign\_id (PK), firm\_id (FK), icp\_id (FK), offer\_id (FK), name, channel, budget\_range, launch\_date, status (in\_progress / approved / active / paused), created\_at | Belongs to: Firm. Has many: Asset Sets |
| Asset Set | asset\_set\_id (PK), campaign\_id (FK), category (ad\_creative / funnel\_copy / sequences / call\_prep), status (generating / in\_review / approved), created\_at | Belongs to: Campaign. Has many: Assets |
| Asset | asset\_id (PK), asset\_set\_id (FK), type (hook / primary\_text / headline / email / sms / section / question / rebuttal), content (text), version, status (draft / approved / removed), generation\_params (JSON), created\_at | Belongs to: Asset Set. Has many: Asset Revisions |
| Asset Revision | revision\_id (PK), asset\_id (FK), feedback\_type, feedback\_note, previous\_content, new\_content, version, created\_at | Belongs to: Asset |
| Compliance Log | log\_id (PK), campaign\_id (FK), user\_id (FK), acknowledgments (JSON), asset\_versions\_acknowledged (JSON), timestamp | Belongs to: Campaign, User |

## **Entity Relationship Summary**

Firm → Users (one-to-many). Firm → Firm Profile (one-to-one). Firm → ICP Profiles (one-to-many, as advisors may create multiple ICPs over time). Firm → Campaigns (one-to-many). Campaign links to exactly one ICP Profile and one Offer. Campaign → Asset Sets (one-to-many, one per category). Asset Set → Assets (one-to-many). Asset → Asset Revisions (one-to-many, tracking the feedback loop).

| Supabase Implementation Note All tables should have firm\_id for RLS policy enforcement. Enable Row-Level Security on every table. RLS policies should ensure users can only read/write data where firm\_id matches their own firm. The Offer Archetype table is the exception — it is system-level data readable by all authenticated users but writable only by Amplified admins. |
| :---- |

# **12\. Technical Architecture**

## **Stack Overview**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Database | Supabase (PostgreSQL) | Built-in RLS for multi-tenancy, auth, real-time subscriptions, audit logging. Fast to build on. |
| Auth | Supabase Auth | Email/password out of the box. Social auth later if needed. Handles email verification. |
| Backend / API | Supabase Edge Functions or Next.js API routes | Edge Functions for simple CRUD. Next.js API routes if the frontend is Next.js. Keep it simple. |
| Frontend | React (Next.js recommended) | The step-locked UX with conditional logic, constrained editing, and real-time generation feedback requires a proper React app. No-code tools will fight this. |
| AI / LLM | Anthropic Claude or OpenAI GPT-4 | API calls with structured system prompts. The prompt chains are the core IP — they live as versioned configurations, not hardcoded strings. |
| Website Scraping | Puppeteer, Cheerio, or a scraping API | For the firm website analysis step. Needs to handle SPAs and basic JavaScript rendering. |
| File Storage | Supabase Storage | For asset exports, deployment packages, and any uploaded firm assets. |
| Email (transactional) | Resend, SendGrid, or Supabase’s built-in | For email verification, post-launch check-ins, and system notifications. |
| Deployment / Hosting | Vercel (if Next.js) or similar | Fast deploys, preview environments, edge functions support. |

## **Architecture Principles**

1. Control plane, not full-stack replacement. The OS governs the workflow and generates assets. It does not replace HighLevel, Meta Ads Manager, or email sending tools. It produces outputs that go INTO those tools.

2. Configuration over code. Offer archetypes, prompt templates, compliance rules, and ICP archetype mappings should all be database-driven configurations, not hardcoded. Adding a new offer archetype or tweaking a prompt chain should not require a code deploy.

3. Versioning everything. Every generated asset, every prompt configuration, every firm profile change, every compliance acknowledgment gets versioned and timestamped. This is critical for audit trails and debugging.

4. Fail gracefully. If the website scrape fails, fall back to manual input. If AI generation produces something flagged by compliance rules, show a warning and offer to regenerate. Never leave the user stuck.

# **13\. AI / Prompt Architecture Considerations**

## **How Prompt Chains Work in This System**

The advisor never sees or writes a prompt. All AI generation uses pre-built prompt chains that receive structured variables from the firm profile, ICP, offer, and campaign configuration. A “prompt chain” is a sequence of one or more API calls where each call’s output may feed into the next call’s input.

## **Prompt Chain Structure (Conceptual)**

Each prompt chain consists of:

* System prompt: The fixed instruction set defining the AI’s role, constraints, tone rules, compliance guardrails, and output format. This is the core IP. It is versioned and stored in the database.

* Variable injection: Structured data from the application (firm profile fields, ICP fields, offer fields, previously approved assets) inserted into the prompt as clearly labeled context blocks.

* Output format specification: Explicit instruction for the AI to return structured output (JSON or clearly delimited sections) that the application can parse and render.

* Compliance layer: Rules embedded in the system prompt that prevent certain claim types, enforce conservative language, and flag risky outputs.

## **Example: Ad Creative Generation Chain**

1. Input assembly: System gathers firm\_profile \+ icp\_profile \+ offer\_config \+ compliance\_flags into a structured context block.

2. System prompt: "You are an expert financial services copywriter specializing in compliant advertising for RIAs. Generate ad creative for the following campaign. Follow these constraints: \[compliance rules\]. Match this tone: \[tone setting\]. Target this audience: \[ICP details\]. Promote this offer: \[offer details\]. Output exactly 4 variations in the following JSON format: \[format spec\]."

3. Parse response: Extract the structured output. Validate against compliance rules (regex/pattern matching for banned phrases, performance guarantee language, etc.).

4. Store as draft assets: Each variation becomes an Asset record with status \= "draft" and the generation parameters stored for audit.

## **Revision Prompt Pattern**

When an advisor requests a revision, the system does not re-run the entire chain. It takes the specific asset, the original generation parameters, the advisor’s structured feedback, and runs a targeted revision prompt:

*"Here is the original ad variation: \[content\]. The advisor requested the following change: \[feedback type: tone adjustment\]. Specific note: \[advisor note if provided\]. Regenerate this single variation with the requested adjustment while maintaining all other constraints and consistency with these approved assets: \[other approved variations\]."*

| Prompt Storage Architecture Prompt templates should be stored in a prompt\_templates table with: template\_id, category (ad\_creative, funnel\_copy, sequences, call\_prep), version, system\_prompt\_text, variable\_schema (JSON defining expected inputs), output\_schema (JSON defining expected output format), compliance\_rules (JSON), status (active/archived), created\_at. This allows prompt iteration without code deploys and enables A/B testing of prompt versions later. |
| :---- |

# **14\. Authentication, Multi-Tenancy & Security**

## **Multi-Tenant Isolation**

Every data table (except system-level reference tables like offer\_archetypes and prompt\_templates) must enforce Row-Level Security scoped to firm\_id. This is non-negotiable. A user from Firm A must never see, access, or modify data belonging to Firm B.

**Implementation:**

* Supabase RLS policies on every table: SELECT, INSERT, UPDATE, DELETE all filtered by firm\_id matching the authenticated user’s firm.

* The user’s firm\_id should be stored in a user\_profiles table or Supabase auth.users metadata and referenced in RLS policies via auth.uid().

* API routes / Edge Functions should also validate firm\_id server-side as a defense-in-depth measure.

## **Role-Based Access (MVP)**

Two roles for MVP:

* Admin: Full access to all features, firm profile editing, campaign creation, asset approval.

* Member: Can view campaigns and assets but cannot create campaigns or approve assets. Useful for the advisor’s team members.

Enforce in both the UI (hide/disable features) and the backend (RLS \+ API-level checks).

## **Security Posture (MVP)**

* Do not pursue SOC 2 pre-revenue. Design for it architecturally (clean logging, access controls, vendor documentation) so it is achievable later.

* Enforce HTTPS everywhere.

* Store no raw credentials. Use Supabase Auth for all authentication.

* Log meaningful events: logins, campaign creation, asset generation, compliance acknowledgments, deployment actions.

* Maintain a subprocessor list (Supabase, Vercel, Anthropic/OpenAI, any scraping service) for future DPA/security page needs.

# **15\. MVP Scope Boundaries**

## **What IS in the MVP**

| Feature | Status |
| :---- | :---- |
| Account creation and firm tenant setup | Build |
| Firm profile intake with website AI analysis | Build |
| AI-generated ICP recommendation with constrained refinement | Build |
| Offer archetype recommendation and configuration | Build |
| Campaign creation (basic container) | Build |
| Iterative AI asset generation (ads, funnel copy, sequences, call prep) | Build |
| Structured review/revision flow per asset | Build |
| Compliance self-check and acknowledgment logging | Build |
| Deployment package with build packet and checklists | Build |
| Version history for all generated assets | Build |
| Basic role-based access (Admin / Member) | Build |
| Asset export (PDF or ZIP download) | Build |

## **What is NOT in the MVP**

| Feature | Status | When |
| :---- | :---- | :---- |
| Attribution / AUM tracking ledger | Deferred | Phase 2 (post-launch) |
| Campaign performance dashboards | Deferred | Phase 2 |
| Automated HighLevel deployment | Deferred | Phase 2–3 |
| Cold email module | Deferred | Phase 2 |
| Meta Ads reporting integration | Deferred | Phase 3 |
| AI qualification / booking agent | Deferred | Phase 3 |
| Ads creation/editing inside the OS | Deferred | Phase 4 (post-funding) |
| Video/avatar AI modules | Deferred | Phase 4+ |
| Cross-firm benchmarking | Deferred | Phase 3+ |
| Billing / subscription management | Manual/Stripe | Add after founding cohort |
| **Scope Discipline** If a feature does not pass all three tests — (1) reduces user error without human support, (2) creates switching costs / stickiness, and (3) ties directly to measurable outcomes — it does not belong in the MVP. This list will be tempting to expand. Resist. |  |  |

# **16\. Build Sequence & Priority Order**

## **Recommended Build Order**

This sequence is designed so that each step produces something testable and each step builds on the previous one. Do not try to build all phases in parallel.

1. Database schema and auth setup. Create all tables from the data model. Implement RLS policies. Set up Supabase Auth with email verification. Build the user/firm creation flow. Test multi-tenant isolation. Estimated: 3–5 days.

2. Firm profile intake UI. Build the 5-step firm profile setup flow. Implement website scraping and AI analysis. Build the structured input forms (service model, client profile, geography). This is the foundation for everything else. Estimated: 5–7 days.

3. ICP generation engine. Build the AI prompt chain that processes firm profile data and generates the ICP recommendation. Build the ICP Card UI and the constrained refinement controls. Test with 5–10 real advisor websites to validate quality. Estimated: 5–7 days.

4. Offer archetype system. Create the offer\_archetypes table and seed with 4–5 initial archetypes. Build the recommendation and selection UI. Build the customization step. Estimated: 3–4 days.

5. Campaign container. Simple CRUD for campaigns with the auto-naming logic and channel/budget configuration. Estimated: 1–2 days.

6. Asset generation engine (the core). Build the prompt chain architecture (prompt template storage, variable injection, output parsing). Implement the iterative generation flow for all 4 categories. Build the review/revision UI. This is the largest and most critical build. Estimated: 10–15 days.

7. Compliance and deployment. Build the compliance acknowledgment flow. Build the deployment package generator (asset export, checklist, snapshot reference). Build the campaign status management. Estimated: 3–5 days.

8. Polish and founding cohort prep. End-to-end testing with real advisor data. UX polish. Error handling and edge cases. Onboarding flow refinements. Prepare for 10–25 founding users. Estimated: 5–7 days.

**Total estimated timeline:** 35–52 working days for a single developer working full-time. With parallel work on UI and backend, this compresses to 6–8 weeks.

| Milestone Checkpoints After steps 1–3 (database \+ firm profile \+ ICP), you have a testable product: an advisor can sign up and see their AI-generated ICP. This is a great early demo moment. After step 6 (asset generation), you have the sellable MVP. Steps 7–8 are polish for launch. Use these checkpoints to validate with real advisors before building further. |
| :---- |

**End of Document**

This is a living document. As decisions are made and features are built, this spec should be updated to reflect the current state of the product.