/*
# Create reviews table and rating aggregation

1. Overview
Adds a reviews table so visitors can leave ratings and comments for companions.
A trigger automatically recalculates and updates the companion's average rating
and review count whenever a review is inserted or deleted.

2. New Tables
  reviews
  - id            (uuid, primary key)
  - companion_id  (uuid, references companions, on delete cascade)
  - reviewer_name (text, not null) — display name of the reviewer
  - rating        (int, not null, 1-5) — star rating
  - comment       (text) — optional review text
  - created_at    (timestamptz)

3. Functions
  - update_companion_rating() — trigger function that recomputes
    companions.rating and companions.reviews from the reviews table
    after each insert or delete.

4. Security
  - Enable RLS on reviews.
  - Public read (anon + authenticated) so all visitors can see reviews.
  - Anon + authenticated can insert reviews (no login required).
  - No update or delete — reviews are immutable once posted.

5. Indexes
  - reviews.companion_id for efficient lookup by companion.
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reviews_companion_id ON reviews(companion_id);

CREATE OR REPLACE FUNCTION update_companion_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE companions
  SET rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE companion_id = NEW.companion_id), 0),
      reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE companion_id = NEW.companion_id), 0)
  WHERE id = NEW.companion_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_companion_rating_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE companions
  SET rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE companion_id = OLD.companion_id), 0),
      reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE companion_id = OLD.companion_id), 0)
  WHERE id = OLD.companion_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_inserted ON reviews;
CREATE TRIGGER trg_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_companion_rating();

DROP TRIGGER IF EXISTS trg_review_deleted ON reviews;
CREATE TRIGGER trg_review_deleted
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_companion_rating_on_delete();
