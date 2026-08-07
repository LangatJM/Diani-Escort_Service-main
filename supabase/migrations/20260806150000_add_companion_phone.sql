/*
# Add phone column to companions for Call / WhatsApp buttons

1. Purpose
Companion detail pages now show "Call" and "WhatsApp" buttons. These need a
phone number stored on the companion record.

2. Changes
- Add a nullable `phone text` column to `companions`.
- Backfill the seeded companions with example Kenyan numbers so the buttons
  work immediately after the migration.
*/

ALTER TABLE companions ADD COLUMN IF NOT EXISTS phone text;

-- Backfill seeded demo companions with example numbers (safe to re-run).
UPDATE companions SET phone = '+254712100001' WHERE name = 'Amani' AND phone IS NULL;
UPDATE companions SET phone = '+254712100002' WHERE name = 'Zawadi' AND phone IS NULL;
UPDATE companions SET phone = '+254712100003' WHERE name = 'Jabari' AND phone IS NULL;
UPDATE companions SET phone = '+254712100004' WHERE name = 'Lina' AND phone IS NULL;
UPDATE companions SET phone = '+254712100005' WHERE name = 'Kofi' AND phone IS NULL;
UPDATE companions SET phone = '+254712100006' WHERE name = 'Nia' AND phone IS NULL;

