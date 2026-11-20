# Notera

A public academic resource library. Students browse, preview and download files with no account;
administrators manage everything from a protected dashboard.
Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Postgres, Storage, Auth) · React Hook Form + Zod.

## Setup
Requires Node.js 20.9 or newer (Next.js 16). If you are upgrading an older copy, **delete the old `middleware.ts`**: Next 16 uses `proxy.ts` instead, and having both is an error.

1. **Create a Supabase project**, then open *SQL Editor* and run, in order:
   `supabase/migrations/0001_schema.sql`, `0002_rls_and_storage.sql`, `0003_default_terms.sql`
   (or use `supabase db push` with the Supabase CLI). Also run `0004_downloads.sql`, `0005_reports.sql`, `0006_contributions.sql`, `0007_realtime.sql` (live updates) and `0008_more_file_types.sql` (extra file types). **Existing projects: run 0004 in the SQL Editor BEFORE deploying this version.**
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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (**secret**) | Server-only. Used for one job: accepting student file uploads into the private `submissions` bucket. Never prefix it with `NEXT_PUBLIC_`. Without it, students can still send requests but the "share a file" form is switched off. |
| `NEXT_PUBLIC_SITE_URL` | you | Public address (e.g. `https://noteras.vercel.app`). Used for share links, link previews and the sitemap. On Vercel it falls back to the production domain if unset. |

Every admin write runs as the signed-in admin and is enforced by Row Level Security. The service-role key is used only for student uploads (see below).

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

## Student features (no account)
- **Saved:** bookmark files; stored in the browser (`localStorage`), up to 60. Page: `/saved`.
- **Report a problem:** on every resource page. Stored in the `reports` table; admins review under Admin → Reports. One report per file per browser per day; a hidden honeypot field catches simple bots.
- **Installable app:** web manifest + tiny service worker (`public/sw.js`). It only shows an offline page and caches fingerprinted JS/CSS; it never caches pages, API calls or files.
- **Light on data:** file sizes and a "large file" hint on cards, no background prefetching of resource pages, and previews wait for a tap on Data Saver / slow connections.

## Student requests and contributions (no account)
Page: `/contribute` (linked from the header, footer, homepage and every empty state).
- **Request a file:** department, optional course, what they need, optional contact. Admins see these under Admin → Requests.
- **Share a file:** drag and drop, tagged by department/course (or typed in if theirs isn't listed). The file goes to a **private** bucket and does nothing until an admin opens it, picks the course and clicks *Approve and publish*, which moves it to the public bucket. *Reject* deletes it.
- **Guards:** server-side type/size/content check (25 MB for students), rights checkbox, honeypot, 5 per browser and 5 per network per day (network address stored only as a keyed hash), and a cap of 150 pending files.

## Live updates and speed
- **Live:** public pages and the admin area subscribe to Supabase Realtime (`LiveRefresh`). When an admin features a resource, uploads a file or edits a course, open pages update in place within a couple of seconds, with no reload. Needs `0007_realtime.sql`. If it isn't run, everything still works, just without live pushes.
- **Cached reads:** public pages read through `lib/public-queries.ts` (shared cache, refreshed every 60 s and cleared instantly by any admin change). The admin area always reads fresh data from `lib/queries.ts`.
- **Test speed with a production build:** `npm run build && npm run start`. `npm run dev` compiles each page the first time you open it and is much slower. On Vercel, set the function region (Settings → Functions) to the one closest to your Supabase project.

## Supported file types
Defined once in `lib/formats.ts` (28 types). Documents: pdf, doc, dot, docx, dotx, odt, rtf. Presentations: ppt, pps, pot, pptx, ppsx, potx, odp. Spreadsheets: xls, xlsx, ods, csv. Text: txt, md. Images: png, jpg, jpeg, gif, webp. Archives: zip, rar, 7z.
Every upload is checked by extension, size **and real file content**. Previews: PDF and images in the browser; Word/PowerPoint/Excel files via Microsoft's viewer; everything else is download-only.
Deliberately refused: programs and scripts, HTML/SVG, macro-enabled Office files. To add a type, add one line to `lib/formats.ts`, then regenerate the SQL for `0008` (the allowed list in the database must match).
