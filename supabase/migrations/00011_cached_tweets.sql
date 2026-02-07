-- Cached tweets from Twitter API v2
create table public.cached_tweets (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  tweet_id varchar(30) not null,
  text text not null,
  tweeted_at timestamptz not null,
  like_count integer not null default 0,
  retweet_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate tweets per persona
create unique index ix_cached_tweets_persona_tweet
  on public.cached_tweets(persona_id, tweet_id);

-- For "top by engagement" queries
create index ix_cached_tweets_engagement
  on public.cached_tweets(persona_id, ((like_count + retweet_count)) desc);

-- For "most recent" queries
create index ix_cached_tweets_recent
  on public.cached_tweets(persona_id, tweeted_at desc);

create trigger cached_tweets_updated_at
  before update on public.cached_tweets
  for each row execute function public.handle_updated_at();

-- RLS: read through owned personas
alter table public.cached_tweets enable row level security;

create policy "Users can read cached_tweets via owned personas"
  on public.cached_tweets for select
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

-- Service role for Edge Functions (fetch-tweets inserts/deletes)
create policy "Service role full access"
  on public.cached_tweets for all
  using (auth.role() = 'service_role');

-- Add last_tweet_fetch_at to personas for UI "updated X hours ago"
alter table public.personas
  add column last_tweet_fetch_at timestamptz;
