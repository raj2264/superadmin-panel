-- Database Setup Script for MySocietyDetails Superadmin Panel
-- Run this in the Supabase SQL Editor to set up your database

-- Create superadmins table if it doesn't exist
CREATE TABLE IF NOT EXISTS superadmins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create societies table if it doesn't exist
CREATE TABLE IF NOT EXISTS societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create society_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS society_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  society_id UUID REFERENCES societies(id),
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, society_id)
);

-- Create LIC requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS lic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  society_id UUID REFERENCES societies(id),
  resident_name TEXT NOT NULL,
  policy_number TEXT,
  request_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make sure we have proper RLS configuration
-- First disable RLS on all tables temporarily
ALTER TABLE superadmins DISABLE ROW LEVEL SECURITY;
ALTER TABLE societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE lic_requests DISABLE ROW LEVEL SECURITY;

-- Create the is_superadmin helper function for RLS policies
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND id IN (SELECT id FROM superadmins)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE lic_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Superadmins table is public" ON superadmins;
DROP POLICY IF EXISTS "Superadmins have full access to societies" ON societies;
DROP POLICY IF EXISTS "Superadmins have full access to society_admins" ON society_admins;
DROP POLICY IF EXISTS "Superadmins have full access to lic_requests" ON lic_requests;
DROP POLICY IF EXISTS "Residents can view and create LIC requests" ON lic_requests;

-- Create temporary open policy for superadmins table to allow initial setup
CREATE POLICY "Superadmins table is public" ON superadmins 
  FOR ALL USING (true) WITH CHECK (true);

-- Create access policies for societies table
CREATE POLICY "Superadmins have full access to societies" ON societies
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Create access policies for society_admins table
CREATE POLICY "Superadmins have full access to society_admins" ON society_admins
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Create access policies for lic_requests table
CREATE POLICY "Superadmins have full access to lic_requests" ON lic_requests
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Create policy for residents to view and create their own LIC requests
CREATE POLICY "Residents can view and create LIC requests" ON lic_requests
  FOR SELECT USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.societies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lic_requests TO authenticated;

-- IMPORTANT: After running this script, you need to manually add your user as a superadmin
-- Replace YOUR_USER_ID with your actual Supabase user ID:
-- 
-- INSERT INTO superadmins (id, username)
-- VALUES ('YOUR_USER_ID', 'admin')
-- ON CONFLICT (id) DO NOTHING; 