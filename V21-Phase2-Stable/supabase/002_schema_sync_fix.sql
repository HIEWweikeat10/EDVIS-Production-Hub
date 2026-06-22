-- ════════════════════════════════════════════════════════════════
-- AD Command — Schema Sync Fix
-- Adds columns that the API code expects but the live database is
-- missing. Safe to run multiple times (IF NOT EXISTS on every line).
-- Run in Supabase SQL Editor → New Query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- crew_members: needed for heartbeat / online-offline tracking
alter table public.crew_members
  add column if not exists last_seen_at timestamptz;

-- projects: needed for meal status banner + break timer sync
alter table public.projects
  add column if not exists meal_status      text default 'available',
  add column if not exists break_active     boolean default false,
  add column if not exists break_label      text default '',
  add column if not exists break_end_at     timestamptz,
  add column if not exists break_started_by text default '';

-- Done. Verify with:
-- select column_name from information_schema.columns
-- where table_name='crew_members' and column_name='last_seen_at';
