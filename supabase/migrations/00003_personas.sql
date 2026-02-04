-- Personas table (direct map from SQLAlchemy Persona model)
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(100) not null,
  handle varchar(50) not null,
  emoji varchar(10),
  description text,
  tone varchar(100),
  topics jsonb not null default '[]'::jsonb,

  -- Twitter integration
  twitter_user_id varchar(50),
  twitter_access_token text,
  twitter_refresh_token text,
  twitter_connected boolean not null default false,

  -- Stats
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

-- RLS
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
