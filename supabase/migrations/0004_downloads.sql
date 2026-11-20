-- Download counts ---------------------------------------------------------------
alter table public.resources add column if not exists download_count int not null default 0;

-- Visitors can't update tables directly, so counting goes through one narrow function.
create or replace function public.increment_download(resource_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.resources set download_count = download_count + 1 where id = resource_id;
$$;
revoke all on function public.increment_download(uuid) from public;
grant execute on function public.increment_download(uuid) to anon, authenticated;

create or replace function public.total_downloads()
returns bigint
language sql
stable
as $$
  select coalesce(sum(download_count), 0)::bigint from public.resources;
$$;
grant execute on function public.total_downloads() to anon, authenticated;

-- Expose the count in the read models (new column is appended last, as CREATE OR REPLACE VIEW requires).
create or replace view public.resource_details with (security_invoker = true) as
select
  r.id, r.title, r.description, r.category,
  case r.category
    when 'lecture_notes' then 'Lecture Notes'
    when 'assignment'    then 'Assignment'
    when 'exam'          then 'Exam'
    when 'presentation'  then 'Presentation'
    when 'reference'     then 'Reference'
  end as category_label,
  r.file_path, r.file_name, r.file_ext, r.file_size, r.featured, r.created_at, r.updated_at,
  c.id as course_id, c.code as course_code, c.name as course_name,
  d.id as department_id, d.name as department_name, d.slug as department_slug,
  s.id as semester_id, s.name as semester_name,
  y.id as year_id, y.label as year_label,
  r.download_count
from public.resources r
join public.courses c on c.id = r.course_id
join public.departments d on d.id = c.department_id
join public.semesters s on s.id = c.semester_id
join public.academic_years y on y.id = s.academic_year_id;

create or replace view public.course_details with (security_invoker = true) as
select
  c.id, c.code, c.name, c.description, c.created_at,
  c.department_id, d.name as department_name, d.slug as department_slug,
  s.id as semester_id, s.name as semester_name, s.sort_order as semester_sort,
  y.id as year_id, y.label as year_label, y.sort_order as year_sort,
  (select count(*) from public.resources r where r.course_id = c.id)::int as resource_count,
  (select coalesce(sum(r.download_count), 0) from public.resources r where r.course_id = c.id)::int as download_count
from public.courses c
join public.departments d on d.id = c.department_id
join public.semesters s on s.id = c.semester_id
join public.academic_years y on y.id = s.academic_year_id;

grant select on public.resource_details, public.course_details to anon, authenticated;
