# Phase 2 Test Checklist

Run these in order. Each one builds on the last.

## 1. /api/ping returns JSON
- [ ] Visit `https://your-app.vercel.app/api/ping`
- [ ] Response is JSON, not HTML or a 404 page
- [ ] All three env values show `"SET"`

## 2. Create Project works
- [ ] Open the app, click **New Project**
- [ ] Fill in title, admin key (defaults to `Lester2026`, editable), name, role, department
- [ ] Click **Create Project**
- [ ] A popup appears showing a 6-character project code
- [ ] Clicking **Enter Project** opens the app — Dashboard tab visible

## 3. Join Project works from a second device
- [ ] On a second device/browser, click **Join Project**
- [ ] Enter the code from step 2, plus name/role/department
- [ ] Click **Join Production**
- [ ] App opens directly to Dashboard — no error shown

## 4. project_id / session saves correctly
- [ ] On either device, open browser DevTools → Application → Local Storage
- [ ] Confirm `adcmd_session` contains `projectId` (a UUID) and `projectCode` (6 chars)
- [ ] Refresh the page — app reopens automatically without re-entering login

## 5. Data saves to Supabase
- [ ] On Device A, go to Scenes tab → Add Scene → fill in number/description → Save
- [ ] In Supabase Dashboard → Table Editor → `scenes` table
- [ ] Confirm the new row appears with the correct `project_id`

## 6. Second device updates within 5 seconds
- [ ] With Device A's new scene saved, wait up to 5 seconds on Device B
- [ ] Device B's Scenes tab shows the new scene without manual refresh

## 7. Broadcast realtime works
- [ ] On Device A, send a broadcast (Lunch Break, Wrap, or Custom message)
- [ ] Device B should show the broadcast in under 1 second — not waiting for the 5s poll
- [ ] Check browser console on Device B for `Realtime config failed` warnings (should be none)

## 8. No service_role key in HTML
- [ ] View page source on the deployed site (Ctrl+U / Cmd+Opt+U)
- [ ] Search for "service_role" or "SERVICE_ROLE" — must return zero matches
- [ ] Search for the actual service_role key value — must return zero matches

## 9. No "fetch failed" errors
- [ ] Open browser console during Create Project, Join Project, and normal app use
- [ ] No red "TypeError: Failed to fetch" or "fetch failed" messages
- [ ] All API calls return either success or a clear error message (not a silent crash)

## 10. No 404 on any /api/* route
- [ ] Visit each of these directly and confirm none return 404:
  - `/api/ping`
  - `/api/projects` (will show 405 Method Not Allowed for GET — that's correct, not 404)
  - `/api/members` (same — 405 for GET is fine)
  - `/api/project-data` (same — 405 for GET is fine)
  - `/api/save` (same — 405 for GET is fine)
  - `/api/realtime-config` (this one IS a GET route — should return JSON)
  - `/api/list` (this one IS a GET route — should return JSON)
  - `/api/archive` (405 for GET is fine)
  - `/api/delete` (405 for GET is fine)

---

## Admin-only checks

- [ ] **Manage Project** panel loads project list from Supabase (not localStorage)
- [ ] Entering wrong Admin Key on Archive/Delete shows "Incorrect admin key" — action does NOT proceed
- [ ] Entering correct Admin Key but wrong confirm text on Delete shows "type DELETE PROJECT" error
- [ ] Successful Archive hides the project from the Join dropdown but data remains in Supabase
- [ ] Successful Delete removes the project AND all related rows (scenes, talent, etc.) — verify in Supabase Table Editor

## Crew permission checks

- [ ] Crew member (non-admin role) cannot see Manage Project option succeed without admin key
- [ ] Crew member's Crew tab shows other online members within 30s (heartbeat) and goes offline after ~2 min of inactivity
