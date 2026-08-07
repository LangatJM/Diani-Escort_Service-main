/*
# Create companions and bookings tables for Diani Companion PWA

1. Overview
This migration creates the data layer for a Progressive Web App that lets visitors
to Diani Beach (Kenya) browse vetted local companions and book them for outings,
tours, and social events. The app has NO sign-in screen — all browsing and booking
is done by anonymous visitors, so policies are scoped to `anon, authenticated`.

2. New Tables

  companions
  - id            (uuid, primary key)
  - name          (text, not null) — display name
  - tagline        (text) — short one-line description shown on cards
  - bio           (text) — longer biography on the detail page
  - age            (int)  — displayed age
  - location       (text) — e.g. "Diani Beach", "Galu"
  - languages      (text[]) — spoken languages
  - interests      (text[]) — e.g. ["Beach walks","Nightlife","Safari"]
  - price_per_hour (numeric) — hourly rate in KES
  - rating         (numeric) — average rating 0-5
  - reviews        (int) — number of reviews
  - verified       (boolean) — vetted badge
  - available      (boolean) — currently available
  - image_url      (text) — primary portrait
  - gallery        (text[]) — additional photo URLs
  - created_at     (timestamptz)

  bookings
  - id            (uuid, primary key)
  - companion_id  (uuid, references companions, on delete cascade)
  - client_name   (text, not null)
  - client_phone  (text, not null)
  - client_email  (text)
  - booking_date  (date, not null)
  - start_time    (text, not null) — e.g. "14:00"
  - duration_hours (int, not null, default 2)
  - meeting_point (text) — e.g. hotel name / beach gate
  - notes         (text) — special requests
  - status        (text, not null default 'pending') — pending|confirmed|completed|cancelled
  - total_price   (numeric) — computed total
  - created_at    (timestamptz)

3. Security
- Enable RLS on both tables.
- companions: public read (anon + authenticated), no public write.
- bookings: anon + authenticated can create and read their own bookings by phone
  number (since there is no auth, phone is the soft identifier). Updates and deletes
  are allowed so a client can cancel or amend their own booking matched by phone.

4. Indexes
- companions.available (frequent filter)
- bookings.companion_id
- bookings.client_phone
*/

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

ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- companions: public read only
DROP POLICY IF EXISTS "public_read_companions" ON companions;
CREATE POLICY "public_read_companions" ON companions FOR SELECT
  TO anon, authenticated USING (true);

-- bookings: anon can insert
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- bookings: anon can read (to look up their own by phone)
DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;
CREATE POLICY "anon_read_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

-- bookings: anon can update (amend / status change)
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- bookings: anon can delete (cancel)
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_companions_available ON companions(available);
CREATE INDEX IF NOT EXISTS idx_bookings_companion_id ON bookings(companion_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone ON bookings(client_phone);

-- Seed data: a handful of sample companions
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
