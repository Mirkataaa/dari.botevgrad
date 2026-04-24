-- Create public bucket for campaign videos
insert into storage.buckets (id, name, public)
values ('campaign-videos', 'campaign-videos', true)
on conflict (id) do nothing;

-- Public read access
create policy "Campaign videos are publicly readable"
on storage.objects
for select
using (bucket_id = 'campaign-videos');

-- Authenticated users can upload to their own folder
create policy "Users can upload own campaign videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'campaign-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own video files; admins can update any
create policy "Users can update own campaign videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'campaign-videos'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Users can delete their own video files; admins can delete any
create policy "Users can delete own campaign videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'campaign-videos'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);