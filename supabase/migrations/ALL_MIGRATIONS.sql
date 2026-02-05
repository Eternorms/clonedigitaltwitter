-- ============================================
-- Clone Digital Twitter - ALL MIGRATIONS
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ===== 00001: Extensions and Types =====
create extension if not exists "pgcrypto";

create type post_status as enum ('pending', 'approved', 'rejected', 'scheduled', 'published');
create type post_source as enum ('claude_ai', 'rss', 'manual', 'template');
create type activity_type as enum ('post_approved', 'post_published', 'post_rejected', 'source_synced', 'ai_generated');
create type source_status as enum ('active', 'paused', 'error');

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ===== 00002: Profiles =====
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  plan text not null default 'free',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuário'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ===== 00003: Personas =====
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(100) not null,
  handle varchar(50) not null,
  emoji varchar(10),
  description text,
  tone varchar(100),
  topics jsonb not null default '[]'::jsonb,
  twitter_user_id varchar(50),
  twitter_access_token text,
  twitter_refresh_token text,
  twitter_connected boolean not null default false,
  followers_count integer not null default 0,
  engagement_rate numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ix_personas_user_id on public.personas(user_id);
create index ix_personas_handle on public.personas(handle);

create trigger personas_updated_at
  before update on public.personas
  for each row execute function public.handle_updated_at();

alter table public.personas enable row level security;

create policy "Users can read own personas"
  on public.personas for select
  using (auth.uid() = user_id);

create policy "Users can insert own personas"
  on public.personas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own personas"
  on public.personas for update
  using (auth.uid() = user_id);

create policy "Users can delete own personas"
  on public.personas for delete
  using (auth.uid() = user_id);

-- ===== 00004: Posts =====
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  content text not null,
  status post_status not null default 'pending',
  source post_source not null,
  source_name varchar(100),
  image_url text,
  hashtags jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  twitter_post_id varchar(50),
  impressions integer not null default 0,
  engagements integer not null default 0,
  likes integer not null default 0,
  retweets integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ix_posts_persona_status on public.posts(persona_id, status);
create index ix_posts_scheduled_at on public.posts(scheduled_at);
create index ix_posts_persona_id on public.posts(persona_id);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

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

create policy "Service role full access"
  on public.posts for all
  using (auth.role() = 'service_role');

-- ===== 00005: Activities =====
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  type activity_type not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index ix_activities_user_created on public.activities(user_id, created_at);
create index ix_activities_user_id on public.activities(user_id);

alter table public.activities enable row level security;

create policy "Users can read own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "Service role full access"
  on public.activities for all
  using (auth.role() = 'service_role');

-- ===== 00006: RSS Sources =====
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

create policy "Service role full access"
  on public.rss_sources for all
  using (auth.role() = 'service_role');

-- ===== 00007: Storage =====
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true);

create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Auth users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===== 00008: Scheduled Posts =====
create or replace function public.check_scheduled_posts()
returns void as $$
declare
  post_record record;
begin
  for post_record in
    select p.id, p.persona_id
    from public.posts p
    where p.status = 'scheduled'
      and p.scheduled_at <= now()
  loop
    update public.posts
    set status = 'approved', updated_at = now()
    where id = post_record.id;

    perform pg_notify('scheduled_post_ready', json_build_object(
      'post_id', post_record.id,
      'persona_id', post_record.persona_id
    )::text);
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================
-- DONE! All tables, policies, and functions created.
-- Next: Enable pg_cron extension in Dashboard > Database > Extensions
-- Then run: select cron.schedule('check-scheduled-posts', '* * * * *', 'select public.check_scheduled_posts()');
-- ============================================
