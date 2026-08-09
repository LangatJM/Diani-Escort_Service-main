 # README.md Fixes — Task Tracker

- [x] Remove trailing garbage line `#  E-scort-WebApp` at the end of README.md
- [x] Fix admin panel claim "(linked in the footer)" — footer does not link to `#/admin`
- [x] Add `tapTracker.ts` to the project structure tree under `src/lib/`
- [x] Update hooks comment to include `useTapTracker`
- [x] Clarify demo-mode description to reference env-var check instead of `.env` file existence
- [x] Verify final README.md renders cleanly

# Secure Admin Panel + Usage Dashboard — Task Tracker

- [x] Add Supabase migration `20260806153000_add_admin_auth_and_booking_read.sql` (admins table, `is_admin()` helper, RLS-locked companion writes, admin-only booking reads)
- [x] Add secure Supabase Auth login to the admin page, with demo-mode password fallback
- [x] Lock companion writes and booking reads to the owner via RLS (only-me enforcement)
- [x] Add per-companion detail-view tracking to the usage dashboard
- [x] Add booking monitoring (recent booking requests + status summary) to the dashboard
- [x] Add sign-out button and show the authenticated admin email
- [x] Hide the admin login from clients (generic 404 screen) with a secret `Ctrl+Shift+A` unlock so only the owner can reach the admin login
- [x] Update README.md and DEPLOYMENT.md for the new admin auth + dashboard
- [x] Verify `npm run build` passes (tsc type-check + vite build)

