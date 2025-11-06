-- Migration: Enhanced Work Study Applications to match UEAB DVC-SAS form
-- Date: 2025-10-28
-- Description: Add comprehensive fields matching official UEAB Work Study Program application

-- Add new columns to work_applications table
ALTER TABLE work_applications 
  -- Basic Personal Information
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS age INTEGER NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')) NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS major TEXT NOT NULL DEFAULT 'Not Specified',
  ADD COLUMN IF NOT EXISTS academic_classification TEXT NOT NULL DEFAULT 'Freshman',
  ADD COLUMN IF NOT EXISTS mobile_contact TEXT NOT NULL DEFAULT '',
  
  -- Sponsorship Information
  ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsor_name TEXT,
  
  -- Work Experience
  ADD COLUMN IF NOT EXISTS work_experiences TEXT,
  ADD COLUMN IF NOT EXISTS has_worked_on_campus_before BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS previous_campus_work_location TEXT,
  
  -- UEAB Registration & Work History
  ADD COLUMN IF NOT EXISTS first_registration_year TEXT,
  ADD COLUMN IF NOT EXISTS first_registration_semester TEXT,
  ADD COLUMN IF NOT EXISTS started_working_month TEXT,
  ADD COLUMN IF NOT EXISTS started_working_year TEXT,
  
  -- Current Application Details (position already exists)
  ADD COLUMN IF NOT EXISTS is_registering_first_semester BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registered_units_hours INTEGER,
  
  -- Financial Information
  ADD COLUMN IF NOT EXISTS account_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS latest_account_balance DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS account_statement_attached BOOLEAN NOT NULL DEFAULT false,
  
  -- Legacy fields for backward compatibility
  ADD COLUMN IF NOT EXISTS availability TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT,
  ADD COLUMN IF NOT EXISTS previous_experience TEXT,
  
  -- Rules Acknowledgment
  ADD COLUMN IF NOT EXISTS rules_acknowledged BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP,
  
  -- Signature & Submission
  ADD COLUMN IF NOT EXISTS signature_data TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP;

-- Update existing records with default values
UPDATE work_applications 
SET 
  full_name = COALESCE(full_name, 'Legacy Application'),
  gender = COALESCE(gender, 'male'),
  age = COALESCE(age, 20),
  marital_status = COALESCE(marital_status, 'single'),
  major = COALESCE(major, 'Not Specified'),
  academic_classification = COALESCE(academic_classification, 'Freshman'),
  mobile_contact = COALESCE(mobile_contact, ''),
  account_number = COALESCE(account_number, 'LEGACY-000'),
  is_sponsored = COALESCE(is_sponsored, false),
  has_worked_on_campus_before = COALESCE(has_worked_on_campus_before, false),
  is_registering_first_semester = COALESCE(is_registering_first_semester, false),
  account_statement_attached = COALESCE(account_statement_attached, false),
  rules_acknowledged = COALESCE(rules_acknowledged, true)
WHERE full_name IS NULL OR account_number IS NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_work_apps_gender ON work_applications(gender);
CREATE INDEX IF NOT EXISTS idx_work_apps_academic_class ON work_applications(academic_classification);
CREATE INDEX IF NOT EXISTS idx_work_apps_is_sponsored ON work_applications(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_work_apps_campus_work ON work_applications(has_worked_on_campus_before);
CREATE INDEX IF NOT EXISTS idx_work_apps_first_reg_year ON work_applications(first_registration_year);
CREATE INDEX IF NOT EXISTS idx_work_apps_account_number ON work_applications(account_number);
CREATE INDEX IF NOT EXISTS idx_work_apps_rules_ack ON work_applications(rules_acknowledged);

-- Add comments for documentation
COMMENT ON COLUMN work_applications.full_name IS 'Student full legal name';
COMMENT ON COLUMN work_applications.gender IS 'Student gender: male or female';
COMMENT ON COLUMN work_applications.age IS 'Student age at time of application';
COMMENT ON COLUMN work_applications.marital_status IS 'Marital status: single, married, divorced, widowed';
COMMENT ON COLUMN work_applications.major IS 'Student academic major/program';
COMMENT ON COLUMN work_applications.academic_classification IS 'Year level: Freshman, Sophomore, Junior, Senior, Graduate';
COMMENT ON COLUMN work_applications.mobile_contact IS 'Student mobile phone number';
COMMENT ON COLUMN work_applications.is_sponsored IS 'Whether student has financial sponsor';
COMMENT ON COLUMN work_applications.sponsor_name IS 'Name of financial sponsor if applicable';
COMMENT ON COLUMN work_applications.work_experiences IS 'Previous work experience description';
COMMENT ON COLUMN work_applications.has_worked_on_campus_before IS 'Whether student previously worked on UEAB campus';
COMMENT ON COLUMN work_applications.previous_campus_work_location IS 'Department/location of previous campus work';
COMMENT ON COLUMN work_applications.first_registration_year IS 'Year when student first registered at UEAB';
COMMENT ON COLUMN work_applications.first_registration_semester IS 'Semester when student first registered (Fall/Spring/Summer)';
COMMENT ON COLUMN work_applications.started_working_month IS 'Month when student started working at UEAB (if applicable)';
COMMENT ON COLUMN work_applications.started_working_year IS 'Year when student started working at UEAB (if applicable)';
COMMENT ON COLUMN work_applications.is_registering_first_semester IS 'Whether this is students first semester registration';
COMMENT ON COLUMN work_applications.registered_units_hours IS 'Number of credit hours/units registered for current semester';
COMMENT ON COLUMN work_applications.account_number IS 'Student UEAB account number';
COMMENT ON COLUMN work_applications.latest_account_balance IS 'Most recent account balance in student financial account';
COMMENT ON COLUMN work_applications.account_statement_attached IS 'Whether student attached account statement to application';
COMMENT ON COLUMN work_applications.rules_acknowledged IS 'Whether student acknowledged work study rules and regulations';
COMMENT ON COLUMN work_applications.acknowledged_at IS 'Timestamp when rules were acknowledged';
COMMENT ON COLUMN work_applications.signature_data IS 'Base64 encoded digital signature image';
COMMENT ON COLUMN work_applications.signed_at IS 'Timestamp when application was digitally signed';

COMMENT ON TABLE work_applications IS 'UEAB DVC-SAS Student Work Study Program applications. Comprehensive form matching official paper application with personal info, work history, academic details, financial information, and digital signature.';
