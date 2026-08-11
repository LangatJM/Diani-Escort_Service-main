/*
# Add admin review management policy

1. Purpose
Allows authenticated administrators (verified by is_admin()) to delete inappropriate or spam reviews.

2. Security
- Grant DELETE on reviews to authenticated users who satisfy is_admin().
- Public anon delete remains strictly denied.
*/

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (is_admin());
