-- ════════════════════════════════════════════════════════════════
-- AD Command — Phase 2 Supabase Schema
-- Run this once in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── PROJECTS ────────────────────────────────────────────────────
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  title           text not null,
  admin_key_hash  text not null default '',
  day_number      int  not null default 1,
  is_wrapped      boolean not null default false,
  archived        boolean not null default false,
  archived_at     timestamptz,
  archived_by     text default '',
  meal_status     text default 'available',
  break_active    boolean default false,
  break_label     text default '',
  break_end_at    timestamptz,
  break_started_by text default '',
  dash_calltime   text default '06:00 AM',
  dash_location   text default '',
  dash_notes      text default '',
  created_at      timestamptz not null default now()
);
create index if not exists idx_projects_code on public.projects(code);
create index if not exists idx_projects_archived on public.projects(archived);

-- ── CREW MEMBERS ────────────────────────────────────────────────
create table if not exists public.crew_members (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null,
  phone         text default '',
  role          text not null,
  dept          text not null,
  is_admin      boolean not null default false,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_crew_project on public.crew_members(project_id);

-- ── SCENES ──────────────────────────────────────────────────────
create table if not exists public.scenes (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  number        text, description text, ie text, time_of_day text,
  location      text default 'TBC', status text default 'pending',
  pages         text default '1.0', cast_list jsonb default '[]',
  props text default '', wardrobe text default '', makeup_notes text default '',
  camera_notes text default '', sound_notes text default '', lighting text default '',
  general_notes text default '', next_prep text default '', sort_order int default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_scenes_project on public.scenes(project_id);

create table if not exists public.scene_cameras (
  id          uuid primary key default gen_random_uuid(),
  scene_id    uuid not null references public.scenes(id) on delete cascade,
  label text, lens text default '', shot_type text default '',
  shot_code text default '', notes text default '', sort_order int default 0
);

create table if not exists public.camera_log (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  scene_id      uuid references public.scenes(id) on delete cascade,
  camera_roll text default '', card text default 'Card 1',
  clip_code text, take_number text default 'Take 1', operator text default '',
  status text default 'good', notes text default '',
  created_at    timestamptz not null default now()
);
create index if not exists idx_camlog_scene on public.camera_log(scene_id);

-- ── TALENT ──────────────────────────────────────────────────────
create table if not exists public.talent (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name text not null, character text default '', phone text default '',
  manager text default '', call_time text default '', notes text default '',
  stage text default 'not_arrived', sort_order int default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_talent_project on public.talent(project_id);

create table if not exists public.dept_status (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  talent_id   uuid not null references public.talent(id) on delete cascade,
  dept text not null, status text default 'none',
  unique(talent_id, dept)
);
create index if not exists idx_deptstatus_project on public.dept_status(project_id);

-- ── MEALS ───────────────────────────────────────────────────────
create table if not exists public.meals (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  day_number int default 1, meal_choice text,
  updated_at    timestamptz not null default now(),
  unique(crew_member_id, day_number)
);
create index if not exists idx_meals_project on public.meals(project_id);

-- ── BROADCASTS ──────────────────────────────────────────────────
create table if not exists public.broadcasts (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  message text not null, tag text default 'Signal',
  dot_color text default '#378add', mark_type text default 'normal',
  sent_by text default '', created_at timestamptz not null default now()
);
create index if not exists idx_broadcasts_project on public.broadcasts(project_id, created_at desc);

-- ── REPORTS ─────────────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  from_name text, from_dept text, to_role text,
  categories jsonb default '[]', message text, status text default 'open',
  created_at  timestamptz not null default now()
);
create index if not exists idx_reports_project on public.reports(project_id);

-- ── CALL SHEETS ─────────────────────────────────────────────────
create table if not exists public.call_sheets (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  file_name text, file_size int default 0, storage_key text,
  mime_type text default 'application/pdf', is_active boolean default true,
  uploaded_by text default '', created_at timestamptz not null default now()
);
create index if not exists idx_callsheets_project on public.call_sheets(project_id);

-- ── SCRIPT ──────────────────────────────────────────────────────
create table if not exists public.script_scenes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  number text, description text, ie text default 'INT', time_of_day text default 'D',
  direction text default '', sort_order int default 0,
  created_at  timestamptz not null default now()
);
create table if not exists public.script_lines (
  id              uuid primary key default gen_random_uuid(),
  script_scene_id uuid not null references public.script_scenes(id) on delete cascade,
  character_name text, line_text text, sort_order int default 0
);

-- ── PRODUCTION HISTORY ──────────────────────────────────────────
create table if not exists public.production_history (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  day_number int, wrapped_at timestamptz default now(), notes text default '',
  call_sheet_name text default '',
  scenes_done int default 0, scenes_total int default 0, scenes_list jsonb default '[]',
  meals_total int default 0, meals_breakdown jsonb default '{}',
  talent_wrapped int default 0, talent_total int default 0, talent_list jsonb default '[]',
  camera_good int default 0, camera_kiv int default 0, camera_ng int default 0, camera_total int default 0,
  reports_total int default 0, reports_list jsonb default '[]',
  broadcast_count int default 0, crew_count int default 0
);
create index if not exists idx_history_project on public.production_history(project_id);

-- Done. All tables use ON DELETE CASCADE so deleting a project
-- automatically removes every related row.
