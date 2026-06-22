# DEPLOYMENT.md — V21-Phase2-Stable

## Required Environment Variables

Set these in Vercel → Project → Settings → Environment Variables.
Tick **Production, Preview, and Development** for each.

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` `secret` key |

**When copying these values:** click directly on the key/URL text or its
copy icon. Do not select and copy a surrounding block of text (e.g. a
whole `.env` file or a code snippet from documentation) — extra
characters before or after the real value will break the connection.
`/api/ping` (see Step 4 below) will tell you if this happens.

## Deployment Steps

### 1. Upload to Vercel

Upload `V21-Phase2-Stable.zip` as a new Vercel project (or redeploy an
existing one with this zip's contents).

- **Framework Preset:** Other
- **Build Command:** leave blank
- **Output Directory:** leave blank
- **Root Directory:** leave blank

This project has no build step — `index.html` is served as-is, and
`/api/*.js` files are plain Vercel serverless functions.

### 2. Configure Environment Variables

Add all three variables listed above. Double-check each value has no
extra whitespace or surrounding text (see note above).

### 3. Redeploy

After adding/changing environment variables, you must trigger a new
deployment for them to take effect — Vercel does not apply env var
changes to an already-running deployment.

Go to **Deployments** → latest deployment → **⋯** → **Redeploy**.
Uncheck "Use existing Build Cache" if prompted.

### 4. Verify `/api/ping`

Visit `https://your-deployment-url.vercel.app/api/ping` in a browser.

Expected response:
```json
{
  "ok": true,
  "version": "V21-Phase2-Stable",
  "releaseDate": "2026-06-21",
  "msg": "AD Command Phase 2 API is alive",
  "time": "...",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "SET",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "SET",
    "SUPABASE_SERVICE_ROLE_KEY": "SET"
  }
}
```

- If you see `"MISSING"` for any variable — it wasn't saved correctly, or
  the deployment hasn't picked up the latest env vars yet. Re-check
  Step 2 and Step 3.
- If you see `"SET (⚠ contains N extra char(s)...)"` — the value has
  stray characters. The app will likely still work (the code strips
  these automatically), but it's worth re-pasting the value cleanly.
- If `/api/ping` returns a 404 instead of JSON — the Framework Preset
  or Root Directory setting is wrong. Revisit Step 1.

### 5. Confirm database connectivity

Visit `https://your-deployment-url.vercel.app/api/list`. This should
return a JSON list of existing projects (or an empty array `[]` if none
exist yet) — not an error. This confirms the service role key can
actually reach your Supabase database, not just that it's present.

### 6. Open the app

Visit the root URL. You should see the AD Command login/project screen.
Create or join a project to confirm the full flow works end-to-end.

## Database Setup (first deployment only)

If this is a brand-new Supabase project, run the SQL files in
`/supabase/` **in order** (001 through 006) via Supabase Dashboard →
SQL Editor → New Query. If you're redeploying against an existing,
already-configured database, this step is not needed.
