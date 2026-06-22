-- ════════════════════════════════════════════════════════════════
-- AD Command — Script Scene ↔ Scene Tab Linkage
-- Adds scene_id to script_scenes so Script status inherits from the
-- master Scene Tab record instead of tracking its own duplicate status.
-- Nullable: existing/unlinked script scenes keep working unchanged.
-- Run in Supabase SQL Editor → New Query → paste → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.script_scenes
  add column if not exists scene_id uuid references public.scenes(id) on delete set null;

create index if not exists idx_script_scenes_scene_id on public.script_scenes(scene_id);
