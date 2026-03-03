CREATE TABLE "appointment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_in_minutes" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_types" ADD CONSTRAINT "appointment_types_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "appointment_type_id" uuid;
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointment_type_id_appointment_types_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_types"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO appointment_types (clinic_id, name, duration_in_minutes, price_in_cents, display_order)
SELECT id, 'Primeira consulta', 60, 15000, 0 FROM clinics;
--> statement-breakpoint
INSERT INTO appointment_types (clinic_id, name, duration_in_minutes, price_in_cents, display_order)
SELECT id, 'Retorno', 30, 8000, 1 FROM clinics;
--> statement-breakpoint
INSERT INTO appointment_types (clinic_id, name, duration_in_minutes, price_in_cents, display_order)
SELECT id, 'Procedimento', 45, 12000, 2 FROM clinics;
