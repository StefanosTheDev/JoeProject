-- Native Platform Stack: Phases 1-4 tables
-- Run after schema.sql. Requires: firm, campaign tables.
--
-- From backend dir: psql $DATABASE_URL -f app/sql/migrations/native_platform_phases_1_4.sql
-- Or in Supabase SQL editor: paste and run this file.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION gen_cuid() RETURNS text AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$ LANGUAGE sql;

-- contacts (Phase 1 + 2)
CREATE TABLE IF NOT EXISTS contacts (
  id                    TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id               TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  first_name            TEXT,
  last_name             TEXT,
  email                 TEXT,
  phone                 TEXT,
  imessage_capable      BOOLEAN DEFAULT NULL,
  source                TEXT,
  utm_data              JSONB DEFAULT '{}',
  tags                  TEXT[] DEFAULT '{}',
  pipeline_stage        TEXT DEFAULT 'new_lead',
  calendly_invitee_uri  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_firm_id ON contacts(firm_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(firm_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(firm_id, phone);

-- messages (Phase 1)
CREATE TABLE IF NOT EXISTS messages (
  id                TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id           TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  contact_id        TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel           TEXT NOT NULL CHECK (channel IN ('imessage', 'sms', 'email')),
  direction         TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content           TEXT NOT NULL DEFAULT '',
  media_url         TEXT,
  sendblue_handle   TEXT,
  resend_email_id   TEXT,
  status            TEXT DEFAULT 'sent',
  read_at           TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_firm_created ON messages(firm_id, created_at DESC);

-- opportunities (Phase 3)
CREATE TABLE IF NOT EXISTS opportunities (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id             TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  contact_id          TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  pipeline_stage      TEXT NOT NULL DEFAULT 'new_lead',
  monetary_value      NUMERIC(12,2),
  source_campaign_id TEXT REFERENCES campaign(id) ON DELETE SET NULL,
  source_ad_id        TEXT,
  booked_at           TIMESTAMPTZ,
  showed_at           TIMESTAMPTZ,
  won_at              TIMESTAMPTZ,
  lost_at             TIMESTAMPTZ,
  lost_reason         TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_firm_stage ON opportunities(firm_id, pipeline_stage);

-- calendly_connections (Phase 3)
CREATE TABLE IF NOT EXISTS calendly_connections (
  id                TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id           TEXT NOT NULL UNIQUE REFERENCES firm(id) ON DELETE CASCADE,
  access_token      TEXT NOT NULL,
  refresh_token     TEXT NOT NULL,
  calendly_user_uri TEXT,
  event_type_uri    TEXT,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- zoom_connections (Phase 3) — app-level S2S; can later add per-firm if needed
CREATE TABLE IF NOT EXISTS zoom_connections (
  id           TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id      TEXT NOT NULL UNIQUE REFERENCES firm(id) ON DELETE CASCADE,
  account_id   TEXT NOT NULL,
  client_id    TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sendblue_config (Phase 1 — per-firm optional; app-level keys in env for MVP)
CREATE TABLE IF NOT EXISTS sendblue_config (
  id         TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id    TEXT NOT NULL UNIQUE REFERENCES firm(id) ON DELETE CASCADE,
  phone_number TEXT,
  api_key_id TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- funnel_pages (Phase 2)
CREATE TABLE IF NOT EXISTS funnel_pages (
  id           TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id      TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  campaign_id  TEXT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  page_type    TEXT NOT NULL CHECK (page_type IN ('registration', 'vsl', 'webinar', 'booking')),
  slug         TEXT NOT NULL,
  content      JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(firm_id, campaign_id, page_type)
);

-- page_analytics (Phase 2)
CREATE TABLE IF NOT EXISTS page_analytics (
  id         TEXT PRIMARY KEY DEFAULT gen_cuid(),
  firm_id    TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  page_id    TEXT REFERENCES funnel_pages(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  utm_data   JSONB DEFAULT '{}',
  referrer   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_analytics_page_id ON page_analytics(page_id);

-- webinar_sessions (Phase 4)
CREATE TABLE IF NOT EXISTS webinar_sessions (
  id                   TEXT PRIMARY KEY DEFAULT gen_cuid(),
  campaign_id          TEXT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  scheduled_at         TIMESTAMPTZ NOT NULL,
  is_active            BOOLEAN DEFAULT true,
  mux_playback_id      TEXT,
  chat_enabled         BOOLEAN DEFAULT true,
  replay_available_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinar_sessions_campaign ON webinar_sessions(campaign_id);

-- webinar_registrations (Phase 4)
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id                    TEXT PRIMARY KEY DEFAULT gen_cuid(),
  session_id            TEXT NOT NULL REFERENCES webinar_sessions(id) ON DELETE CASCADE,
  contact_id            TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  registered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended              BOOLEAN DEFAULT false,
  watch_duration_seconds INT DEFAULT 0,
  booked_call           BOOLEAN DEFAULT false,
  UNIQUE(session_id, contact_id)
);

-- webinar_chat_messages (Phase 4)
CREATE TABLE IF NOT EXISTS webinar_chat_messages (
  id             TEXT PRIMARY KEY DEFAULT gen_cuid(),
  session_id     TEXT NOT NULL REFERENCES webinar_sessions(id) ON DELETE CASCADE,
  contact_id     TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  message        TEXT NOT NULL,
  is_ai_response BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- webinar_cta_events (Phase 4)
CREATE TABLE IF NOT EXISTS webinar_cta_events (
  id             TEXT PRIMARY KEY DEFAULT gen_cuid(),
  session_id     TEXT NOT NULL REFERENCES webinar_sessions(id) ON DELETE CASCADE,
  contact_id     TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  cta_type       TEXT NOT NULL,
  timestamp_shown TIMESTAMPTZ NOT NULL,
  clicked        BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
