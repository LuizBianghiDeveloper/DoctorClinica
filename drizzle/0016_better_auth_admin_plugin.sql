-- Better Auth Admin plugin: adiciona campos necessários ao schema
-- Permite login com Google e outras funcionalidades do plugin admin

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_reason" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_expires" date;

ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "impersonated_by" text;
