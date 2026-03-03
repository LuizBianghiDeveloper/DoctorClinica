CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "status" "appointment_status" DEFAULT 'completed' NOT NULL;
--> statement-breakpoint
CREATE TYPE "public"."revenue_goal_period" AS ENUM('monthly', 'quarterly', 'yearly');
--> statement-breakpoint
CREATE TABLE "revenue_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"period_type" "revenue_goal_period" NOT NULL,
	"period_ref" text NOT NULL,
	"target_in_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revenue_goals" ADD CONSTRAINT "revenue_goals_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
