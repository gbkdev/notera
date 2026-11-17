-- Row Level Security --------------------------------------------------------
alter table public.admin_profiles enable row level security;
alter table public.departments    enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters      enable row level security;
alter table public.courses        enable row level security;
alter table public.resources      enable row level security;

-- Admin profiles: a signed-in user may read only their own row. No client writes.
create policy "read own admin profile" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());

-- Public catalogue: anyone may read; only admins may write.
do $$
declare t text;
begin
  foreach t in array array['departments','academic_years','semesters','courses','resources']
  loop
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

grant select on public.resource_details, public.course_details, public.department_stats to anon, authenticated;

-- Storage: public bucket (objects are served by URL), writes restricted to admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources', 'resources', true, 52428800,
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
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No SELECT policy on purpose: public buckets serve files by URL, but nobody can list the bucket.
create policy "admins upload resources" on storage.objects
  for insert to authenticated with check (bucket_id = 'resources' and public.is_admin());
create policy "admins update resources" on storage.objects
  for update to authenticated using (bucket_id = 'resources' and public.is_admin())
  with check (bucket_id = 'resources' and public.is_admin());
create policy "admins delete resources" on storage.objects
  for delete to authenticated using (bucket_id = 'resources' and public.is_admin());
