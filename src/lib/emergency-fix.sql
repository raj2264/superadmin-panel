-- EMERGENCY FIX: Completely disable RLS and add user to superadmins
-- Run this in the Supabase SQL Editor

-- First, disable RLS entirely on all tables
ALTER TABLE superadmins DISABLE ROW LEVEL SECURITY;
ALTER TABLE societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE society_admins DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Superadmins table is public" ON superadmins;
DROP POLICY IF EXISTS "Superadmins have full access to societies" ON societies;
DROP POLICY IF EXISTS "Superadmins have full access to society_admins" ON society_admins;
DROP POLICY IF EXISTS "Superadmins have full access" ON superadmins;

-- Add the specific user as a superadmin
INSERT INTO superadmins (id, username)
VALUES ('40864111-21d7-4b53-a536-181155c932b1', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Set all tables to be fully accessible (temporarily ignoring security)
-- We're completely disabling RLS as an emergency measure
-- This means security is off, but the system will work

-- After you have things working, you can re-enable security with a more proper fix
-- For now, this will allow you to work with the system 