# RECOVERY.md — V21-Phase2-Stable

This guide covers what to do if the live deployment breaks. Keep
`V21-Phase2-Stable.zip` somewhere safe — it is the rollback target for
every scenario below.

---

## If the Vercel project breaks

Symptoms: site won't load, `/api/ping` returns 404 or 500 persistently,
deployment stuck failing, or the project was accidentally deleted.

### Recovery steps

1. **Recreate the project.** Go to [vercel.com/new](https://vercel.com/new),
   upload `V21-Phase2-Stable.zip` directly (or via drag-and-drop).
2. **Set Framework Preset to "Other"** — do not let Vercel auto-detect
   Next.js or any other framework. Build Command, Output Directory, and
   Root Directory should all be left blank.
3. **Add environment variables** — see `DEPLOYMENT.md` for the exact
   three variables needed and where to find them in Supabase.
4. **Deploy.**
5. **Verify `/api/ping`** returns `"version": "V21-Phase2-Stable"` and
   all three env vars show `"SET"`.
6. **Verify `/api/list`** returns your existing projects — this confirms
   the new Vercel deployment is correctly talking to the *same*
   Supabase database as before (your data is not lost, it lives in
   Supabase, not in Vercel).

### If you're not sure what broke

Re-deploying `V21-Phase2-Stable.zip` fresh, following the steps above,
resolves the large majority of Vercel-side issues — most past problems
in this project's history were caused by stale Framework Preset
settings or polluted environment variable values, both of which a
clean re-deploy fixes.

---

## If Supabase breaks

Symptoms: `/api/ping` shows env vars as `SET` but `/api/list` or any
other data-touching route returns `"fetch failed"`, `401 Invalid API
key`, or similar.

### Recovery steps

#### 1. Verify the project is active

Go to Supabase Dashboard → your project. Check the status banner at the
top. If it says **"Coming up..."** or **"Paused"**, the database is not
ready. Free-tier projects pause automatically after a period of
inactivity and take a few minutes to resume on the next request — wait
and retry rather than assuming something is broken.

#### 2. Verify the tables exist

Go to **Table Editor** and confirm these 16 tables are present:

```
projects, crew_members, scenes, scene_cameras, camera_log, talent,
dept_status, meals, broadcasts, reports, call_sheets, script_scenes,
script_lines, production_history, destinations, (storage bucket:
ad-command-files)
```

If any are missing, run the corresponding SQL file from `/supabase/`
(numbered 001–006) via **SQL Editor → New Query**. They are safe to
re-run — every statement uses `if not exists` / `add column if not
exists`, so re-running an already-applied migration does nothing
harmful.

#### 3. Verify the storage bucket exists

Go to **Storage**. Confirm a bucket named `ad-command-files` exists,
set to **Public**. If missing, see `006_destinations.sql`'s sibling
bucket-creation step, or recreate manually:
- Name: `ad-command-files`
- Public: Yes
- File size limit: 25MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/jpg`

#### 4. Verify the API keys

Go to **Settings → API**. Confirm the `anon` `public` key and
`service_role` `secret` key match exactly what's set in Vercel's
environment variables (see `DEPLOYMENT.md`). If Supabase ever rotated
or regenerated these keys, Vercel's stored copies will be stale and
need updating + redeploying.

#### 5. Verify Row Level Security (RLS) is not blocking the service role

The app uses `SUPABASE_SERVICE_ROLE_KEY` server-side for all writes,
which bypasses RLS by design. If RLS was somehow misconfigured to
restrict the service role specifically (unusual, but possible if
custom policies were added), data operations will fail even with a
correct key. Check **Authentication → Policies** for each table — the
service role should not be subject to any policy restrictions.

---

## General rule

**Vercel holds no data** — your project, scenes, talent, broadcasts,
etc. all live in Supabase. Recreating the Vercel deployment from
`V21-Phase2-Stable.zip` never causes data loss, as long as it's pointed
at the same Supabase project via the correct environment variables.

**Supabase holds all data** — if Supabase itself is deleted or reset,
data is genuinely lost unless you have a separate backup (Supabase
Dashboard → Database → Backups, available on paid tiers).
