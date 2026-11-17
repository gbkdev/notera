import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/lib/types";

export type CourseOption = Pick<Course, "id" | "code" | "name" | "department_id" | "department_name" | "year_id" | "year_label" | "semester_id" | "semester_name">;

export async function getCourseOptions(supabase: SupabaseClient) {
  const { data } = await supabase.from("course_details")
    .select("id, code, name, department_id, department_name, year_id, year_label, semester_id, semester_name")
    .order("department_name").order("year_sort").order("semester_sort").order("code");
  return (data ?? []) as CourseOption[];
}
