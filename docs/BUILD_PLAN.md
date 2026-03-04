# Amplified Growth OS — MVP Build Plan & Milestones

**Purpose:** Single source of truth for what we're building and in what order. Aligns the Feature Specification and the MVP Build Specification.

**Last updated:** March 2026

---

## Tech Stack & MVP Simplifications

| Layer | Choice | Notes |
|-------|--------|--------|
| **Frontend** | Next.js | Step-locked UI, App Router. |
| **Hosting** | Vercel | Deploy and preview. |
| **Database** | PostgreSQL + Prisma | Tables, queries; schema in `prisma/schema.prisma`. |
| **Auth** | **None for MVP** | Skip login/sign-up to ship fast. Add auth later when we need multi-firm/security. |

We're optimizing for **speed MVP**. That means:

- **No authentication** — No login/sign-up for MVP. One user/session or single-tenant flow. Add auth later when we need multi-firm/security.
- **Feature Specification is primary** — When the Feature Spec and Build Spec disagree on scope, we follow the **Feature Spec** (e.g. video pipeline, attribution foundation can stay in scope if we want them; we care more about the product feature set).
- **Proper infrastructure** — We use PostgreSQL + Prisma with a clear schema (`firm_id` and FKs) so we can add auth and multi-tenancy later without a rewrite.

---

## 1. What We're Building (Aligned MVP Scope)

We're building the **Amplified Advisors Growth OS**: a step-locked web app that guides financial advisors from firm setup → AI-generated Ideal Client Profile (ICP) → offer selection → **iterative AI asset generation** (ads, funnel copy, email/SMS sequences, call prep) → compliance check → deployment package. Advisors never write prompts; they use structured inputs only (one free-text field in the whole flow: firm description).

| Source | Feature | In MVP? |
|--------|---------|---------|
| Both | Guided campaign workflow (Firm → ICP → Offer → Campaign → Assets → Review → Deploy) | ✅ Yes |
| Both | AI asset generator (4 categories, iterative approve/revise loop) | ✅ Yes |
| Both | Compliance self-check + acknowledgment logging | ✅ Yes |
| Both | Deployment package (checklists, asset export, HighLevel snapshot ref) | ✅ Yes |
| Both | Version history for all assets + RBAC (Admin / Member) | ✅ Yes |
| Feature Spec | Video editing pipeline + credit system | ✅ Feature spec says MVP |
| Build Spec | Video / avatar modules | ❌ Defers to Phase 4+ |
| Feature Spec | Attribution foundation (appointment ledger, UTM, AUM events) | ✅ Feature spec says MVP |
| Build Spec | Attribution / AUM ledger, dashboards | ❌ Defers to Phase 2 |

**Decision for this build:** We follow the **Feature Spec** as the product source. Scope for this MVP:

- **In this MVP:** Firm profile + website AI analysis, ICP discovery, offer config, campaign container, **full iterative asset generation**, compliance + deployment package, asset export. Optionally video pipeline and attribution foundation per Feature Spec when we’re ready.
- **No auth for MVP** — single-session or single-firm flow; add auth + RBAC later.
- **Defer to later:** Meta Ads integration, full funnel builder, native email/SMS, AI video (per roadmap).

---

## 2. Core User Journey (Phases 0–7)

| Phase | Name | What we build |
|-------|------|----------------|
| **0** | (No auth) | No sign-up for MVP. User lands directly on Firm Profile or campaign flow. Single session/firm. |
| **1** | Firm profile setup | Website URL → scrape + AI analysis; firm description (only free-text); service model, client profile, geography, credentials. One-time, then reused. |
| **2** | ICP discovery | AI generates ICP recommendation from firm profile; advisor refines with sliders/toggles (no free-text). ICP “locked” for campaign. |
| **3** | Offer configuration | System recommends 2–3 offer archetypes; advisor selects one; configures meeting type/length/exclusions. |
| **4** | Campaign setup | Campaign name (auto-suggested), channel, optional budget/launch date. Creates campaign linked to firm + ICP + offer. |
| **5** | Iterative asset generation | Generate by category: (1) Ad creative → (2) Funnel copy → (3) Email/SMS sequences → (4) Call prep. Per asset: Approve / Revise (structured feedback) / Remove. Regenerate only flagged items; min 2 ads, required funnel sections, etc. |
| **6** | Review & compliance | Summary of all approved assets; 3 compliance checkboxes; log acknowledgment + asset versions; status → Approved. |
| **7** | Deployment package | Export package: asset export (ZIP), HighLevel snapshot reference, setup checklist (with “Completed” toggles), config values. “Mark as Launched” when ready. |

