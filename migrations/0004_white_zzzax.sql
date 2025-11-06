CREATE TABLE "candidate_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" varchar NOT NULL,
	"position_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"manifesto" text NOT NULL,
	"qualifications" text,
	"vision_statement" text,
	"photo_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" varchar
);
--> statement-breakpoint
CREATE TABLE "election_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"responsibilities" text,
	"requirements" text,
	"slots_available" integer DEFAULT 1 NOT NULL,
	"department" text,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "status" SET DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "position_id" varchar;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "application_id" varchar;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "is_winner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "vote_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "vote_percentage" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "application_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "application_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "voting_start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "voting_end_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "results_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "results_published_at" timestamp;--> statement-breakpoint
ALTER TABLE "timecards" ADD COLUMN "hourly_rate" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "timecards" ADD COLUMN "earnings" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "work_applications" ADD COLUMN "application_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_position_id_election_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_position_id_election_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_application_id_candidate_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."candidate_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_applications" ADD CONSTRAINT "work_applications_application_id_unique" UNIQUE("application_id");