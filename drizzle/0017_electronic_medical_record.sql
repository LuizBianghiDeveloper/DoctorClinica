-- Prontuário eletrônico: evolução clínica, prescrições, exames, diagnósticos CID

-- Evolução clínica (SOAP)
CREATE TABLE IF NOT EXISTS "clinical_evolutions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL UNIQUE REFERENCES "appointments"("id") ON DELETE CASCADE,
  "subjective" text,
  "objective" text,
  "assessment" text,
  "plan" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

-- Prescrições / receitas
CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
  "clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "additional_instructions" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prescription_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "prescription_id" uuid NOT NULL REFERENCES "prescriptions"("id") ON DELETE CASCADE,
  "medication" text NOT NULL,
  "dosage" text NOT NULL,
  "instructions" text,
  "display_order" integer DEFAULT 0 NOT NULL
);

-- Exames solicitados
DO $$ BEGIN
  CREATE TYPE "exam_status" AS ENUM ('requested', 'pending', 'done', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "patient_exams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "status" "exam_status" DEFAULT 'requested' NOT NULL,
  "result_notes" text,
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- Diagnósticos CID
CREATE TABLE IF NOT EXISTS "appointment_diagnoses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "icd_code" text NOT NULL,
  "description" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL
);
