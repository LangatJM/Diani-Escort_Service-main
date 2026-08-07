# Deployment Guide — Diani Companion

This guide walks you through deploying the Diani Companion PWA to **Vercel** or **Netlify**, and setting up the **Supabase** backend and **edge function**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Prepare the project](#2-prepare-the-project)
3. [Option A — Deploy to Vercel](#option-a--deploy-to-vercel)
4. [Option B — Deploy to Netlify](#option-b--deploy-to-netlify)
5. [Supabase backend setup](#5-supabase-backend-setup)
6. [Edge function (WhatsApp/SMS notification)](#6-edge-function-whatsmobile-notification)
7. [Environment variables](#7-environment-variables)
8. [Post-deploy checks](#8-post-deploy-checks)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

- A [GitHub](https://github.com) account (or Git hosting of your choice).
- A [Supabase](https://supabase.com) account (free tier is fine).
- Node.js 18+ installed locally.
- Node v25 note: this project pins **Vite 5.4.21** (Rollup-based) because Vite 8/rolldown is incompatible with Node 25. Vite 5.4 works on Node 18, 20, 22, and 25.

---

## 2. Prepare the project

Push your code to a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

> `.gitignore` already excludes `node_modules`, `dist`, and `.env`, so your secrets will not be committed.

---

## Option A — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project** and select your repository.
3. Vercel auto-detects Vite. Use these settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables (see [§7](#7-environment-variables)).
5. Click **Deploy**.

Your app will be live at `https://<your-project>.vercel.app`.

**Custom domain:** In the project **Settings → Domains**, add your domain and update your DNS `CNAME` record to point to `cname.vercel-dns.com`.

---

## Option B — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub.
2. Click **Add New Site → Import an existing project**, then select your repository.
3. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables (see [§7](#7-environment-variables)).
5. Click **Deploy site**.

Your app will be live at `https://<your-site>.netlify.app`.

**Custom domain:** In **Site settings → Domain management** → **Add custom domain**, then set your DNS.

---

## 5. Supabase backend setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the migration files **in order**:
   - `supabase/migrations/20260806141618_create_companions_and_bookings.sql`
     - Creates `companions` and `bookings` tables, RLS policies, indexes, and seed data.
   - `supabase/migrations/20260806141759_tighten_booking_privacy.sql`
     - Restricts bookings so only INSERT is public (privacy).
   - `supabase/migrations/20260806143325_create_reviews_and_rating_trigger.sql`
     - Creates `reviews` table + trigger that auto-updates companion ratings.
   - `supabase/migrations/20260806144840_add_companion_write_policies.sql`
     - Adds INSERT/UPDATE/DELETE policies on `companions` for the admin panel.
   - `supabase/migrations/20260806150000_add_companion_phone.sql`
     - Adds the `companions.phone` column and backfills seeded numbers for the Call / WhatsApp buttons.

3. Get your API credentials from **Settings → API**:
   - `Project URL` (e.g. `https://abcdefgh.supabase.co`)
   - `anon` public key

---

## 6. Edge function (WhatsApp/SMS notification)

When a visitor books, the app calls the `notify-booking` edge function to build a notification message for the admin.

### Deploy with Supabase CLI

```bash
# Install the CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy notify-booking
```

### Configure the admin WhatsApp number

Set a project secret so notifications can generate a `wa.me` link:

```bash
supabase secrets set ADMIN_WHATSAPP="254712345678"
```

> Include the country code, no `+` or spaces. When set, the edge function returns a `wa_link` to open a WhatsApp chat with the admin pre-filled with the booking details.

---

## 7. Environment variables

Add these to your host (Vercel/Netlify) **and** to your local `.env`:

| Variable                   | Required | Description                                        |
| -------------------------- | -------- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`        | No*      | Your Supabase Project URL                          |
| `VITE_SUPABASE_ANON_KEY`   | No*      | Your Supabase anon public key                      |

> \*If both are left unset, the app runs in **demo mode** (bundled sample data). Set them to enable the real backend.

Add them:

- **Vercel:** Project → **Settings → Environment Variables** → Add → redeploy.
- **Netlify:** Site → **Site configuration → Environment variables** → Add → redeploy.

---

## 8. Post-deploy checks

- [ ] Homepage loads with companions (demo data or from Supabase).
- [ ] `/browse` search and filters work.
- [ ] A companion detail page shows photos, bio, and reviews.
- [ ] Booking flow saves a booking locally and shows confirmation.
- [ ] Admin panel (`#/admin`) lets you register/edit/delete companions and shows tap stats.
- [ ] PWA install prompt appears (desktop/mobile).
- [ ] Basic offline caching works (service worker).

---

## 9. Troubleshooting

| Problem | Solution |
| ------- | -------- |
| **Blank screen after deploy** | Usually a missing `.env`. Either set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, or leave them blank to run in demo mode. |
| **Build fails on Node 25** | Vite 5.4.21 is pinned in `package.json`. Reinstall with `npm install` and rebuild. |
| **Companions not loading** | Ensure migrations were run and env vars are set. In demo mode, companions always load. |
| **Admin writes fail** | Check the `companions` write policies were applied (migration 4) and env vars are configured. |
| **Edge function returns 401** | Redeploy with `supabase functions deploy notify-booking` and confirm the project is linked. |
| **Images not showing** | Items use external Pexels URLs; check network access. Replace with your own hosted images in the database/admin panel. |

---

For everything to run offline as a real PWA in production, ensure the hosted origin serves the `public/` assets (service worker + manifest) correctly — Vercel and Netlify both do this automatically from the `dist/` output.
