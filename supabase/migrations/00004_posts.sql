-- Posts table (direct map from SQLAlchemy Post model)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  content text not null,
  status post_status not null default 'pending',
  source post_source not null,
  source_name varchar(100),
  image_url text,
  hashtags jsonb not null default '[]'::jsonb,

  -- Scheduling & publishing
  scheduled_at timestamptz,
  published_at timestamptz,
  twitter_post_id varchar(50),

  -- Metrics
  impressions integer not null default 0,
  engagements integer not null default 0,
  likes integer not null default 0,
  retweets integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Composite index (matches SQLAlchemy ix_posts_persona_status)
create index ix_posts_persona_status on public.posts(persona_id, status);
create index ix_posts_scheduled_at on public.posts(scheduled_at);
create index ix_posts_persona_id on public.posts(persona_id);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- RLS: access through owned personas
alter table public.posts enable row level security;

create policy "Users can read posts via owned personas"
  on public.posts for select
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can insert posts via owned personas"
  on public.posts for insert
  with check (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can update posts via owned personas"
  on public.posts for update
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can delete posts via owned personas"
  on public.posts for delete
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

-- Service role policy for Edge Functions (publish, scheduled checks)
create policy "Service role full access"
  on public.posts for all
  using (auth.role() = 'service_role');
