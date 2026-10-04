-- Run in the Supabase SQL editor (or with `supabase db push`).
--
-- 1. Creates the profile row server-side when someone signs up, so it works even when
--    email confirmation is on (the browser has no session yet at that point).
-- 2. Stops users choosing their own role: self-service inserts may only create 'student',
--    and nobody can change their own role. Only super_admins change roles (Users module).
--
-- Review against your existing policies on public.profiles before running.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'student', coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by the policies below (security definer avoids recursive RLS on profiles).
create or replace function public.is_super_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

-- The caller's current role, read without triggering RLS on profiles again.
create or replace function public.my_role()
returns public.profiles.role%type
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

-- Self-service insert (fallback path in Signup.jsx): own row, student role only.
drop policy if exists "profiles_insert_self_student" on public.profiles;
create policy "profiles_insert_self_student" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'student');

-- Users may edit their own row but not their role.
drop policy if exists "profiles_update_self_no_role_change" on public.profiles;
create policy "profiles_update_self_no_role_change" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

-- Super admins manage everyone (role changes from the Users module).
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
