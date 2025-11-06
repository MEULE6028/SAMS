CREATE TABLE "hostel_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"university_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text NOT NULL,
	"gender" text NOT NULL,
	"year_of_study" text NOT NULL,
	"program" text NOT NULL,
	"current_residence_type" text DEFAULT 'off-campus' NOT NULL,
	"current_address" text,
	"preferred_hostel_id" varchar,
	"preferred_room_type" text,
	"special_requirements" text,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_relation" text NOT NULL,
	"emergency_contact_phone" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"review_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"check_in_time" timestamp,
	"status" text NOT NULL,
	"is_within_window" boolean DEFAULT true NOT NULL,
	"notes" text,
	"marked_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostel_id" varchar NOT NULL,
	"room_number" text NOT NULL,
	"floor" integer,
	"capacity" integer NOT NULL,
	"current_occupancy" integer DEFAULT 0 NOT NULL,
	"room_type" text NOT NULL,
	"has_ensuite" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"total_rooms" integer NOT NULL,
	"location" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"room_id" varchar NOT NULL,
	"assigned_date" timestamp DEFAULT now() NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"student_name" text NOT NULL,
	"student_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sign_out_applications" ALTER COLUMN "reason" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ALTER COLUMN "reason" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "room_number" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "means_of_travel" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "purpose_of_travel" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "leave_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "leave_type_other" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "missed_classes" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dorm_dean_approval" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dorm_dean_signed_by" varchar;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dorm_dean_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dorm_dean_notes" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dean_of_students_approval" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dean_of_students_signed_by" varchar;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dean_of_students_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "dean_of_students_notes" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "registrar_approval" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "registrar_signed_by" varchar;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "registrar_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "registrar_notes" text;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD COLUMN "submitted_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "gender" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "age" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "marital_status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "major" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "academic_classification" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "mobile_contact" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "is_sponsored" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "sponsor_name" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "work_experiences" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "has_worked_on_campus_before" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "previous_campus_work_location" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "first_registration_year" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "first_registration_semester" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "started_working_month" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "started_working_year" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "is_registering_first_semester" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "registered_units_hours" integer;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "account_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "latest_account_balance" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "account_statement_attached" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "rules_acknowledged" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "acknowledged_at" timestamp;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "signature_data" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "hostel_applications" ADD CONSTRAINT "hostel_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_applications" ADD CONSTRAINT "hostel_applications_preferred_hostel_id_hostels_id_fk" FOREIGN KEY ("preferred_hostel_id") REFERENCES "public"."hostels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_applications" ADD CONSTRAINT "hostel_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_room_id_hostel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_room_id_hostel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD CONSTRAINT "sign_out_applications_dorm_dean_signed_by_users_id_fk" FOREIGN KEY ("dorm_dean_signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD CONSTRAINT "sign_out_applications_dean_of_students_signed_by_users_id_fk" FOREIGN KEY ("dean_of_students_signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD CONSTRAINT "sign_out_applications_registrar_signed_by_users_id_fk" FOREIGN KEY ("registrar_signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;