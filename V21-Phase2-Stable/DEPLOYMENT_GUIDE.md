# AD Command — Phase 2 Deployment Guide

## What changed from Phase 1
Phase 1 was localStorage-only (single device, no sync). Phase 2 replaces the
no-op sync stubs with real Supabase persistence. The UI, tabs, and roles are
unchanged — only the data layer is now live.

---

## Step 1 — Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for provisioning to finish
3. Go to **Project Settings → API** and copy:
   - `Project URL` (e.g. `https://xxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (keep this secret — never share or commit it)

## Step 2 — Run the SQL migration

1. In Supabase, open **SQL Editor → New Query**
2. Paste the entire contents of `supabase/001_schema.sql`
3. Click **Run**
4. Confirm no errors — this creates all 14 tables with foreign keys and cascade deletes

## Step 3 — Deploy to Vercel

1. Upload this project (as a zip or via GitHub) to a **new** Vercel project
2. Framework Preset → **Other**
3. Build Command → **leave blank**
4. Output Directory → **leave blank**
5. Root Directory → **leave blank**

## Step 4 — Set environment variables in Vercel

Go to **Project → Settings → Environment Variables** and add all three,
ticking **Production, Preview, and Development** for each:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key |

## Step 5 — Deploy

1. Click **Deploy** (or **Redeploy** if env vars were added after first deploy)
2. Wait for the build to finish

## Step 6 — Test `/api/ping` first

Visit `https://your-app.vercel.app/api/ping` in your browser.

Expected response:
```json
{
  "ok": true,
  "msg": "AD Command Phase 2 API is alive",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "SET",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "SET",
    "SUPABASE_SERVICE_ROLE_KEY": "SET"
  }
}
```

If any env shows `"MISSING"` — go back to Step 4, re-check the variable name
spelling exactly, and redeploy.

If you get a 404 instead of JSON — Framework Preset is not set to "Other",
or Root Directory is not blank. Fix in Vercel Settings and redeploy.

## Step 7 — Test the full flow

Follow `TEST_CHECKLIST.md` in this zip.

---

## Architecture summary

- **Frontend**: single `index.html`, no build step, no framework
- **Backend**: plain Vercel serverless functions in `/api/*.js`
- **Database**: Supabase Postgres via REST API (no Supabase client SDK on the server)
- **Realtime**: Supabase Realtime JS client, browser-side only, using the
  public anon key (never the service role key)
- **Auth model**: no Supabase Auth. Admin Key is hashed with SHA-256
  server-side and compared on every privileged action. Crew join with
  Project Code only, no key required.
