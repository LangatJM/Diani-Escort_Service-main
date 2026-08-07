/*
# Tighten anonymous booking privacy

1. Purpose
The public booking form needs permission to create a booking, but anonymous visitors
must not be able to read, edit, or delete other guests' private contact details.

2. Security changes
- Remove public SELECT, UPDATE, and DELETE policies from `bookings`.
- Revoke those table privileges from anon and authenticated roles.
- Keep INSERT available so the booking form can submit requests.

3. Important note
The confirmation screen remains the source of truth immediately after booking. The
front-end also stores a minimal local booking summary so the visitor can revisit it
on the same device without exposing the booking table publicly.
*/

DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
REVOKE SELECT, UPDATE, DELETE ON bookings FROM anon, authenticated;
GRANT INSERT ON bookings TO anon, authenticated;
