-- Migration: Add earnings calculation fields to timecards
-- Date: November 2, 2025

-- Add hourly_rate and earnings columns
ALTER TABLE "timecards" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(6, 2);
ALTER TABLE "timecards" ADD COLUMN IF NOT EXISTS "earnings" numeric(8, 2);

-- Add comment
COMMENT ON COLUMN timecards.hourly_rate IS 'Hourly wage rate in ETB based on department';
COMMENT ON COLUMN timecards.earnings IS 'Total earnings calculated as hours × rate (populated after verification)';
