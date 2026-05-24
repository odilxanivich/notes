# Notes App — Vercel + Supabase

Dark iOS-style notes app. Password-protected. Responsive for iPhone 12 mini, Galaxy Tab A 8.0, and desktop.

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → New Project
2. Choose a name, set a strong DB password, pick a region close to you
3. Wait for it to spin up (~1 min)

### Create the database tables:
4. In Supabase dashboard → **SQL Editor** → **New Query**
5. Paste the entire contents of `supabase-schema.sql` and click **Run**

### Create image storage bucket:
6. Go to **Storage** → **New bucket**
7. Name it exactly: `note-images`
8. Set to **Public** (so images render in your notes)
9. Click Create

### Get your keys:
10. Go to **Settings** → **API**
11. Copy:
    - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
    - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Vercel Deploy

1. Push this folder to a **GitHub repo** (private recommended)
2. Go to https://vercel.com → New Project → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Go to **Environment Variables** and add ALL of these:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role secret key |
| `APP_PASSWORD` | **Your secret entrance password** |
| `SESSION_SECRET` | Any random 40+ char string |

5. Click **Deploy**

---

## Step 3 — Local Development

```bash
npm install
# Fill in .env.local with your actual values
npm run dev
```

Open http://localhost:3000

---

## How It Works

- **Password gate**: visiting the site shows a password screen. Only you know the password. Session lasts 30 days (cookie).
- **Lock button**: the 🔒 icon in the sidebar logs you out
- **Read-only default**: notes are gray/non-editable until you click the ✏️ pencil icon
- **Auto-save**: saves ~1 second after you stop typing
- **Pinned notes**: starred notes stay at the top
- **Images**: uploaded to Supabase Storage, embedded in notes
- **Tables**: insert via toolbar, add rows/columns by clicking inside a table first then +Row / +Col

---

## Data Safety

- All notes stored in Supabase Postgres — persistent, backed up automatically
- Images in Supabase Storage — also persistent
- Supabase free tier: 500MB DB, 1GB storage — years of notes before you hit limits
- To back up: Supabase Dashboard → **Database** → **Backups** (Pro) or export via SQL Editor

---

## Responsive Breakpoints

| Device | Behavior |
|--------|----------|
| iPhone 12 mini (375px) | Full-screen sidebar → tap note → full-screen editor, back button |
| Galaxy Tab A 8.0 (~800px) | Narrower sidebar (240px) + editor side by side |
| Desktop | Full 280px sidebar + editor |
