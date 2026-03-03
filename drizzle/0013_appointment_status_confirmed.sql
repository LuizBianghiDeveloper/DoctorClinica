-- Add 'confirmed' to appointment_status enum (PostgreSQL 9.1+ supports IF NOT EXISTS)
DO $$ BEGIN
  ALTER TYPE "appointment_status" ADD VALUE 'confirmed';
EXCEPTION
  WHEN duplicate_object THEN NULL; -- já existe
END $$;
