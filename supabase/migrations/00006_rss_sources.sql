-- RSS Sources table (direct map from SQLAlchemy RSSSource model)
create table public.rss_sources (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  name varchar(100) not null,
  url text not null,
  category varchar(50),
  status source_status not null default 'active',
  icon varchar(10),
  last_sync_at timestamptz,
  article_count integer not null default 0,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ix_rss_sources_persona_id on public.rss_sources(persona_id);
create index ix_rss_sources_status on public.rss_sources(status);

create trigger rss_sources_updated_at
  before update on public.rss_sources
  for each row execute function public.handle_updated_at();

-- RLS: access through owned personas
alter table public.rss_sources enable row level security;

create policy "Users can read rss_sources via owned personas"
  on public.rss_sources for select
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can insert rss_sources via owned personas"
  on public.rss_sources for insert
  with check (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can update rss_sources via owned personas"
  on public.rss_sources for update
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can delete rss_sources via owned personas"
  on public.rss_sources for delete
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

-- Service role for Edge Functions (sync-rss)
create policy "Service role full access"
  on public.rss_sources for all
  using (auth.role() = 'service_role');
