-- Add new columns to department_rates
ALTER TABLE "department_rates" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "department_rates" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

-- Create department_positions table
CREATE TABLE IF NOT EXISTS "department_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar NOT NULL,
	"position" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'department_positions_department_id_department_rates_id_fk'
    ) THEN
        ALTER TABLE "department_positions" ADD CONSTRAINT "department_positions_department_id_department_rates_id_fk" 
        FOREIGN KEY ("department_id") REFERENCES "department_rates"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Add new departments with descriptions
INSERT INTO "department_rates" ("department", "description", "hourly_rate", "is_active") VALUES
  ('DVC SAS', 'Deputy Vice Chancellor Student Affairs and Services', 51.00, true),
  ('Registry', 'University Registry Department', 51.00, true),
  ('PPD', 'Physical Plant Department - Cleaning and maintaining university environment', 51.00, true),
  ('Dorm Management', 'On-campus and off-campus residential officers and assistants', 51.00, true)
ON CONFLICT (department) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Update existing departments with descriptions
UPDATE "department_rates" SET description = 'Library services and management' WHERE department = 'Library';
UPDATE "department_rates" SET description = 'Information Technology Services' WHERE department = 'IT Services';
UPDATE "department_rates" SET description = 'Student Admissions Office' WHERE department = 'Admissions';
UPDATE "department_rates" SET description = 'Facilities Management' WHERE department = 'Facilities';
UPDATE "department_rates" SET description = 'Student Affairs Department' WHERE department = 'Student Affairs';
UPDATE "department_rates" SET description = 'Cafeteria and dining services - all staff from cleaners to cooks to servers' WHERE department = 'Cafeteria';
UPDATE "department_rates" SET description = 'Campus Security Services' WHERE department = 'Security';
UPDATE "department_rates" SET description = 'Maintenance Services' WHERE department = 'Maintenance';
UPDATE "department_rates" SET description = 'Administration Department' WHERE department = 'Administration';
UPDATE "department_rates" SET description = 'Chapel and Spiritual Services' WHERE department = 'Chapel';
UPDATE "department_rates" SET description = 'Sports and Athletics' WHERE department = 'Sports';
UPDATE "department_rates" SET description = 'Health Center Services' WHERE department = 'Health Center';
