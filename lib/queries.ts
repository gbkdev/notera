import { createClient } from "@/lib/supabase/server";
import { CATEGORY_VALUES, FORMAT_GROUPS, PAGE_SIZE } from "@/lib/constants";
import { UUID_RE } from "@/lib/utils";
import type { AcademicYear, Course, Department, Resource, Semester } from "@/lib/types";

export type ResourceSearch = {
  q?: string; category?: string; year?: string; semester?: string; ext?: string;
  dept?: string; course?: string; sort?: string; page?: string;
};

/** Remove characters that have meaning inside a PostgREST filter string. */
function cleanTerm(term: string) {
  return term.replace(/[%*,()\\"'`:;]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function searchResources(params: ResourceSearch, featuredOnly = false) {
  const supabase = createClient();
  let query = supabase.from("resource_details").select("*", { count: "exact" });

  // Every word must match at least one searchable column.
  for (const word of cleanTerm(params.q ?? "").split(" ").filter(Boolean)) {
    query = query.or(
      [
        "title", "description", "course_name", "course_code",
        "department_name", "category_label", "file_name",
      ].map((col) => `${col}.ilike.%${word}%`).join(",")
    );
  }
  if (params.category && (CATEGORY_VALUES as readonly string[]).includes(params.category))
    query = query.eq("category", params.category);
  if (params.year && UUID_RE.test(params.year)) query = query.eq("year_id", params.year);
  if (params.semester) query = query.eq("semester_name", params.semester.slice(0, 60));
  if (params.dept && UUID_RE.test(params.dept)) query = query.eq("department_id", params.dept);
  if (params.course && UUID_RE.test(params.course)) query = query.eq("course_id", params.course);
  const group = FORMAT_GROUPS.find((g) => g.value === params.ext);
  if (group) query = query.in("file_ext", [...group.exts]);
  if (featuredOnly) query = query.eq("featured", true);

  if (params.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (params.sort === "az") query = query.order("title", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  query = query.order("id");

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return {
    resources: (data ?? []) as Resource[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function getRecentResources(limit = 6) {
  const { data, error } = await createClient()
    .from("resource_details").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}

export async function getFeaturedResources(limit = 6) {
  const { data, error } = await createClient()
    .from("resource_details").select("*").eq("featured", true)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}

export async function getResource(id: string) {
  if (!UUID_RE.test(id)) return null;
  const { data } = await createClient().from("resource_details").select("*").eq("id", id).maybeSingle();
  return (data as Resource | null) ?? null;
}

export async function getDepartments(limit?: number) {
  let q = createClient().from("department_stats").select("*").order("name");
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Department[];
}

export async function getDepartmentBySlug(slug: string) {
  const { data } = await createClient().from("department_stats").select("*").eq("slug", slug).maybeSingle();
  return (data as Department | null) ?? null;
}

export async function getCoursesForDepartment(departmentId: string) {
  const { data, error } = await createClient()
    .from("course_details").select("*").eq("department_id", departmentId)
    .order("year_sort").order("semester_sort").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as Course[];
}

export async function getCourse(id: string) {
  if (!UUID_RE.test(id)) return null;
  const { data } = await createClient().from("course_details").select("*").eq("id", id).maybeSingle();
  return (data as Course | null) ?? null;
}

export async function getFilterOptions() {
  const supabase = createClient();
  const [years, semesters, departments] = await Promise.all([
    supabase.from("academic_years").select("*").order("sort_order").order("label"),
    supabase.from("semesters").select("*").order("sort_order").order("name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const semesterNames = Array.from(new Set(((semesters.data ?? []) as Semester[]).map((s) => s.name)));
  return {
    years: (years.data ?? []) as AcademicYear[],
    semesterNames,
    departments: (departments.data ?? []) as { id: string; name: string }[],
  };
}

export async function getPopularCourses(limit = 6) {
  const { data, error } = await createClient()
    .from("course_details").select("*").gt("resource_count", 0)
    .order("resource_count", { ascending: false }).order("code").limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Course[];
}
