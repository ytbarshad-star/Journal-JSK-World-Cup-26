# THE JOURNAL | THANAL JSK — World Cup 2026 Prediction Competition

A complete, production-ready FIFA World Cup 2026 prediction platform. Users register with just a phone number, predict match scores, and climb a live leaderboard. Fully automated match syncing, result detection, and points calculation via Supabase Edge Functions + cron.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, mobile-first responsive design
- **Backend:** Supabase (PostgreSQL, phone-only session auth, Storage, Edge Functions)
- **External API:** football-data.org (FIFA World Cup competition data)
- **Automation:** Supabase Edge Functions + pg_cron

---

## 1. Project Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your real values (see section 3 below).

```bash
npm run dev       # local development on http://localhost:3000
npm run build     # production build
npm start         # run production build
```

---

## 2. Supabase Setup

### 2.1 Create a Supabase Project
Go to supabase.com → New Project. Note your **Project URL**, **anon key**, and **service_role key** (Settings → API).

### 2.2 Run the Database Schema
In the Supabase SQL Editor, run these files **in order**:

1. `supabase/schema.sql` — creates all tables, RLS policies, functions, and seeds a default admin
2. `supabase/storage-setup.sql` — creates the `profile-photos` storage bucket (or create manually via Dashboard → Storage if SQL fails due to permissions)

### 2.3 Default Admin Credentials
The seed script creates an admin user:
- **Username:** `admin`
- **Password:** `admin123`

Change this immediately in production. Generate a new bcrypt hash and update the `admins` table:

```sql
-- Generate a hash with: node -e "console.log(require('bcryptjs').hashSync('your-new-password', 12))"
UPDATE admins SET password_hash = '<new_bcrypt_hash>' WHERE username = 'admin';
```

### 2.4 Deploy Edge Functions

Install the Supabase CLI, then:

```bash
supabase login
supabase link --project-ref <your-project-ref>

supabase functions deploy sync-matches
supabase functions deploy check-results
supabase functions deploy daily-winner
```

Set the required secrets for your edge functions:

```bash
supabase secrets set FOOTBALL_DATA_API_KEY=9efe905559044dac9fa4cc7b143adfa2
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into edge functions by Supabase.)

### 2.5 Set Up Cron Jobs

In the Supabase SQL Editor:
1. Enable the `pg_cron` and `pg_net` extensions (Dashboard → Database → Extensions)
2. Edit `supabase/cron-jobs.sql` — replace the `current_setting(...)` references with your actual project URL and anon key (or set them as database config vars)
3. Run the script

This schedules:
- **Every 6 hours** → `sync-matches` (pulls upcoming fixtures from football-data.org)
- **Every 15 minutes** → `check-results` (polls live/recent matches, detects finished games, calculates points)
- **Nightly (23:55 UTC)** → `daily-winner` (computes the top scorer of the previous day)

---

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never exposed to client) |
| `FOOTBALL_DATA_API_KEY` | `9efe905559044dac9fa4cc7b143adfa2` (provided) — server-only |
| `ADMIN_SECRET_KEY` | Random secure string for admin session cookie signing |
| `JWT_SECRET` | Random 32+ char string (reserved for future token-based auth) |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |

The football-data.org API key is never exposed to the frontend. It's only used server-side in Edge Functions and API routes.

---

## 4. Deployment (Vercel)

```bash
vercel
```

Add all environment variables from `.env.local` into the Vercel project settings (Project → Settings → Environment Variables). Redeploy after adding them.

---

## 5. How It Works

### Authentication
- No passwords, no OTP. Users register with name, age, gender, place, phone, and optional photo.
- Login is phone-number-only — the system checks the `users` table for a match.
- Sessions are stored in an HttpOnly cookie (`wc26_session`) containing the user record, refreshed from the DB on each session check.
- Admin auth is separate (`/admin/login`), username/password with bcrypt hashing, stored in a `wc26_admin` cookie.

### Points System
| Outcome | Points |
|---|---|
| Correct winner (or correct draw) | +5 |
| Exact scoreline | +5 |
| **Maximum per match** | **10** |

Calculated automatically via the `update_prediction_points()` Postgres function, triggered by the `check-results` Edge Function whenever a match status becomes `FINISHED`.

### Match Lifecycle
1. `sync-matches` pulls scheduled fixtures from football-data.org every 6 hours
2. `check-results` polls every 15 minutes for matches that are live or recently finished
3. On `FINISHED` status, it writes the final score, determines the winner, and calls the points function
4. `daily-winner` runs nightly to crown the top scorer of the previous day

### Prediction Locking
Predictions are rejected server-side (`/api/predictions` POST) once `match_date` has passed or the match status leaves `SCHEDULED`/`TIMED` — this is enforced in the API, not just the UI, so it can't be bypassed by editing client code.

---

## 6. Folder Structure

```
src/
  app/
    page.tsx                  Login page
    register/page.tsx         Registration
    dashboard/page.tsx        User dashboard
    predictions/page.tsx      Prediction page
    leaderboard/page.tsx      Full leaderboard
    profile/page.tsx          Editable profile
    admin/login/page.tsx      Admin login
    admin/dashboard/page.tsx  Admin panel (users, predictions, matches, winners)
    api/                      All backend routes
  components/
    layout/Navbar.tsx
    ui/MatchCard.tsx, Toast.tsx, Skeleton.tsx
  lib/
    supabase/client.ts, server.ts
    auth.ts, points.ts, utils.ts
  types/index.ts
supabase/
  schema.sql                  Full DB schema + RLS + functions
  storage-setup.sql           Profile photo bucket
  cron-jobs.sql                pg_cron schedule
  functions/
    sync-matches/              Edge Function: fixture sync
    check-results/             Edge Function: result polling + points
    daily-winner/               Edge Function: nightly winner calc
```

---

## 7. Security Notes

- Row Level Security is enabled on all tables; writes from the client go through API routes using the service role key server-side only.
- The football-data.org API key never reaches the browser.
- Admin routes are protected by middleware (`src/middleware.ts`) checking for the admin cookie before rendering `/admin/dashboard`.
- Phone numbers are enforced unique at the database level (`UNIQUE` constraint) in addition to an application-level check.
- Change the default admin password and `ADMIN_SECRET_KEY` before going to production.
