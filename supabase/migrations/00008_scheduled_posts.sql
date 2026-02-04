-- Function to check and promote scheduled posts
-- Replaces Celery periodic task
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
    -- Mark as approved (ready for publishing)
    update public.posts
    set status = 'approved', updated_at = now()
    where id = post_record.id;

    -- Notify via pg_notify for Realtime listeners
    perform pg_notify('scheduled_post_ready', json_build_object(
      'post_id', post_record.id,
      'persona_id', post_record.persona_id
    )::text);
  end loop;
end;
$$ language plpgsql security definer;

-- Note: pg_cron must be enabled via Supabase Dashboard > Database > Extensions
-- Then run manually in SQL Editor:
-- select cron.schedule('check-scheduled-posts', '* * * * *', 'select public.check_scheduled_posts()');
