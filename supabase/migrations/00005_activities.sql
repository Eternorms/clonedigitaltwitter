-- Activities table (direct map from SQLAlchemy Activity model)
-- Note: only created_at, no updated_at (matches original model)
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  type activity_type not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- Composite index (matches SQLAlchemy ix_activities_user_created)
create index ix_activities_user_created on public.activities(user_id, created_at);
create index ix_activities_user_id on public.activities(user_id);

-- RLS
alter table public.activities enable row level security;

create policy "Users can read own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

-- Service role for Edge Functions inserting activities
create policy "Service role full access"
  on public.activities for all
  using (auth.role() = 'service_role');
