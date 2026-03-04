-- Criar usuário admin direto no banco de produção (Neon SQL Editor)
--
-- ⚠️ IMPORTANTE: Better Auth usa Scrypt, não bcrypt.
-- Após executar esta query, RODE O SCRIPT para corrigir a senha:
--   npx tsx scripts/fix-user-password.ts seu@email.com SuaSenha
-- (use a mesma senha que colocou abaixo)
--
-- 1. Abra o Neon Console → SQL Editor
-- 2. SUBSTITUA os 3 valores abaixo pelos seus
-- 3. Execute a query
-- 4. Rode o script fix-user-password.ts (com DATABASE_URL apontando para produção)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email text := 'admin@clinica.com';      -- ← ALTERE: e-mail de login
  v_name text := 'Admin';                   -- ← ALTERE: nome do usuário
  v_password text := 'SuaSenha123';         -- ← ALTERE: senha de acesso
  v_user_id text;
  v_clinic_id uuid;
  v_account_id text;
BEGIN
  v_email := lower(trim(v_email));

  IF EXISTS (SELECT 1 FROM users WHERE email = v_email) THEN
    RAISE EXCEPTION 'E-mail % já está cadastrado. Use outro e-mail ou promova o usuário: UPDATE users_to_clinics SET role = ''admin'' WHERE user_id = (SELECT id FROM users WHERE email = ''%'');', v_email, v_email;
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
