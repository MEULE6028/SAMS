-- Migration: Enhanced Sign-Out Applications to match UEAB official form
-- Date: 2025-10-28
-- Description: Add fields for room number, leave type, travel details, missed classes, and multi-level approval workflow

-- Add new columns to sign_out_applications table
ALTER TABLE sign_out_applications 
  ADD COLUMN IF NOT EXISTS room_number TEXT,
  ADD COLUMN IF NOT EXISTS means_of_travel TEXT NOT NULL DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS purpose_of_travel TEXT NOT NULL DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS leave_type TEXT CHECK (leave_type IN ('day_leave', 'overnight', 'weekend', 'other')) DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS leave_type_other TEXT,
  ADD COLUMN IF NOT EXISTS missed_classes TEXT,
  
  -- Multi-level approval workflow columns
  ADD COLUMN IF NOT EXISTS dorm_dean_approval TEXT CHECK (dorm_dean_approval IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dorm_dean_signed_by VARCHAR REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dorm_dean_signed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dorm_dean_notes TEXT,
  
  ADD COLUMN IF NOT EXISTS dean_of_students_approval TEXT CHECK (dean_of_students_approval IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dean_of_students_signed_by VARCHAR REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dean_of_students_signed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dean_of_students_notes TEXT,
  
  ADD COLUMN IF NOT EXISTS registrar_approval TEXT CHECK (registrar_approval IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS registrar_signed_by VARCHAR REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS registrar_signed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS registrar_notes TEXT,
  
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- Make reason optional (it's now captured in purpose_of_travel)
ALTER TABLE sign_out_applications ALTER COLUMN reason DROP NOT NULL;

-- Update existing records to have default values for new fields
UPDATE sign_out_applications 
SET 
  means_of_travel = COALESCE(means_of_travel, 'Not Specified'),
  purpose_of_travel = COALESCE(purpose_of_travel, COALESCE(reason, 'Not Specified')),
  leave_type = COALESCE(leave_type, 'other'),
  dorm_dean_approval = COALESCE(dorm_dean_approval, 'pending'),
  dean_of_students_approval = COALESCE(dean_of_students_approval, 'pending'),
  registrar_approval = COALESCE(registrar_approval, 'pending'),
  submitted_at = COALESCE(submitted_at, created_at)
WHERE means_of_travel IS NULL OR purpose_of_travel IS NULL;

-- Create index for faster approval workflow queries
CREATE INDEX IF NOT EXISTS idx_sign_out_dorm_dean_approval ON sign_out_applications(dorm_dean_approval, dorm_dean_signed_by);
CREATE INDEX IF NOT EXISTS idx_sign_out_dean_approval ON sign_out_applications(dean_of_students_approval, dean_of_students_signed_by);
CREATE INDEX IF NOT EXISTS idx_sign_out_registrar_approval ON sign_out_applications(registrar_approval, registrar_signed_by);
CREATE INDEX IF NOT EXISTS idx_sign_out_submitted_at ON sign_out_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_sign_out_leave_type ON sign_out_applications(leave_type);

-- Add comments for documentation
COMMENT ON COLUMN sign_out_applications.room_number IS 'Student dormitory room number';
COMMENT ON COLUMN sign_out_applications.means_of_travel IS 'How the student will travel (car, bus, matatu, etc)';
COMMENT ON COLUMN sign_out_applications.purpose_of_travel IS 'Reason for leaving campus';
COMMENT ON COLUMN sign_out_applications.leave_type IS 'Type of leave: day_leave, overnight, weekend, or other';
COMMENT ON COLUMN sign_out_applications.missed_classes IS 'JSON array of classes that will be missed with instructor approvals';
COMMENT ON COLUMN sign_out_applications.dorm_dean_approval IS 'First level approval from dormitory dean';
COMMENT ON COLUMN sign_out_applications.dean_of_students_approval IS 'Second level approval from dean of students';
COMMENT ON COLUMN sign_out_applications.registrar_approval IS 'Final level approval from registrar';
COMMENT ON COLUMN sign_out_applications.submitted_at IS 'When the student submitted the form (must be 3+ days before departure)';

COMMENT ON TABLE sign_out_applications IS 'Student sign-out/leave requests matching UEAB official form. Requires multi-level approval: Dorm Dean → Dean of Students → Registrar. Students limited to 4 sign-outs per semester.';
