# Thoubal Taekwondo Academy

Public website, admin/coach management portal and student/parent portal for Thoubal Taekwondo Academy.
React + Vite + Tailwind CSS, backed by Supabase.

## Setup

```bash
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

`npm run lint` runs oxlint; `npm run build` produces the production bundle in `dist/`.

## User flow

| Route | Who | Notes |
| --- | --- | --- |
| `/` | Public | Homepage, admission enquiry form |
| `/rules` | Public | Latest published rules & regulations |
| `/signup` | Public | Creates a **student** account; staff are upgraded by a super admin |
| `/login` | Public | Signed-in users are sent on to `/redirect` |
| `/redirect` | Signed in | Sends `super_admin`/`coach` → `/admin`, `student` → `/portal`; shows "Account setup pending" if no profile exists |
| `/admin/*` | `super_admin`, `coach` | Fee Setup, Website Content and Users are super-admin only |
| `/portal` | `student` | Shows next steps until an admin links the login to a student record (Users module) |
| `/unauthorized`, `*` | Anyone | 403 and 404 pages |

## Database

`supabase/migrations/20261004_profile_on_signup.sql` creates profiles server-side on signup and
prevents users from choosing their own role. Run it in the Supabase SQL editor after checking it
against your existing `profiles` policies.
