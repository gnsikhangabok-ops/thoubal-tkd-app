-- Run in the Supabase SQL editor after 20261005_notices_and_activity_log.sql
-- (it uses public.my_role() and public.log_activity() from the earlier files).
--
-- Admissions: one row per application, from first contact to enrolment.
--   applied → under_review → trial → approved → enrolled
--   (or waitlisted / rejected / withdrawn at any point)
-- Each stage change is appended to `history` so the application keeps its own timeline.
-- On enrolment the app creates the student record and links it through student_id.
--
-- Review against your existing schema before running (the foreign keys assume uuid ids
-- on students, training_centers and batches, as used elsewhere in the app).

create table if not exists public.admissions (
  id                  uuid primary key default gen_random_uuid(),
  seq                 bigint generated always as identity,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  status              text not null default 'applied'
                        check (status in ('applied', 'under_review', 'trial', 'approved', 'enrolled', 'waitlisted', 'rejected', 'withdrawn')),
  source              text not null default 'walk_in'
                        check (source in ('walk_in', 'website', 'referral', 'school_camp', 'social_media', 'other')),
  enquiry_id          text,   -- the website enquiry this application came from, if any
  student_id          uuid references public.students (id) on delete set null,

  -- Applicant
  full_name           text not null,
  dob                 date,
  gender              text,
  blood_group         text,
  school              text,

  -- Guardian & contact
  guardian_name       text,
  guardian_relation   text,
  guardian_phone      text,
  guardian_email      text,
  emergency_phone     text,
  address             text,

  -- Training
  training_center_id  uuid references public.training_centers (id) on delete set null,
  batch_id            uuid references public.batches (id) on delete set null,
  current_belt        text not null default 'white',
  prior_experience    text,

  -- Health & documents
  medical_notes       text,
  documents           jsonb not null default '{}'::jsonb,  -- { photo: true, birth_certificate: false, … }

  -- Trial class
  trial_date          date,
  trial_rating        smallint check (trial_rating between 1 and 5),
  trial_notes         text,

  -- Fees
  admission_fee       numeric(10, 2) not null default 0,
  discount            numeric(10, 2) not null default 0,
  amount_paid         numeric(10, 2) not null default 0,
  payment_method      text,
  receipt_no          text,
  paid_on             date,

  -- Consent
  rules_acknowledged  boolean not null default false,
  photo_consent       boolean not null default false,

  notes               text,
  history             jsonb not null default '[]'::jsonb  -- [{ status, at, by, note }]
);

create index if not exists admissions_status_idx on public.admissions (status);
create index if not exists admissions_created_idx on public.admissions (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists admissions_touch on public.admissions;
create trigger admissions_touch
  before update on public.admissions
  for each row execute function public.touch_updated_at();

-- Staff only: applications hold guardians' contact and health details.
alter table public.admissions enable row level security;

drop policy if exists "admissions_staff_all" on public.admissions;
create policy "admissions_staff_all" on public.admissions
  for all to authenticated
  using (public.my_role() in ('super_admin', 'coach'))
  with check (public.my_role() in ('super_admin', 'coach'));

-- Record every change in the Activity Log
drop trigger if exists log_activity on public.admissions;
create trigger log_activity
  after insert or update or delete on public.admissions
  for each row execute function public.log_activity();
