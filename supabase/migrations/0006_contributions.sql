-- Student requests ("I can't find this") and student contributions (files awaiting review) -----------

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments (id) on delete set null,
  department_text text not null default '' check (char_length(department_text) <= 120),
  course_id uuid references public.courses (id) on delete set null,
  course_text text not null default '' check (char_length(course_text) <= 160),
  title text not null check (char_length(title) between 2 and 200),
  details text not null default '' check (char_length(details) <= 500),
  category public.resource_category,
  contact text not null default '' check (char_length(contact) <= 120),
  status text not null default 'open' check (status in ('open','fulfilled','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists requests_status_idx on public.requests (status, created_at desc);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  department_text text not null default '' check (char_length(department_text) <= 120),
  course_text text not null default '' check (char_length(course_text) <= 160),
  title text not null check (char_length(title) between 2 and 200),
  description text not null default '' check (char_length(description) <= 500),
  category public.resource_category not null,
  file_path text not null unique,
  file_name text not null,
  file_ext text not null check (file_ext in ('pdf','ppt','pptx','doc','docx','xls','xlsx')),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  contact text not null default '' check (char_length(contact) <= 120),
  ip_hash text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  resource_id uuid references public.resources (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists submissions_status_idx on public.submissions (status, created_at desc);
create index if not exists submissions_ip_idx on public.submissions (ip_hash, created_at desc);

alter table public.requests enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "anyone can request" on public.requests;
drop policy if exists "admins read requests" on public.requests;
drop policy if exists "admins update requests" on public.requests;
drop policy if exists "admins delete requests" on public.requests;
drop policy if exists "admins read submissions" on public.submissions;
drop policy if exists "admins update submissions" on public.submissions;
drop policy if exists "admins delete submissions" on public.submissions;

-- Requests: anyone may file one; only admins can read or manage them.
create policy "anyone can request" on public.requests for insert to anon, authenticated with check (status = 'open');
create policy "admins read requests" on public.requests for select to authenticated using (public.is_admin());
create policy "admins update requests" on public.requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete requests" on public.requests for delete to authenticated using (public.is_admin());
grant insert on public.requests to anon, authenticated;
grant select, update, delete on public.requests to authenticated;

-- Submissions: NO public policies at all. Files arrive through a server action; only admins can read or manage them.
create policy "admins read submissions" on public.submissions for select to authenticated using (public.is_admin());
create policy "admins update submissions" on public.submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete submissions" on public.submissions for delete to authenticated using (public.is_admin());
grant select, update, delete on public.submissions to authenticated;

-- Private bucket for files awaiting review (25 MB, document types only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', false, 26214400,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins read submission files" on storage.objects;
drop policy if exists "admins delete submission files" on storage.objects;
create policy "admins read submission files" on storage.objects
  for select to authenticated using (bucket_id = 'submissions' and public.is_admin());
create policy "admins delete submission files" on storage.objects
  for delete to authenticated using (bucket_id = 'submissions' and public.is_admin());
