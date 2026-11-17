import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/lib/types";

export async function getCourseOptions(supabase: SupabaseClient) {
  const { data } = await supabase.from("course_details").select("*")
    .order("department_name").order("year_sort").order("semester_sort").order("code");
  return ((data ?? []) as Course[]).map((c) => ({
    id: c.id, label: `${c.code} ${c.name} (${c.department_name}, ${c.year_label}, ${c.semester_name})`,
  }));
}
