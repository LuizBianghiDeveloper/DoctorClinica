CREATE TYPE "public"."doctor_time_block_type" AS ENUM('interval', 'lunch', 'day_off');
--> statement-breakpoint
CREATE TABLE "doctor_time_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"type" "doctor_time_block_type" NOT NULL,
	"week_day" integer,
	"block_date" date,
	"from_time" time NOT NULL,
	"to_time" time NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_time_blocks" ADD CONSTRAINT "doctor_time_blocks_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_time_blocks" ADD CONSTRAINT "doctor_time_blocks_recurring_or_specific" CHECK (
	(week_day IS NOT NULL AND block_date IS NULL) OR
	(week_day IS NULL AND block_date IS NOT NULL)
);