---

## 3. Technical Foundation

- **Frontend:** Next.js (React), step-locked UI, constrained inputs. Deploy on **Vercel**.
- **Database:** PostgreSQL with Prisma. Schema in `prisma/schema.prisma`; `firm_id` on tenant tables for future multi-tenant/auth. No auth for MVP.
- **Storage:** Local filesystem or a bucket (e.g. Vercel Blob, S3) for asset exports and deployment packages — add when needed.
- **AI:** OpenAI (API key server-side only); prompt chains in DB (versioned), variable injection from firm/ICP/offer/approved assets.

Principles: configuration over code (offer archetypes, prompt templates in DB); version everything; fail gracefully (e.g. scrape fail → manual input). Infrastructure is “auth-ready” but we don’t implement auth until post-MVP.

---

## 4. Milestones (How We Approach the Build)

We build in this order so each milestone is testable and builds on the previous one.

---

### Milestone 1 — Foundation (PostgreSQL + Prisma, No Auth)

**Goal:** PostgreSQL database and Prisma schema in place so we can persist firm profile, ICP, campaigns, and assets. No auth — speed MVP.

**Deliverables:**

- PostgreSQL database (local or hosted: Neon, Vercel Postgres, Railway, etc.). `DATABASE_URL` in `.env.local`.
- Prisma schema (`prisma/schema.prisma`) with all entities: Firm, FirmProfile, IcpProfile, OfferArchetype, Offer, Campaign, AssetSet, Asset, AssetRevision, ComplianceLog. Run `db:push` or `db:migrate` to apply.
- Next.js app wired to Prisma via `src/lib/prisma.ts`. Simple landing or direct entry to Firm Profile step.
- Optional: single default firm or session-based “current firm” so the flow has a firm_id to attach data to.

**Success criteria:** We can create/read firm profile and campaign-related data from the app; no login/sign-up required.

**Rough estimate:** 2–3 days.

---

### Milestone 2 — Firm Profile Setup (Phase 1)

**Goal:** One-time firm intake with website AI analysis and structured inputs.

**Deliverables:**

- Step 1.1: Website URL input → scrape + AI extraction (services, client signals, tone, credentials, geography). Loading states; fallback to manual if scrape fails.
- Step 1.2: Firm description (textarea, 300 chars, pre-filled from analysis) — only free-text in MVP.
- Step 1.3: Service model (fee model, AUM range, primary focus) — toggle/select.
- Step 1.4: Current client profile (age range, situations, avg AUM, household count).
- Step 1.5: Geography + credentials (location, service radius, credential chips).
- Persist to `firm_profiles` (and related); completion state so “returning” flow (e.g. same session or same firm) can skip to Phase 2.

**Success criteria:** Advisor completes firm profile once; data is saved and used later; second campaign reuses same profile.

**Rough estimate:** 5–7 days.

---

### Milestone 3 — ICP Discovery (Phase 2)

**Goal:** AI-generated ICP recommendation and constrained refinement.

**Deliverables:**

- On Firm Profile complete: trigger ICP generation (prompt chain: firm profile → structured ICP output).
- ICP “card” UI: persona label, age range, asset band, life stage, primary/secondary concerns, emotional triggers, objections, tone.
- Refinement controls: sliders, dropdowns, ranked selects only (no free-text).
- Save ICP; “lock” for use in campaigns; optional “duplicate ICP” for future campaigns.
- Internal archetype classification (not shown) for offer ranking.

**Success criteria:** Advisor sees an ICP that “feels right” for their firm; can refine and lock it; quality good enough to trust for next steps.

**Rough estimate:** 5–7 days.

---

### Milestone 4 — Offer Configuration & Campaign Setup (Phases 3–4)

**Goal:** Advisor selects offer and creates a campaign container.

**Deliverables:**

- Offer archetypes table seeded with 4–5 types (e.g. Retirement Readiness Review, Tax Strategy Session, Second Opinion, Estate & Legacy, Federal Employee).
- AI recommendation: rank 2–3 offers by fit to ICP; show as cards with short “why” copy.
- Offer customization: meeting type (in-person/virtual/phone), length, optional name override, exclusions (chips).
- Campaign creation: name (auto from market + persona + offer + quarter), channel (Paid Social, Email, Organic greyed out), optional budget range and launch date.
- Campaign record linked to firm_id, icp_id, offer_id; status “In Progress”.

**Success criteria:** Advisor can pick an offer, tweak it, create a named campaign and land in “Campaign in progress” state.

**Rough estimate:** 4–6 days (3–4 for offer, 1–2 for campaign).

