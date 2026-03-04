-- Criar usuário admin no Neon via psql
--
-- OPÇÃO A - Comando único (substitua EMAIL, NOME, SENHA e DATABASE_URL):
--
--   psql "DATABASE_URL" -v email="admin@clinica.com" -v name="Admin" -v password="SuaSenha123" -f scripts/create-admin.sql
--
-- OPÇÃO B - Interativo (conecte, defina variáveis e rode o script):
--
--   psql "DATABASE_URL"
--   \set email 'admin@clinica.com'
--   \set name 'Admin'
--   \set password 'SuaSenha123'
--   \i scripts/create-admin.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email text := :'email';
  v_name text := :'name';
  v_password text := :'password';
  v_user_id text;
  v_clinic_id uuid;
  v_account_id text;
BEGIN
  v_email := lower(trim(v_email));

  IF EXISTS (SELECT 1 FROM users WHERE email = v_email) THEN
    RAISE NOTICE 'E-mail já cadastrado. Para promover a admin: UPDATE users_to_clinics SET role = ''admin'' WHERE user_id = (SELECT id FROM users WHERE email = ''%'');', v_email;
    RETURN;
  END IF;

  v_user_id := substr(replace(gen_random_uuid()::text, '-', ''), 1, 27);
  v_account_id := replace(gen_random_uuid()::text, '-', '');

  INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
  VALUES (v_user_id, v_name, v_email, false, now(), now());

  INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
  VALUES (v_account_id, v_user_id, 'credential', v_user_id, crypt(v_password, gen_salt('bf')), now(), now());

  SELECT id INTO v_clinic_id FROM clinics LIMIT 1;

  IF v_clinic_id IS NULL THEN
    INSERT INTO clinics (name) VALUES ('Clínica Principal') RETURNING id INTO v_clinic_id;
    INSERT INTO appointment_types (clinic_id, name, duration_in_minutes, price_in_cents, display_order)
    VALUES (v_clinic_id, 'Primeira consulta', 60, 15000, 0), (v_clinic_id, 'Retorno', 30, 8000, 1), (v_clinic_id, 'Procedimento', 45, 12000, 2);
    INSERT INTO rooms (clinic_id, name, type, display_order)
    VALUES (v_clinic_id, 'Consultório 1', 'room', 0), (v_clinic_id, 'Consultório 2', 'room', 1);
  END IF;

  INSERT INTO users_to_clinics (user_id, clinic_id, role)
  VALUES (v_user_id, v_clinic_id, 'admin');

  RAISE NOTICE 'Usuário admin criado: % (%)', v_name, v_email;
END
$$;
