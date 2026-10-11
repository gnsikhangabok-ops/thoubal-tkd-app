-- Run in the Supabase SQL editor after 20261011_admissions.sql
-- (it uses public.is_super_admin() and public.log_activity() from the earlier files).
-- Run the WHOLE file at once, with nothing selected in the editor.
--
-- 1. fee_settings: one row of academy-wide fee policy (due day, grace period, late fee,
--    sibling discount, payment methods, UPI ID, receipt prefix and note). Every signed-in user
--    can read it (students' receipts use the same prefix and note); only super admins change it.
-- 2. Fee catalogue details on one_time_fee_types: category, how often it is charged,
--    a description, and the belt a grading fee belongs to.

create table if not exists public.fee_settings (
  id          smallint primary key default 1 check (id = 1),
  settings    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.fee_settings enable row level security;

drop policy if exists "fee_settings_read_signed_in" on public.fee_settings;
create policy "fee_settings_read_signed_in" on public.fee_settings
  for select to authenticated
  using (true);

drop policy if exists "fee_settings_write_super_admin" on public.fee_settings;
create policy "fee_settings_write_super_admin" on public.fee_settings
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop trigger if exists log_activity on public.fee_settings;
create trigger log_activity
  after insert or update or delete on public.fee_settings
  for each row execute function public.log_activity();

alter table public.one_time_fee_types add column if not exists category text not null default 'other';
alter table public.one_time_fee_types add column if not exists frequency text not null default 'one_time';
alter table public.one_time_fee_types add column if not exists description text;
alter table public.one_time_fee_types add column if not exists belt text;
alter table public.one_time_fee_types add column if not exists active boolean not null default true;

-- Existing admission / registration fees go into the right category
update public.one_time_fee_types
   set category = 'admission'
 where category = 'other' and name ~* '(admission|registration)';
