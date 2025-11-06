-- Create department_rates table
CREATE TABLE IF NOT EXISTS "department_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department" text NOT NULL UNIQUE,
	"hourly_rate" numeric(6, 2) NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "department_rates" ADD CONSTRAINT "department_rates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Insert initial department rates (all at 51 KSh per hour)
INSERT INTO "department_rates" ("department", "hourly_rate") VALUES
  ('Library', 51.00),
  ('IT Services', 51.00),
  ('Admissions', 51.00),
  ('Facilities', 51.00),
  ('Student Affairs', 51.00),
  ('Cafeteria', 51.00),
  ('Security', 51.00),
  ('Maintenance', 51.00),
  ('Administration', 51.00),
  ('Chapel', 51.00),
  ('Sports', 51.00),
  ('Health Center', 51.00)
ON CONFLICT (department) DO NOTHING;
