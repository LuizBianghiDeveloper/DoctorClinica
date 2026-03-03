ALTER TABLE "clinics" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "cnpj" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "primary_color" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "secondary_color" text;--> statement-breakpoint
CREATE TABLE "clinic_business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"week_day" integer NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clinic_business_hours" ADD CONSTRAINT "clinic_business_hours_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
