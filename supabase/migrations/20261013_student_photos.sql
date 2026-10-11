-- Run in the Supabase SQL editor after 20261012_fee_setup.sql
-- (it uses public.my_role() from 20261004_profile_on_signup.sql).
-- Run the WHOLE file at once, with nothing selected in the editor.
--
-- Student photos: a PRIVATE storage bucket, because most students are children.
-- Photos are stored as <student id>/<timestamp>.webp (already cropped and compressed in the
-- browser, ~30–80 KB each) and shown through short-lived signed links, never public URLs.
--   Staff (super_admin, coach): upload, replace, remove and view every photo.
--   A student: view only their own photo (for their ID card in the portal).

alter table public.students add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "student_photos_staff_all" on storage.objects;
create policy "student_photos_staff_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'student-photos' and public.my_role() in ('super_admin', 'coach'))
  with check (bucket_id = 'student-photos' and public.my_role() in ('super_admin', 'coach'));

drop policy if exists "student_photos_read_own" on storage.objects;
create policy "student_photos_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] in (select id::text from public.students where profile_id = auth.uid())
  );
