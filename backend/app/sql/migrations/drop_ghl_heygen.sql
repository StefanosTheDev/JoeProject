-- Migration: Remove GHL and HeyGen tables.
-- Run after deploying the removal of GHL and HeyGen integrations.
-- Keeps advisor_voices for "bring your own voice" (ElevenLabs).
--
-- Run: psql -d your_database -f backend/app/sql/migrations/drop_ghl_heygen.sql

-- HeyGen: drop in FK order (video_generation_log -> generated_videos -> video_templates; advisor_avatars standalone)
DROP TABLE IF EXISTS video_generation_log CASCADE;
DROP TABLE IF EXISTS generated_videos CASCADE;
DROP TABLE IF EXISTS video_templates CASCADE;
DROP TABLE IF EXISTS advisor_avatars CASCADE;

-- GHL: no FKs between these tables
DROP TABLE IF EXISTS ghl_opportunities CASCADE;
DROP TABLE IF EXISTS ghl_appointments CASCADE;
DROP TABLE IF EXISTS ghl_contacts_sync CASCADE;
DROP TABLE IF EXISTS ghl_webhook_log CASCADE;
DROP TABLE IF EXISTS ghl_custom_values CASCADE;
DROP TABLE IF EXISTS ghl_connections CASCADE;
