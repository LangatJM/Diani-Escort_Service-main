/*
# Secure admin auth + booking monitoring

1. Purpose
Replace the open client-side password gate with a real, "only me" admin identity
rooted in Supabase Auth. The owner creates one admin record tied to their Supabase
Auth user; all companion writes and booking reads are then restricted to that user
via Row Level Security.

2. New table
  admins
  - id         (uuid, PK, references auth.users) — the owner's Supabase Auth user id
  - email      (text, unique) — convenience copy of the admin email
  - created_at (timestz)

3. Helper function
  is_admin() — true only when the current authenticated role has a row in `admins`.

4. Policy changes
  - companions: writes (INSERT/UPDATE/DELETE) now require is_admin().
    The old public anon write policies are dropped.
  - bookings: SELECT is re-granted to `authenticated` but gated by is_admin()
    so only the admin can monitor bookings. Public SELECT remains denied.
  - admins: SELECT is self-only (each authenticated user can read their own row).

5. Getting started
  After creating a Supabase Auth user for yourself, run:
    INSERT INTO admins (id, email)
    SELECT id, email FROM auth.users WHERE email = '<your-admin-email>';
*/

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- An authenticated user can only read their own admin row.
DROP POLICY IF EXISTS "admin_read_self" ON admins;
CREATE POLICY "admin_read_self" ON admins FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Remove the old public (client-password) write policies on companions.
DROP POLICY IF EXISTS "anon_insert_companions" ON companions;
DROP POLICY IF EXISTS "anon_update_companions" ON companions;
DROP POLICY IF EXISTS "anon_delete_companions" ON companions;

-- Restrict companion writes to the admin only.
DROP POLICY IF EXISTS "admin_insert_companions" ON companions;
CREATE POLICY "admin_insert_companions" ON companions FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_companions" ON companions;
CREATE POLICY "admin_update_companions" ON companions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_companions" ON companions;
CREATE POLICY "admin_delete_companions" ON companions FOR DELETE
  TO authenticated USING (is_admin());

-- Public read of companions stays available to everyone (anon + authenticated).
DROP POLICY IF EXISTS "public_read_companions" ON companions;
CREATE POLICY "public_read_companions" ON companions FOR SELECT
  TO anon, authenticated USING (true);

-- Bookings: re-grant SELECT to authenticated but keep it admin-only via RLS.
-- (Migration 20260806141759 revoked SELECT/UPDATE/DELETE from anon+authenticated.)
GRANT SELECT ON bookings TO authenticated;

DROP POLICY IF EXISTS "admin_read_bookings" ON bookings;
CREATE POLICY "admin_read_bookings" ON bookings FOR SELECT
  TO authenticated USING (is_admin());
