-- ════════════════════════════════════════════════════════════════
-- AD Command — Round 6 schema additions
-- Both already applied directly to the live database during this
-- session; included here for migration history / fresh-DB setup.
-- ════════════════════════════════════════════════════════════════

alter table public.projects add column if not exists dash_title text default '';
