/*
  Allow companion management policies (INSERT, UPDATE, DELETE) for anon and authenticated users
  so profile edits in the Admin Panel persist to the live Supabase database and sync across all platforms.
*/

DROP POLICY IF EXISTS "admin_insert_companions" ON companions;
DROP POLICY IF EXISTS "anon_insert_companions" ON companions;
DROP POLICY IF EXISTS "allow_companion_insert" ON companions;
CREATE POLICY "allow_companion_insert" ON companions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_companions" ON companions;
DROP POLICY IF EXISTS "anon_update_companions" ON companions;
DROP POLICY IF EXISTS "allow_companion_update" ON companions;
CREATE POLICY "allow_companion_update" ON companions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_companions" ON companions;
DROP POLICY IF EXISTS "anon_delete_companions" ON companions;
DROP POLICY IF EXISTS "allow_companion_delete" ON companions;
CREATE POLICY "allow_companion_delete" ON companions FOR DELETE
  TO anon, authenticated USING (true);
