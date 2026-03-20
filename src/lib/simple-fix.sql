-- Simple emergency fix for RLS issues
-- This script will temporarily disable Row Level Security
-- to allow basic functionality while you troubleshoot

-- Disable RLS on all tables
ALTER TABLE superadmins DISABLE ROW LEVEL SECURITY;
ALTER TABLE societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins DISABLE ROW LEVEL SECURITY;

-- Drop all policies to start clean
DROP POLICY IF EXISTS "Superadmins can do anything" ON superadmins;
DROP POLICY IF EXISTS "Superadmins can manage superadmins" ON superadmins;
DROP POLICY IF EXISTS "Allow users to read their own superadmin record" ON superadmins;
DROP POLICY IF EXISTS "Allow all authenticated users to check superadmins" ON superadmins;
DROP POLICY IF EXISTS "Allow all authenticated users to check superadmins table" ON superadmins;

DROP POLICY IF EXISTS "Superadmins can do anything" ON societies;
DROP POLICY IF EXISTS "Superadmins can manage societies" ON societies;
DROP POLICY IF EXISTS "Society admins can see their own society" ON societies;

DROP POLICY IF EXISTS "Superadmins can do anything" ON society_admins;
DROP POLICY IF EXISTS "Superadmins can manage society admins" ON society_admins;
DROP POLICY IF EXISTS "Society admins can see other admins in their society" ON society_admins;

-- Create a single simple policy for the superadmins table
CREATE POLICY "Allow authenticated users to access superadmins" ON superadmins
  FOR ALL
  USING (auth.role() = 'authenticated'); 

-- Note: RLS remains disabled but you can enable it later with:
-- ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE society_admins ENABLE ROW LEVEL SECURITY; 