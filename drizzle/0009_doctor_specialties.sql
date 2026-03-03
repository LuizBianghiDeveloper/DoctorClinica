CREATE TABLE IF NOT EXISTS "doctor_specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"specialty" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_specialties" ADD CONSTRAINT "doctor_specialties_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "doctor_specialties" ("doctor_id", "specialty", "display_order")
SELECT "id", "specialty", 0 FROM "doctors" WHERE "specialty" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctors" DROP COLUMN IF EXISTS "specialty";
