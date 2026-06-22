-- ════════════════════════════════════════════════════════════════
-- AD Command — Destinations Table
-- Both already applied directly to the live database during this
-- session; included here for migration history / fresh-DB setup.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(project_id, name)
);
create index if not exists idx_destinations_project on public.destinations(project_id);

-- Backfill from existing scene locations so current data isn't lost
insert into public.destinations (project_id, name)
select distinct project_id, location
from public.scenes
where location is not null and location != '' and location != 'TBC'
on conflict (project_id, name) do nothing;
