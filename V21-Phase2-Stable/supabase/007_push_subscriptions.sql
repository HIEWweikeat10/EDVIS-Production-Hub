-- ════════════════════════════════════════════════════════════════
-- AD Command — Web Push subscriptions
-- Lets the app send real OS-level push notifications (wakes the
-- phone even when it's asleep or the app is closed), not just the
-- in-page live banners. Run in Supabase SQL Editor → New Query.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  unique_key  text not null,
  dept        text default '',
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_push_subs_project on public.push_subscriptions(project_id);
create index if not exists idx_push_subs_dept on public.push_subscriptions(project_id, dept);

-- Broadcasts: optional department target. Null/empty = everyone on the project.
alter table public.broadcasts
  add column if not exists target_dept text default '';
