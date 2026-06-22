-- ════════════════════════════════════════════════════════════════
-- AD Command — Break Dismiss Tracking
-- Adds explicit dismiss tracking so a manually-dismissed break never
-- reappears on refresh, separate from natural countdown expiry.
-- Run in Supabase SQL Editor → New Query → paste → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.projects
  add column if not exists break_dismissed_at timestamptz,
  add column if not exists break_dismissed_by text default '';
