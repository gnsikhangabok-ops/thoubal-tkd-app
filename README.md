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
| `/admin/*` | `super_admin`, `coach` | Fee Setup, Website Content, Users and Activity Log are super-admin only |
| `/portal` | `student` | Shows next steps until an admin links the login to a student record (Users module) |
| `/unauthorized`, `*` | Anyone | 403 and 404 pages |

## Features

- **Public site**: homepage with quick services, admission enquiry form, rules page; English / Hindi / Manipuri
- **Student & parent portal**: attendance, fees with downloadable receipts, belt progress, printable
  certificates and ID card, notices with a notification bell
- **Management portal**: every list has search, filters, sorting, Excel (CSV) export and print / PDF;
  Reports & Analytics with charts and a monthly report; Notices; Activity Log (super admin)
- **Documents**: student ID cards, fee receipts and belt certificates with QR codes, printed at true size
- **App-wide**: light / dark mode, installable app (manifest + service worker) that keeps working on a
  poor connection

Translations live in `src/i18n/` (keys are the English text). The Manipuri (Meitei Mayek) file is a
draft and should be reviewed by a native speaker.

## Photos

Default website photos live in `src/assets/photos/` and are wired up in `src/lib/defaultPhotos.js`
(banner, About, coach portraits, gallery). An admin can replace any of them from Website Content.
They were prepared with `scripts/process-photos.cjs` (crop phone-camera stamps, gentle sharpening
and colour, full + small sizes, blurred previews). The coach portraits are by Naoboy Photography;
keep the on-card credit if you reuse them. For sharper results, re-run the script on the original
camera files.

## Database

Run these in the Supabase SQL editor, in order, after checking them against your existing policies:

1. `supabase/migrations/20261004_profile_on_signup.sql`: creates profiles server-side on signup and
   prevents users from choosing their own role.
2. `supabase/migrations/20261005_notices_and_activity_log.sql`: the activity log (table, triggers,
   super-admin-only read access) and notices read/write policies.
