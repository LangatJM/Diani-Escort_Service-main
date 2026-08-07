/*
  Admin CRUD policies for companions table.

  The companions table previously only had a SELECT policy (public read).
  The admin panel needs INSERT, UPDATE, and DELETE to manage listings.
  This app has no sign-in screen, so policies are scoped to anon, authenticated
  — the admin panel is gated by a client-side password check.
*/

DROP POLICY IF EXISTS "anon_insert_companions" ON companions;
CREATE POLICY "anon_insert_companions" ON companions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_companions" ON companions;
CREATE POLICY "anon_update_companions" ON companions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_companions" ON companions;
CREATE POLICY "anon_delete_companions" ON companions FOR DELETE
  TO anon, authenticated USING (true);
