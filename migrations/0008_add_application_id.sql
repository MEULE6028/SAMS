-- Migration to add application_id column to work_applications table
-- Run Date: November 2, 2025

-- Add application_id column
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "application_id" text;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'work_applications_application_id_unique'
    ) THEN
        ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_application_id_unique" UNIQUE("application_id");
    END IF;
END $$;

-- Generate IDs for existing applications (if any)
-- This will need to be done programmatically or manually for each record
UPDATE work_applications 
SET application_id = 'WS-2025-' || substr(md5(random()::text), 1, 5)
WHERE application_id IS NULL;