---

### Milestone 5 — Asset Generation Engine (Phase 5 — Core)

**Goal:** Full iterative generation for all 4 categories with approve/revise/remove.

**Deliverables:**

- Prompt chain architecture: prompt templates in DB, variable injection (firm, ICP, offer, campaign, prior approved assets), structured output (JSON), compliance layer.
- Category 1 — Ad creative: 3–5 hooks, primary text, headlines, descriptions, disclaimers. Mock ad card UI. Min 2 approved to proceed.
- Category 2 — Funnel copy: sections (headline, problem, solution, credibility, CTA, FAQ, disclaimer). Section-by-section review; required sections must be approved.
- Category 3 — Sequences: 4 sequence types (new lead nurture, appointment confirmation, no-show recovery, long-term nurture). Timeline UI; email + SMS variants; per-message approve/revise.
- Category 4 — Call prep: discovery questions, agenda, objection rebuttals, closing script.
- Revision flow: structured feedback (tone, length, angle, etc.) + optional 100-char note; regenerate only flagged assets; version history; max 5 revisions per asset.
- Compliance: no performance guarantees; post-generation regex check for banned phrases.

**Success criteria:** Advisor gets a full asset package from structured inputs only; can refine per asset without full regeneration; messaging coherent across categories; version history stored.

**Rough estimate:** 10–15 days.

---

### Milestone 6 — Review, Compliance & Deployment (Phases 6–7)

**Goal:** Final review, compliance acknowledgment, and deployment package.

**Deliverables:**

- Phase 6: Campaign summary (read-only) of all approved assets; 3 compliance checkboxes; log acknowledgment with timestamp + asset version IDs; status → Approved.
- Phase 7: Deployment package view — asset export (by placement), HighLevel snapshot reference, step-by-step checklist with “Completed” toggles, config values; “Download All Assets” (ZIP); “Mark as Launched” (min checklist items, not hard-block).
- Campaign status: In Progress → Approved → Active.
- Approval gates: cannot advance past asset gen without required approvals; cannot mark Launched without compliance check.

**Success criteria:** Advisor can review, acknowledge compliance, get a clear deployment package and mark campaign launched.

**Rough estimate:** 3–5 days.

---

### Milestone 7 — Polish & Launch Prep

**Goal:** Safe for founding cohort / demos.

**Deliverables:**

- End-to-end testing with real advisor-like data.
- UX polish: loading states, errors, edge cases (scrape fail, AI failure, rate limits).
- Audit: compliance export (asset versions + acknowledgments) for any campaign.
- Optional: 7/14/30-day check-in email after launch. RBAC deferred until we add auth.

**Success criteria:** An advisor can complete the full flow (firm profile → deployed campaign) without getting stuck; no auth required for MVP.

**Rough estimate:** 5–7 days.

---

## 5. Timeline Summary

| Milestone | Focus | Est. days |
|-----------|--------|-----------|
| M1 | Foundation (PostgreSQL + Prisma, no auth) | 2–3 |
| M2 | Firm profile + website AI | 5–7 |
| M3 | ICP discovery | 5–7 |
| M4 | Offer + campaign setup | 4–6 |
| M5 | Asset generation (all 4 categories) | 10–15 |
| M6 | Compliance + deployment package | 3–5 |
| M7 | Polish + launch prep | 5–7 |
| **Total** | | **35–52** |

With one focused developer and some parallelization (e.g. UI + backend): **~6–8 weeks** to sellable MVP.

---

## 6. What We're Building *Today* (Starter Focus)

To get on the same page for *today*:

1. **Scope:** Feature Spec is primary. Full workflow through Phase 7; video and attribution in scope when we’re ready. No auth for MVP.
2. **Stack:** Next.js, Vercel, PostgreSQL, Prisma (no Auth).
3. **Start at M1:** PostgreSQL + Prisma schema and client. Then M2 (Firm profile UI + website scrape + AI).
4. **Sequence:** Foundation → firm profile → ICP → offer/campaign → assets → compliance/deploy. Proper infrastructure, speed-first.

---

## 7. References

- **Feature spec (product source):** `Amplified_OS_Feature_Specification.docx.md` — product features, acceptance criteria, future roadmap. We prioritize this for *what* to build.
- **Build spec:** `Amplified_OS_MVP_Build_Specification.docx.md` — phases, data model, prompt architecture, build order. We use it for *how* and structure; we skip auth and defer RLS for speed MVP.

Both live in the repo root; this plan is the single execution view. Stack: Next.js, Vercel, PostgreSQL, Prisma (no auth for MVP).
