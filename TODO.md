# Implementation Plan - Diani Companion

## Bug Fixes
- [x] Analyze codebase & run build to identify bugs
- [x] Fix `index.html` apple-touch-icon pointing to non-existent icon-192.png (generated PNG icons)
- [x] Fix `bookingsStore.ts` - wrap localStorage.setItem in try/catch
- [x] Fix `format.ts` - guard against NaN/invalid input
- [x] Fix `DetailPage.tsx` - gallery fallback, past-date validation, guard notification fetch
- [x] Fix `AdminPage.tsx` - handle demo mode when Supabase not configured
- [x] Fix `public/sw.js` - add .catch() on caches.put
- [x] Fix `manifest.webmanifest` - add proper PNG icons (192/512 + maskable)

## New Features
- [x] Create `AgeGate.tsx` - over-18 disclaimer popup (sessionStorage)
- [x] Wire AgeGate into `App.tsx`
- [x] Add `phone` field to `Companion` type in `supabase.ts`
- [x] Add phone numbers to demo companions in `demoData.ts`
- [x] Add Call & WhatsApp buttons to `DetailPage.tsx`
- [x] Add Phone field to `AdminPage.tsx` add/edit form
- [x] Add migration for `companions.phone` column

## Admin Enhancements
- [x] Create `tapTracker.ts` - tap counting in localStorage
- [x] Create `useTapTracker` hook - global click listener
- [x] Add tap-stats display to AdminPage dashboard
- [x] Hide Admin link from Footer (not visible to regular users)
- [x] Keep admin route accessible via direct URL (#/admin)

## Verification
- [x] Run `npm run build` - verify zero errors (1648 modules, 0 errors)
- [x] Start dev server (HTTP 200) and open site in browser for review
- [x] Verify icons & manifest served correctly
