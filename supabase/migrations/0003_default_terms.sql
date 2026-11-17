-- Starter academic structure (editable from the admin dashboard).
with years as (
  insert into public.academic_years (label, sort_order)
  values ('Year 1', 1), ('Year 2', 2), ('Year 3', 3), ('Year 4', 4), ('Year 5', 5)
  on conflict (label) do nothing
  returning id
)
select 1;

insert into public.semesters (academic_year_id, name, sort_order)
select y.id, s.name, s.ord
from public.academic_years y
cross join (values ('Semester 1', 1), ('Semester 2', 2)) as s(name, ord)
on conflict (academic_year_id, name) do nothing;
