-- Manual migration to add missing columns
-- Run this if drizzle-kit push doesn't detect changes

-- Add student_id to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_id" text;
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_student_id_unique" UNIQUE("student_id");

-- Make gender and marital_status nullable in work_applications
ALTER TABLE "work_applications" ALTER COLUMN "gender" DROP NOT NULL;
ALTER TABLE "work_applications" ALTER COLUMN "marital_status" DROP NOT NULL;

-- Add eligibility tracking fields
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_checked" boolean DEFAULT false NOT NULL;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_passed" boolean;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_details" text;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "fee_balance_at_submission" numeric(10, 2);
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "fee_balance_eligible" boolean;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "is_registered_current_semester" boolean;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "credit_hours_at_submission" integer;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "credit_hours_eligible" boolean;

-- Add appeal fields
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "has_appealed" boolean DEFAULT false NOT NULL;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_reason" text;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appealed_at" timestamp;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_reviewed_by" varchar;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_review_notes" text;

-- Add supervisor fields
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "supervisor_id" varchar;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "supervisor_reviewed_at" timestamp;
ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'work_applications_appeal_reviewed_by_users_id_fk'
    ) THEN
        ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_appeal_reviewed_by_users_id_fk" 
        FOREIGN KEY ("appeal_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'work_applications_supervisor_id_users_id_fk'
    ) THEN
        ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_supervisor_id_users_id_fk" 
        FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
