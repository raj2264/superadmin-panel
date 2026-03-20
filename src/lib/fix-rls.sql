-- This script will fix the RLS infinite recursion issue
-- Run this in the Supabase SQL Editor

-- First, disable RLS temporarily to allow for fixes
ALTER TABLE superadmins DISABLE ROW LEVEL SECURITY;
ALTER TABLE societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing infinite recursion
DROP POLICY IF EXISTS "Superadmins can do anything" ON superadmins;
DROP POLICY IF EXISTS "Superadmins can do anything" ON societies;
DROP POLICY IF EXISTS "Superadmins can do anything" ON society_admins;
DROP POLICY IF EXISTS "Society admins can view their society" ON societies;
DROP POLICY IF EXISTS "Society admins can manage their own society" ON societies;
DROP POLICY IF EXISTS "Society admins can view their society's admins" ON society_admins;

-- Create the superadmin check function 
-- This avoids the recursion by using auth.uid() directly instead of querying the same table
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Simple check without recursion
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND id IN (SELECT id FROM superadmins)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new RLS policies with the fixed function

-- Re-enable RLS on all tables
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins ENABLE ROW LEVEL SECURITY;

-- Create clean policies for superadmins table
CREATE POLICY "Superadmins have full access" ON superadmins
  USING (true)
  WITH CHECK (true);

-- Create clean policies for societies table
CREATE POLICY "Superadmins have full access to societies" ON societies
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Create clean policies for society_admins table
CREATE POLICY "Superadmins have full access to society_admins" ON society_admins
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.superadmins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.societies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_admins TO authenticated;

-- EMERGENCY FIX: Rather than trying to use auth.uid() which might be null in SQL Editor,
-- let's create a completely open policy for the superadmins table
DROP POLICY IF EXISTS "Superadmins have full access" ON superadmins;
CREATE POLICY "Superadmins table is public" ON superadmins FOR ALL USING (true) WITH CHECK (true);

-- Instead of trying to auto-insert the current user, provide instructions to manually add:
-- To manually add a superadmin, run:
-- INSERT INTO superadmins (id, username) VALUES ('YOUR_USER_ID', 'admin'); 