-- Run in the Supabase SQL editor after 20261004_profile_on_signup.sql
-- (it uses public.is_super_admin() and public.my_role() from that file).
--
-- 1. Activity log: every insert / update / delete on the academy's tables is recorded
--    with who did it, when, and what changed. Only super admins can read it, and nobody
--    can edit or delete entries from the app.
-- 2. Notices: staff can publish notices; every signed-in user can read them.
--
-- Review against your existing policies before running.

-- ---------- 1. Activity log ----------

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_name  text,
  table_name  text not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  row_id      text,
  changes     jsonb
);

create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_table_idx on public.audit_log (table_name);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_read_super_admin" on public.audit_log;
create policy "audit_log_read_super_admin" on public.audit_log
  for select to authenticated
  using (public.is_super_admin());
-- No insert/update/delete policies: rows are written only by the trigger below.

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  diff jsonb;
  k text;
begin
  if tg_op = 'UPDATE' then
    -- keep only the columns that actually changed: { column: { "from": old, "to": new } }
    diff := '{}'::jsonb;
    for k in select jsonb_object_keys(new_row) loop
      if new_row -> k is distinct from old_row -> k then
        diff := diff || jsonb_build_object(k, jsonb_build_object('from', old_row -> k, 'to', new_row -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then
      return new; -- nothing changed
    end if;
  else
    diff := coalesce(new_row, old_row);
  end if;

  insert into public.audit_log (actor_id, actor_name, table_name, action, row_id, changes)
  values (
    auth.uid(),
    (select full_name from public.profiles where id = auth.uid()),
    tg_table_name,
    lower(tg_op),
    coalesce(new_row ->> 'id', old_row ->> 'id', new_row ->> 'key', old_row ->> 'key'),
    diff
  );
  return coalesce(new, old);
end;
$$;

-- Attach the trigger to every academy table that exists
do $$
declare
  t text;
begin
  foreach t in array array[
    'students', 'coaches', 'training_centers', 'batches', 'attendance',
    'grading_events', 'grading_results', 'student_performance', 'achievements',
    'events', 'event_registrations', 'fee_payments', 'fee_structures',
    'one_time_fees', 'one_time_fee_payments', 'accounts_transactions',
    'inventory_items', 'enquiries', 'rules_and_regulations', 'site_content',
    'profiles', 'notices'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists log_activity on public.%I', t);
      execute format(
        'create trigger log_activity after insert or update or delete on public.%I
           for each row execute function public.log_activity()', t);
    end if;
  end loop;
end;
$$;

-- ---------- 2. Notices ----------

alter table public.notices enable row level security;

drop policy if exists "notices_read_signed_in" on public.notices;
create policy "notices_read_signed_in" on public.notices
  for select to authenticated
  using (true);

drop policy if exists "notices_write_staff" on public.notices;
create policy "notices_write_staff" on public.notices
  for all to authenticated
  using (public.my_role() in ('super_admin', 'coach'))
  with check (public.my_role() in ('super_admin', 'coach'));
