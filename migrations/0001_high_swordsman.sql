CREATE TABLE "residence_change_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_residence_type" text NOT NULL,
	"requested_residence_type" text NOT NULL,
	"reason" text NOT NULL,
	"preferred_hostel_id" integer,
	"special_needs" text,
	"preferred_roommate" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sign_out_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"destination" text NOT NULL,
	"contact_during_absence" text NOT NULL,
	"emergency_contact" text NOT NULL,
	"emergency_phone" text NOT NULL,
	"parent_approval" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"review_notes" text,
	"semester_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_withdrawals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text NOT NULL,
	"destination" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "qualifications" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "vision_statement" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "availability" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "skills" text;--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "previous_experience" text;--> statement-breakpoint
ALTER TABLE "residence_change_requests" ADD CONSTRAINT "residence_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residence_change_requests" ADD CONSTRAINT "residence_change_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD CONSTRAINT "sign_out_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_out_applications" ADD CONSTRAINT "sign_out_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;