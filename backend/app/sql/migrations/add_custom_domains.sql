-- BYOD: custom_domains table for hostname -> firm resolution.
-- Run after native_platform_phases_1_4.sql (requires firm, campaign tables).
-- From backend dir: psql $DATABASE_URL -f app/sql/migrations/add_custom_domains.sql

CREATE TABLE IF NOT EXISTS custom_domains (
  id                    TEXT PRIMARY KEY DEFAULT gen_cuid(),
  hostname              TEXT NOT NULL UNIQUE,
  firm_id               TEXT NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  verified_at           TIMESTAMPTZ,
  default_campaign_id   TEXT REFERENCES campaign(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_hostname ON custom_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_custom_domains_firm_id ON custom_domains(firm_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status) WHERE status = 'verified';

COMMENT ON TABLE custom_domains IS 'BYOD: maps client custom hostnames to firm_id for tenant resolution';
