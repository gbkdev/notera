# Notera

A public academic resource library. Students browse, preview and download files with no account;
administrators manage everything from a protected dashboard.
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres, Storage, Auth) · React Hook Form + Zod.

## Setup

1. **Create a Supabase project**, then open *SQL Editor* and run, in order:
   `supabase/migrations/0001_schema.sql`, `0002_rls_and_storage.sql`, `0003_default_terms.sql`
   (or use `supabase db push` with the Supabase CLI).
2. **Auth settings** (Authentication → Providers → Email): turn **off** "Allow new users to sign up".
   Administrators are created by you, not by visitors.
3. **Create your first admin**: Authentication → Users → *Add user* (email + password, tick auto-confirm). Then run:
   ```sql
   insert into public.admin_profiles (user_id, full_name)
   select id, 'Your Name' from auth.users where email = 'you@university.edu';
   ```
4. `cp .env.example .env.local` and fill in the project URL and **anon** key.
5. `npm install && npm run dev`, then open `/admin` (there is no public link to it; type the address).
6. Optional: Admin → Import JSON adds many departments, years, semesters and courses at once (a template is downloadable on that page).

## Environment variables
| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | you | Metadata base URL |

The service-role key is never used. Every write runs as the signed-in admin and is enforced by Row Level Security.

## Data model
`departments` · `academic_years` → `semesters` → `courses` (also → `departments`) → `resources`; `admin_profiles`.
Read-only views: `resource_details`, `course_details`, `department_stats`.
Files live in the public `resources` Storage bucket (50 MB limit, PDF/PPT/PPTX/DOC/DOCX/XLS/XLSX only).
Parent rows can't be deleted while they still contain children, so no file is ever orphaned.

## Routes
Public: `/`, `/departments`, `/departments/[slug]`, `/courses/[id]`, `/resources`, `/resources/[id]`
Admin: `/admin/login`, `/admin`, `/admin/departments`, `/admin/terms`, `/admin/courses`, `/admin/resources`, `/admin/resources/new`, `/admin/resources/[id]`

## Security notes
- `/admin/*` is gated in middleware, again in the admin layout (checks `admin_profiles`), and again inside every server action.
- Uploads are checked for extension, size and real file signature (magic bytes) on the server; the bucket also enforces size and MIME limits.
- The bucket is public-read by URL but has no list policy. Only upload files you're allowed to distribute.
- Deployment: set the same env vars on your host (e.g. Vercel). Server-action uploads are capped at 55 MB in `next.config.mjs`;
  some hosts impose a smaller request limit (Vercel's is about 4.5 MB), so for large files use a host with a higher limit or self-host.
