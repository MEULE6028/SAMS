-- Add student_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;

-- Make gender and marital_status nullable in work_applications
ALTER TABLE work_applications ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE work_applications ALTER COLUMN marital_status DROP NOT NULL;

-- Add index for student_id lookups
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);

-- Comment for documentation
COMMENT ON COLUMN users.student_id IS 'External API student ID (e.g., student001, student004) - maps to external student management system';
