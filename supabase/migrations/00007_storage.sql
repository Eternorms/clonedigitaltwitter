-- Post images storage bucket
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true);

-- Public read access for post images
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Authenticated users can upload images
create policy "Auth users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
  );

-- Users can delete their own uploaded images (stored in user-id subfolder)
create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
