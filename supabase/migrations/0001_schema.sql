-- Notera schema ----------------------------------------------------------
create extension if not exists pgcrypto;

-- Admin profiles: a user listed here is an administrator ---------------------
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Departments -----------------------------------------------------------------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 400),
  icon text not null default 'graduation-cap',
  created_at timestamptz not null default now()
);

-- Academic years and semesters ------------------------------------------------
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (char_length(label) between 1 and 60),
  sort_order int not null default 0
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 60),
  sort_order int not null default 0,
  unique (academic_year_id, name)
);

-- Courses ---------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete restrict,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  code text not null check (char_length(code) between 1 and 20),
  name text not null check (char_length(name) between 2 and 160),
  description text not null default '' check (char_length(description) <= 400),
  created_at timestamptz not null default now(),
  unique (department_id, semester_id, code)
);
create index courses_department_idx on public.courses (department_id);
create index courses_semester_idx on public.courses (semester_id);

-- Resources -------------------------------------------------------------------
create type public.resource_category as enum
  ('lecture_notes', 'assignment', 'exam', 'presentation', 'reference');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  title text not null check (char_length(title) between 2 and 200),
  description text not null default '' check (char_length(description) <= 500),
  category public.resource_category not null,
  file_path text not null unique,
  file_name text not null,
  file_ext text not null check (file_ext in ('pdf','ppt','pptx','doc','docx','xls','xlsx')),
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resources_course_idx on public.resources (course_id);
create index resources_created_idx on public.resources (created_at desc);
create index resources_featured_idx on public.resources (featured) where featured;

create trigger resources_touch before update on public.resources
  for each row execute function public.touch_updated_at();

-- Read models (security_invoker: RLS of the base tables still applies) ---------
create view public.resource_details with (security_invoker = true) as
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
  y.id as year_id, y.label as year_label
from public.resources r
join public.courses c on c.id = r.course_id
join public.departments d on d.id = c.department_id
join public.semesters s on s.id = c.semester_id
join public.academic_years y on y.id = s.academic_year_id;

create view public.course_details with (security_invoker = true) as
select
  c.id, c.code, c.name, c.description, c.created_at,
  c.department_id, d.name as department_name, d.slug as department_slug,
  s.id as semester_id, s.name as semester_name, s.sort_order as semester_sort,
  y.id as year_id, y.label as year_label, y.sort_order as year_sort,
  (select count(*) from public.resources r where r.course_id = c.id)::int as resource_count
from public.courses c
join public.departments d on d.id = c.department_id
join public.semesters s on s.id = c.semester_id
join public.academic_years y on y.id = s.academic_year_id;

create view public.department_stats with (security_invoker = true) as
select
  d.id, d.name, d.slug, d.description, d.icon,
  (select count(*) from public.courses c where c.department_id = d.id)::int as course_count,
  (select count(*) from public.resources r join public.courses c on c.id = r.course_id
     where c.department_id = d.id)::int as resource_count
from public.departments d;
