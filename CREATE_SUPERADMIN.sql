-- ============================================
-- CREATE A NEW SUPERADMIN (Manual SQL Only)
-- ============================================
-- Run this in the Supabase SQL Editor.
-- Replace the placeholder values before executing.

-- Step 1: Create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  role,
  aud,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'REPLACE_WITH_EMAIL',                          -- e.g. 'admin@example.com'
  crypt('REPLACE_WITH_PASSWORD', gen_salt('bf')), -- e.g. 'MySecurePass123!'
  now(),
  '{"password_changed": true}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
);

-- Step 2: Register them in the superadmins table
INSERT INTO superadmins (id, username)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'REPLACE_WITH_EMAIL'),
  'REPLACE_WITH_EMAIL'
);
