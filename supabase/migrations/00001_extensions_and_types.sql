-- Extensions
create extension if not exists "pgcrypto";

-- Custom enum types (mapped from SQLAlchemy string enums)
create type post_status as enum ('pending', 'approved', 'rejected', 'scheduled', 'published');
create type post_source as enum ('claude_ai', 'rss', 'manual', 'template');
create type activity_type as enum ('post_approved', 'post_published', 'post_rejected', 'source_synced', 'ai_generated');
create type source_status as enum ('active', 'paused', 'error');

-- Reusable trigger function for updated_at (replaces TimestampMixin.onupdate)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
