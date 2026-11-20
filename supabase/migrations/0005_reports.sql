-- "Report a problem": anonymous visitors may file a report; only admins can read or manage them.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  reason text not null check (reason in ('broken_file','wrong_content','wrong_course','copyright','other')),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "anyone can report" on public.reports;
drop policy if exists "admins read reports" on public.reports;
drop policy if exists "admins update reports" on public.reports;
drop policy if exists "admins delete reports" on public.reports;

create policy "anyone can report" on public.reports
  for insert to anon, authenticated with check (status = 'open');
create policy "admins read reports" on public.reports
  for select to authenticated using (public.is_admin());
create policy "admins update reports" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete reports" on public.reports
  for delete to authenticated using (public.is_admin());

grant insert on public.reports to anon, authenticated;
grant select, update, delete on public.reports to authenticated;
