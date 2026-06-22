# DevOps Diagnostic — Why /api/ping returns 404

Run these in order. Stop at the first one that reveals the problem.

---

## Check 1 — Is this a NEW Vercel project, or reused?

This is the #1 cause of this exact symptom.

If you uploaded this zip into a Vercel project that was originally created
for an earlier version of this app (the Next.js App Router version, or any
version with a `package.json` containing `"next"` as a dependency), Vercel
remembers the original Framework Preset from project creation and may not
fully switch over even if you change the setting afterward.

**Action:** Create a **brand new** Vercel project specifically for this zip.
Do not reuse an existing project. Import this zip fresh.

---

## Check 2 — Framework Preset

Go to: **Vercel Dashboard → [your project] → Settings → General → Build & Development Settings**

Look at **Framework Preset**. It must say exactly: **Other**

If it says "Next.js", "Create React App", or anything else:
1. Click the dropdown
2. Select **Other**
3. Click **Save**
4. Go to **Deployments** tab → click the three dots on the latest deployment → **Redeploy**
5. IMPORTANT: when redeploying, make sure "Use existing Build Cache" is **unchecked**

---

## Check 3 — Root Directory

Same Settings page, look for **Root Directory**.

It must be **blank** (showing nothing, or showing `./`).

If it shows any folder name (e.g. `public`, `app`, `src`):
1. Click **Edit**
2. Clear the field completely
3. Save
4. Redeploy (with build cache unchecked, as above)

---

## Check 4 — Build Command / Output Directory

Same page. Both must be **blank** (left as their default/empty state — do not
type "none" or anything else into them, just leave the field empty).

---

## Check 5 — Confirm the deployed source actually contains api/ping.js

Go to: **Deployments → click the latest deployment → Source tab** (sometimes
labeled "Source" or shown as a file tree icon)

Look for `api/ping.js` in the file listing. 

- **If it's there:** the file uploaded correctly, the problem is Framework Preset or Root Directory (Check 2/3)
- **If it's NOT there:** the zip didn't upload correctly — try re-uploading, or check if you accidentally uploaded a parent folder instead of the zip contents directly

---

## Check 6 — Confirm Vercel registered it as a Function

Go to: **Deployments → click the latest deployment → Functions tab**

- **If `api/ping` (or similar) is listed:** Vercel built it as a function. If `/api/ping` still 404s in the browser, this would be unusual — tell me this specific combination and we dig further.
- **If the Functions tab is empty:** Vercel did not detect any serverless functions in this deployment at all. This confirms Framework Preset or Root Directory is still wrong — go back to Check 2/3.

---

## Most likely outcome

In the large majority of cases matching this exact symptom (zip is correct,
ping.js has zero dependencies, still 404s), the cause is **Check 1**: the
project was deployed into an existing Vercel project that still carries
Next.js framework detection from an earlier deploy. Creating a brand new
Vercel project from scratch resolves this in almost every case.

---

## What to send back

After running through these, reply with:

1. Was this a new Vercel project, or reused? 
2. What Framework Preset shows (exact text)
3. What Root Directory shows (exact text, or "blank")
4. Whether `api/ping.js` appears in the Source tab
5. Whether `api/ping` appears in the Functions tab
6. The exact response (body + status code) when visiting `/api/ping` after a fresh redeploy with build cache disabled
