-- Add Zoom meeting fields to opportunities (Zoom-on-book flow).
-- Run: psql $DATABASE_URL -f app/sql/migrations/add_zoom_to_opportunities.sql

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
  ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
