-- Enhanced Work Study Application Workflow
-- Adds automated eligibility checking, appeals, and supervisor review stages

-- Update status enum to include new workflow stages
ALTER TABLE work_applications ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS work_application_status CASCADE;
CREATE TYPE work_application_status AS ENUM (
  'pending',
  'under_review',
  'auto_rejected',
  'appealed',
  'supervisor_review',
  'approved',
  'rejected'
);
ALTER TABLE work_applications ALTER COLUMN status TYPE work_application_status USING status::work_application_status;
ALTER TABLE work_applications ALTER COLUMN status SET DEFAULT 'pending';

-- Add eligibility check fields
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS eligibility_checked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS eligibility_passed BOOLEAN;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS eligibility_details TEXT;

-- Add fee balance check fields
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS fee_balance_at_submission DECIMAL(10, 2);
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS fee_balance_eligible BOOLEAN;

-- Add registration check fields
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS is_registered_current_semester BOOLEAN;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS credit_hours_at_submission INTEGER;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS credit_hours_eligible BOOLEAN;

-- Add appeal fields
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS has_appealed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS appeal_reason TEXT;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS appealed_at TIMESTAMP;
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS appeal_reviewed_by VARCHAR REFERENCES users(id);
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS appeal_review_notes TEXT;

-- Add supervisor review fields
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS supervisor_id VARCHAR REFERENCES users(id);
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS supervisor_reviewed_at TIMESTAMP;

-- Add submitted_at timestamp
ALTER TABLE work_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_work_applications_status ON work_applications(status);
CREATE INDEX IF NOT EXISTS idx_work_applications_supervisor ON work_applications(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_work_applications_eligibility ON work_applications(eligibility_passed);

-- Create view for applications needing supervisor review
CREATE OR REPLACE VIEW supervisor_pending_applications AS
SELECT 
  wa.*,
  u.full_name as student_name,
  u.student_id,
  u.email
FROM work_applications wa
JOIN users u ON wa.user_id = u.id
WHERE wa.status = 'supervisor_review'
ORDER BY wa.submitted_at ASC;

-- Create view for auto-rejected applications (eligible for appeal)
CREATE OR REPLACE VIEW appealable_applications AS
SELECT 
  wa.*,
  u.full_name as student_name,
  u.student_id,
  u.email
FROM work_applications wa
JOIN users u ON wa.user_id = u.id
WHERE wa.status = 'auto_rejected' 
  AND wa.has_appealed = false
  AND wa.created_at >= NOW() - INTERVAL '30 days' -- 30 day appeal window
ORDER BY wa.created_at DESC;

-- Add comments for documentation
COMMENT ON COLUMN work_applications.status IS 'Workflow: pending → under_review → [auto_rejected (appealable) OR supervisor_review] → [approved OR rejected]';
COMMENT ON COLUMN work_applications.eligibility_details IS 'JSON object with detailed check results: {feeBalance: {pass: bool, message: string}, registration: {...}, creditHours: {...}}';
COMMENT ON COLUMN work_applications.appeal_reason IS 'Student explanation for why auto-rejection should be reconsidered';
