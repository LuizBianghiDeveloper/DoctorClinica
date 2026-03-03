ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "confirmation_token" text;--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"type" text NOT NULL,
	"reference_id" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
