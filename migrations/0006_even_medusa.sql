CREATE TABLE "department_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department" text NOT NULL,
	"hourly_rate" numeric(6, 2) NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "department_rates_department_unique" UNIQUE("department")
);
--> statement-breakpoint
ALTER TABLE "department_rates" ADD CONSTRAINT "department_rates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;