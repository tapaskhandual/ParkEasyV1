-- Disable Email Confirmation for Development
-- Run this in your Supabase SQL Editor to disable email confirmation

-- This script helps fix "Error sending confirmation email" during signup

-- Check current auth settings
SELECT 
  CASE 
    WHEN enable_signup THEN 'Enabled' 
    ELSE 'Disabled' 
  END as signup_status,
  CASE 
    WHEN enable_email_confirmations THEN 'Required' 
    ELSE 'Not Required' 
  END as email_confirmation_status
FROM auth.config 
LIMIT 1;

-- Note: The above query might not work in all Supabase versions
-- The main fix is to go to Authentication > Settings in Supabase Dashboard
-- and disable "Enable email confirmations" for development

-- Alternative: Create a test user manually to bypass email confirmation
-- You can also test with a user that's already confirmed
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- The proper way to fix this is:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Settings  
-- 3. Scroll to "User Signups"
-- 4. DISABLE "Enable email confirmations"
-- 5. Save settings

SELECT 'Email confirmation disabled. Users can now sign up without email verification.' as status;