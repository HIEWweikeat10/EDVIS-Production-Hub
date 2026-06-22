# CHANGELOG — V21-Phase2-Stable

Frozen release: 2026-06-21
Base: AD Command V21 UI, Phase 2 Supabase multi-device sync.

This document summarizes the fixes applied across 12 QA rounds to take
Phase 2 from initial Supabase wiring to a stable, multi-device-verified
release. No further changes have been made since the final QA sign-off.

---

## Infrastructure & Deployment

- Fixed Vercel framework detection (plain serverless `/api/*.js`, no
  Next.js, no build step required)
- Fixed Supabase connection failures caused by polluted environment
  variables (typos, stray newlines, accidentally-pasted surrounding text)
  — `_db.js` now strips to the first whitespace-delimited token, and
  `/api/ping` reports exactly how many extra characters were found
- Fixed `unique_key` NOT NULL constraint silently failing every
  `crew_members` insert since the first deploy
- Fixed missing database columns (`last_seen_at`, break/meal/dash
  tracking fields, `dash_title`) that the API code expected but the
  live schema didn't have
- Created Supabase Storage bucket (`ad-command-files`) and the
  `api/upload-callsheet.js` route for real file uploads
- Created `destinations` table with backfill from existing scene
  locations

## Login & Session

- Migrated from localStorage-only Phase 1 to live Supabase-backed
  Create Project / Join Project / Manage Project
- Fixed `launchAppFromSession` missing definition
- Removed default admin key value — field now starts empty

## Core Sync (Scenes, Talent, Crew, Meals, Reports)

- Wired Talent creation/edit, Artist dept toggles, Scene creation, Camera
  Log, Meal selection, Reports to `dbSave()` — all were previously
  local-only and silently reverted on the next poll
- Fixed `UPSERT` calls missing `on_conflict`, which caused the *second*
  write to the same record to silently fail (Artist status, meal choice
  could not be changed after the first selection)
- Fixed field-name mismatches between server hydration and client
  reads (`calltime`/`callTime`, `mime`/`type`, call sheet `size` format)
- Fixed Report detail modal — UUID broadcast/report IDs were embedded
  unquoted in `onclick`, breaking the button after any server round-trip
- Fixed a 5-second-poll race condition where the entire `scenes` array
  (including `.cameras` and in-progress Camera Log form input) could be
  silently replaced mid-edit; polling now preserves the open scene's
  in-progress data

## Broadcast & Realtime

- Added Realtime reconnection logic (auto-retry on `CHANNEL_ERROR` /
  `TIMED_OUT` / `CLOSED`)
- Added polling fallback for all animated broadcast tags (On Set,
  Safety, Set Signal, Wrap) so devices without an active Realtime
  connection still receive the animation within one poll cycle
- Added Pinned/Urgent broadcast derivation on receiving devices
- Redesigned Set Signal to match On The Run Mode's full-screen overlay
  treatment (was a thin, easy-to-miss notification bar)

## Meal Break

- Added a persistent, integrated Dashboard countdown card (separate
  from the acknowledgement popup — no duplicate displays)
- Fixed the break starter/admin not seeing their own Dashboard timer
  (local state was never pushed to `window._projectMeta` before the
  next poll arrived)
- Added local dismiss persistence (keyed per break instance via
  `break_end_at`) so a dismissed popup does not reappear until a
  genuinely new break starts
- Separated "Dismiss" (hides popup locally only) from "Release for
  Everyone" (ends the break for all devices, admin/starter only)
- Added automatic server-side expiry when a countdown reaches zero

## Wrap Day / New Day / Reset Whole Project

- Fixed Wrap Day animation not reaching other devices (Realtime-only,
  no polling fallback)
- Built `api/new-day.js` — resets scene status, talent stage, camera
  log, dept status, broadcasts, reports, today's meals, and clears
  `is_wrapped` — previously local-only, fully undone by the next poll
- Fixed New Day not clearing `is_wrapped` server-side, which caused the
  Wrap banner to reappear on every device's next poll
- Built `api/reset-project.js` — admin-key-gated full project wipe
  (scenes, camera logs, talent, dept status, meals, broadcasts, reports,
  call sheets, scripts, destinations). Crew members and **History
  records are intentionally preserved** — History is a permanent audit
  trail, not active production data

## Script Tab

- Wired Script Scene creation, dialogue lines, and deletion to
  Supabase (was entirely local-only)
- Added Scene ↔ Script linkage — Script Scenes can link to a Scene Tab
  record via a dropdown; status is inherited automatically, eliminating
  duplicate/conflicting status tracking

## Dashboard

- Replaced placeholder "Today Pages" card with "Talent Count"
  (real data: total + on-set count)
- Replaced "Scenes Done" card with "Destination Count" (derived from
  scene locations)
- Added Destination dropdown to Scene creation/editing — select
  existing or create new, auto-saved for future use

## Camera Log

- Fixed the Log Take form silently closing and losing in-progress
  input every 5-second poll (the form's HTML was being fully rebuilt
  from a template that always defaults to closed/empty)
- Removed the "Operator" field from the take display, CSV export, and
  print report (redundant with Camera Roll)
- Added a Save button to the Cameras section (Shot Code, Lens, Shot
  Type, Camera Label, Notes) — was previously impossible to persist

## History

- Added History delete (was local-only, deleted items resurrected on
  next poll)
- Confirmed History is excluded from both New Day and Reset Whole
  Project — it remains a permanent log

---

## Known Limitations (carried forward, not in scope for this release)

- Script tab file upload (the actual PDF/script document, distinct from
  dialogue entry) still uses a local-only blob URL — out of scope,
  not requested for fix
- No automated test suite — all verification has been manual QA plus
  direct Supabase queries during this development process
