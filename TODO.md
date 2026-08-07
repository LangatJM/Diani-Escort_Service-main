# Bug Fix Plan - Diani Companion

- [x] Analyze codebase & run build to identify bugs
- [x] Fix `lucide-react` broken version (no type declarations) in package.json → `0.469.0`
- [x] Fix `@` path alias in vite.config.ts (invalid `tsconfigPaths` option) → proper resolve.alias
- [x] Downgrade Vite 8 (rolldown incompatible with Node 25) → Vite 5.4.21 (stable, Rollup-based)
- [x] Run `npm install` to reinstall corrected dependencies
- [x] Run `npm run build` to verify zero errors → SUCCESS (1644 modules, built in 17.77s)
- [x] Start dev server and open in browser (http://localhost:5173 → HTTP 200)

## Blank screen fix (runtime crash)
- Root cause: no `.env` file → `createClient(undefined, undefined)` threw at module load, crashing the whole React tree.
- Fix: `supabase.ts` now tolerates missing env vars and exports `isSupabaseConfigured`.
- Added `src/lib/demoData.ts` with bundled companions/reviews so the site renders and is fully browsable in DEMO MODE without a backend.
- `useCompanions`, `ReviewsSection`, `DetailPage` now fall back to demo data when Supabase isn't configured.
- Added `.env.example` documenting how to enable the real backend.
- Verified: `npm run build` passes (1645 modules, 0 errors); dev server serves full HTML (1375 bytes).
