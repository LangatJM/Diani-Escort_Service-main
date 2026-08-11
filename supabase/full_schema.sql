/*
  ===================================================================
  Diani Companion PWA — Complete Unified Database Schema & Security
  Project: zqskiopjarogkjezkdtr
  ===================================================================
  This script contains all 7 migrations combined into a single, idempotent
  SQL script. You can execute this directly in the Supabase Dashboard SQL Editor:
  https://supabase.com/dashboard/project/zqskiopjarogkjezkdtr/sql/new
*/

-- 1. Create companions table
CREATE TABLE IF NOT EXISTS companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  bio text,
  age int,
  location text,
  languages text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  price_per_hour numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  reviews int DEFAULT 0,
  verified boolean DEFAULT false,
  available boolean DEFAULT true,
  phone text,
  image_url text,
  gallery text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid REFERENCES companions(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  booking_date date NOT NULL,
  start_time text NOT NULL,
  duration_hours int NOT NULL DEFAULT 2,
  meeting_point text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  total_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 4. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6. Helper function: check if authenticated user is registered admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 7. Companions RLS Policies
DROP POLICY IF EXISTS "public_read_companions" ON companions;
CREATE POLICY "public_read_companions" ON companions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_companions" ON companions;
CREATE POLICY "admin_insert_companions" ON companions FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_companions" ON companions;
CREATE POLICY "admin_update_companions" ON companions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_companions" ON companions;
CREATE POLICY "admin_delete_companions" ON companions FOR DELETE
  TO authenticated USING (is_admin());

-- 8. Bookings RLS Policies
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

REVOKE SELECT, UPDATE, DELETE ON bookings FROM anon;
GRANT INSERT ON bookings TO anon, authenticated;
GRANT SELECT ON bookings TO authenticated;

DROP POLICY IF EXISTS "admin_read_bookings" ON bookings;
CREATE POLICY "admin_read_bookings" ON bookings FOR SELECT
  TO authenticated USING (is_admin());

-- 9. Reviews RLS Policies
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (is_admin());

-- 10. Admins RLS Policies
DROP POLICY IF EXISTS "admin_read_self" ON admins;
CREATE POLICY "admin_read_self" ON admins FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- 11. Triggers for rating and review count recalculation
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

-- 12. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_companions_available ON companions(available);
CREATE INDEX IF NOT EXISTS idx_bookings_companion_id ON bookings(companion_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone ON bookings(client_phone);
CREATE INDEX IF NOT EXISTS idx_reviews_companion_id ON reviews(companion_id);

-- 13. Seed companions data
INSERT INTO companions (name, tagline, bio, age, location, languages, interests, price_per_hour, rating, reviews, verified, available, phone, image_url, gallery) VALUES
(
  'Amani',
  'Sunset strolls & beach picnics',
  'Born and raised in Diani, Amani knows every hidden cove along the coast. Warm, easy-going, and a great storyteller — the perfect companion for a relaxed afternoon by the ocean.',
  26,
  'Diani Beach',
  ARRAY['English','Swahili'],
  ARRAY['Beach walks','Snorkeling','Sunset cruises','Photography'],
  2500,
  4.9,
  37,
  true,
  true,
  '+254712100001',
  'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/1457897/pexels-photo-1457897.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
),
(
  'Zawadi',
  'Nightlife & live music nights',
  'Loves the Diani nightlife scene and knows the best beach bars and live music spots. High energy, great dancer, and always up for a fun evening out.',
  24,
  'Galu',
  ARRAY['English','Swahili','French'],
  ARRAY['Nightlife','Live music','Dining','Dancing'],
  3000,
  4.8,
  29,
  true,
  true,
  '+254712100002',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/2167673/pexels-photo-2167673.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3787839/pexels-photo-3787839.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
),
(
  'Jabari',
  'Safari & adventure guide',
  'Experienced in organising day trips to Shimba Hills and marine safaris at Kisite-Mpunguti. Calm, knowledgeable, and safety-first.',
  31,
  'Ukunda',
  ARRAY['English','Swahili','Kikuyu'],
  ARRAY['Safari','Snorkeling','Hiking','Wildlife'],
  3500,
  5.0,
  52,
  true,
  true,
  '+254712100003',
  'https://images.pexels.com/photos/2204573/pexels-photo-2204573.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3408353/pexels-photo-3408353.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
),
(
  'Lina',
  'Wellness & yoga retreats',
  'Certified yoga instructor offering sunrise sessions on the beach and wellness walks. Gentle, attentive, and deeply calming presence.',
  28,
  'Diani Beach',
  ARRAY['English','Swahili','German'],
  ARRAY['Yoga','Wellness','Beach walks','Meditation'],
  2800,
  4.7,
  18,
  true,
  false,
  '+254712100004',
  'https://images.pexels.com/photos/3865711/pexels-photo-3865711.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
),
(
  'Kofi',
  'Dining & cultural tours',
  'Foodie and culture enthusiast. Knows the best Swahili kitchens in Ukunda and the history behind Diani. Great conversationist.',
  30,
  'Diani Beach',
  ARRAY['English','Swahili'],
  ARRAY['Dining','Culture','Shopping','Sightseeing'],
  2200,
  4.6,
  14,
  false,
  true,
  '+254712100005',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
),
(
  'Nia',
  'Water sports & boat trips',
  'Loves the ocean. Organises dhow trips, kite surfing sessions, and reef snorkelling. Adventurous, fit, and always smiling.',
  25,
  'Galu',
  ARRAY['English','Swahili','Italian'],
  ARRAY['Kite surfing','Snorkeling','Dhow trips','Fishing'],
  3200,
  4.9,
  41,
  true,
  true,
  '+254712100006',
  'https://images.pexels.com/photos/2167394/pexels-photo-2167394.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/261383/pexels-photo-261383.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
)
ON CONFLICT DO NOTHING;
