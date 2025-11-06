ALTER TABLE "hostel_applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hostel_rooms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hostels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "room_assignments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hostel_applications" CASCADE;--> statement-breakpoint
DROP TABLE "hostel_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "hostels" CASCADE;--> statement-breakpoint
DROP TABLE "room_assignments" CASCADE;--> statement-breakpoint
ALTER TABLE "hostel_attendance" DROP CONSTRAINT "hostel_attendance_room_id_hostel_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "hostel_attendance" ALTER COLUMN "room_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ALTER COLUMN "gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ALTER COLUMN "marital_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "student_id" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "eligibility_checked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "eligibility_passed" boolean;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "eligibility_details" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "fee_balance_at_submission" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "fee_balance_eligible" boolean;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "is_registered_current_semester" boolean;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "credit_hours_at_submission" integer;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "credit_hours_eligible" boolean;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "has_appealed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "appeal_reason" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "appealed_at" timestamp;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "appeal_reviewed_by" varchar;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "appeal_review_notes" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "supervisor_id" varchar;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "supervisor_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_appeal_reviewed_by_users_id_fk" FOREIGN KEY ("appeal_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_student_id_unique" UNIQUE("student_id");