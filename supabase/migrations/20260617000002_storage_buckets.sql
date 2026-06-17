-- Create storage buckets used by the app (idempotent)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('consent-signatures', 'consent-signatures', false, 5242880, array['image/png','image/jpeg','image/webp']),
  ('consent-pdfs',       'consent-pdfs',       false, 10485760, array['application/pdf']),
  ('before-after',       'before-after',        false, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- RLS policies for consent-signatures
create policy "Authenticated users can upload consent signatures"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'consent-signatures');

create policy "Authenticated users can read consent signatures"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'consent-signatures');

create policy "Authenticated users can delete consent signatures"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'consent-signatures');

-- RLS policies for consent-pdfs
create policy "Authenticated users can upload consent pdfs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'consent-pdfs');

create policy "Authenticated users can read consent pdfs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'consent-pdfs');

-- RLS policies for before-after
create policy "Authenticated users can upload before-after"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'before-after');

create policy "Authenticated users can read before-after"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'before-after');

create policy "Authenticated users can delete before-after"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'before-after');
