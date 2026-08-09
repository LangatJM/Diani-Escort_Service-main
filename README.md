# Diani Companion

A Progressive Web App (PWA) for browsing and booking vetted local companions in Diani Beach, Kenya — for beach days, sunset dinners, nightlife, safaris, and more.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4**, and an optional **Supabase** backend.

---

## ✨ Features

- **Age verification gate** — an 18+ disclaimer popup must be accepted before the site is accessible (per session).
- **Browse companions** — search by name, mood, or activity; filter by interest and "available today".
- **Companion detail pages** — photos, bio, interests, hourly rate, reviews, plus **Call** and **WhatsApp** buttons.
- **Booking flow** — request a date, time, duration, and meeting point; bookings are saved locally on your device.
- **Reviews** — visitors can leave ratings and comments (with automatic rating aggregation when Supabase is connected).
- **Admin panel** — secure, owner-only UI (hidden from public nav, accessible directly via `#/admin`) to register, edit, toggle, and delete companion listings. Uses Supabase Auth in production and a client-side password in demo mode.
- **Usage dashboard** — the admin dashboard shows total taps, taps today, last activity, most-visited sections, most-viewed companions, and (with Supabase) recent booking requests.
- **Tap tracking** — tracks engagement locally (total taps, taps today, most-visited sections, per-companion detail views).
- **PWA** — installable, with offline service-worker caching.
- **Demo mode** — runs fully without a backend using bundled sample data.

---

## 🧱 Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| UI         | React 19, TypeScript                         |
| Build      | Vite 5.4.21 (Rollup-based)                   |
| Styling    | Tailwind CSS v4                              |
| Backend    | Supabase (optional)                          |
| Icons      | lucide-react                                 |
| PWA        | Service worker + web manifest                |

---

## 📁 Project Structure

```
.
├── public/
│   ├── sw.js                  # Service worker (offline caching)
│   ├── manifest.webmanifest   # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── components/            # Reusable UI (Header, Footer, cards, reviews…)
│   ├── hooks/                 # React hooks (useCompanions, useInstallPrompt, useTapTracker)
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client + configuration guard
│   │   ├── demoData.ts        # Demo-mode fallback data
│   │   ├── bookingsStore.ts   # Local booking storage
│   │   ├── tapTracker.ts      # Tap/engagement tracking helpers
│   │   ├── router.ts          # Hash-based routing
│   │   └── format.ts          # Formatting helpers (KES, dates)
│   └── pages/                 # HomePage, BrowsePage, DetailPage, BookingsPage, AboutPage, AdminPage
├── supabase/
│   ├── functions/notify-booking/  # Edge function (WhatsApp/SMS notification)
│   └── migrations/                # SQL schema + policies
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
└── DEPLOYMENT.md               # Deployment guide
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js 18+** (this project was tested on Node v25.1.0)
- **npm** (comes with Node)

### 1. Install dependencies

```bash
npm install
```

> **Note for Node 25 users:** This project uses **Vite 5.4.21** (Rollup-based) because the default Vite 8 / rolldown build is not compatible with Node 25. The pinned version is already set in `package.json`.

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Demo mode vs. real backend

- **Demo mode (default):** If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set, the app renders with bundled sample companions, reviews, and local booking storage. Everything is browsable and functional without a backend.
- **Real backend:** To connect Supabase, copy `.env.example` to `.env` and fill in your credentials (see below).

---

## 🔌 Supabase Setup (Optional, for production)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the `.env.example` file to `.env` and fill in:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set:
   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
4. Run the SQL migrations in `supabase/migrations/` (in order) via the Supabase SQL Editor:
   - `20260806141618_create_companions_and_bookings.sql`
   - `20260806141759_tighten_booking_privacy.sql`
   - `20260806143325_create_reviews_and_rating_trigger.sql`
   - `20260806144840_add_companion_write_policies.sql`
   - `20260806150000_add_companion_phone.sql` (adds `phone` for Call / WhatsApp buttons)
   - `20260806153000_add_admin_auth_and_booking_read.sql` (secure "only me" admin auth + booking monitoring)

5. Deploy the `notify-booking` edge function (see `DEPLOYMENT.md`).

---

## 🛠 Available Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                    |
| `npm run build`     | Type-check + build for production            |
| `npm run preview`   | Preview the production build locally         |

---

## 🔐 Admin Panel

The admin panel is at `#/admin` (hidden from public navigation). It is **reserved for the owner only** and behavior depends on whether Supabase is configured:

- **Production (Supabase configured):** Sign in with your **Supabase Auth** email and password. Access is enforced server-side — only the user listed in the `admins` table may add, edit, or delete companions and view booking requests. Companion writes and booking reads are restricted by Row Level Security (see `20260806153000_add_admin_auth_and_booking_read.sql`).
- **Demo mode (no Supabase):** Falls back to a client-side password (`ADMIN_PASSWORD` in `src/pages/AdminPage.tsx`). Changes are kept in memory only.

### Setting up your admin account (production)

1. Run the migration `supabase/migrations/20260806153000_add_admin_auth_and_booking_read.sql` in the Supabase SQL Editor (after the other migrations).
2. Create a Supabase Auth user for yourself (e.g. **Authentication → Users → Add user**).
3. Register that user as an admin:
   ```sql
   INSERT INTO admins (id, email)
   SELECT id, email FROM auth.users WHERE email = '<your-admin-email>';
   ```
4. Sign in at `#/admin` with that email and password.

> ⚠️ **Security note:** In demo mode the password is embedded in the client bundle, so it is only suitable for local testing. In production, admin access is enforced by Supabase Auth + RLS, not by the client.

### Usage dashboard

The dashboard monitors engagement across the webapp:
- **Total taps & taps today** — overall engagement.
- **Last activity** — most recent interaction time.
- **Most visited sections** — which routes get the most taps.
- **Most viewed companions** — detail-page views per companion.
- **Recent booking requests** (Supabase only) — pending/confirmed/completed/cancelled bookings.

> Tap stats are stored locally per device via `localStorage` (see `src/lib/tapTracker.ts`).

---

## 📦 Build & Preview

```bash
# Create a production build in ./dist
npm run build

# Preview the production build locally
npm run preview
```

---

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes.
4. Push and open a pull request.

---

## 📄 License

© 2026 Diani Companion · Diani Beach, Kenya. All rights reserved. Demonstrator project built for the coastal tourism community.
