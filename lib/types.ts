export type Department = {
  id: string; name: string; slug: string; description: string; icon: string;
  course_count: number; resource_count: number;
};
export type Course = {
  id: string; code: string; name: string; description: string;
  department_id: string; department_name: string; department_slug: string;
  semester_id: string; semester_name: string; semester_sort: number;
  year_id: string; year_label: string; year_sort: number; resource_count: number; download_count: number;
};
export type Resource = {
  id: string; title: string; description: string; category: string; category_label: string;
  file_path: string; file_name: string; file_ext: string; file_size: number; featured: boolean;
  created_at: string; updated_at: string;
  course_id: string; course_code: string; course_name: string;
  department_id: string; department_name: string; department_slug: string;
  semester_id: string; semester_name: string; year_id: string; year_label: string;
  download_count: number;
};
export type AcademicYear = { id: string; label: string; sort_order: number };
export type Semester = { id: string; academic_year_id: string; name: string; sort_order: number };
export type ActionResult = { ok: true } | { ok: false; error: string };
