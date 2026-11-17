import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CourseForm } from "@/components/admin/simple-forms";
import { DeleteButton } from "@/components/admin/bits";
import { buttonVariants, LinkButton } from "@/components/ui/button";
import { deleteCourse } from "@/app/actions/admin";
import type { Course } from "@/lib/types";

export default async function AdminCourses({ searchParams }: { searchParams: { edit?: string } }) {
  const { supabase } = await requireAdmin();
  const [c, d, s] = await Promise.all([
    supabase.from("course_details").select("*").order("department_name").order("year_sort").order("semester_sort").order("code"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("semesters").select("id, name, academic_years(label, sort_order)").order("sort_order"),
  ]);
  const courses = (c.data ?? []) as Course[];
  const semesters = ((s.data ?? []) as unknown as { id: string; name: string; academic_years: { label: string; sort_order: number } | null }[])
    .sort((a, b) => (a.academic_years?.sort_order ?? 0) - (b.academic_years?.sort_order ?? 0))
    .map((m) => ({ id: m.id, label: `${m.academic_years?.label ?? ""} — ${m.name}` }));
  const editing = courses.find((x) => x.id === searchParams.edit);
  const missing = (d.data ?? []).length === 0 || semesters.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">Courses</h1><LinkButton href="/admin/import" variant="outline">Add many from JSON</LinkButton></div>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold">{editing ? `Edit ${editing.code}` : "Add a course"}</h2>
        {missing && <p className="mb-4 rounded-md bg-muted p-3 text-sm">Add at least one <Link className="underline" href="/admin/departments">department</Link> and one <Link className="underline" href="/admin/terms">semester</Link> first.</p>}
        <CourseForm key={editing?.id ?? "new"} id={editing?.id} departments={d.data ?? []} semesters={semesters}
          initial={editing ? { department_id: editing.department_id, semester_id: editing.semester_id, code: editing.code, name: editing.name, description: editing.description } : undefined} />
      </section>
      <ul className="divide-y rounded-lg border bg-card">
        {courses.length === 0 && <li className="p-6 text-sm text-muted-foreground">No courses yet.</li>}
        {courses.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">{x.code} {x.name}</p>
              <p className="text-sm text-muted-foreground">{x.department_name} · {x.year_label} · {x.semester_name} · {x.resource_count} files</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href={`/admin/courses?edit=${x.id}`} aria-label={`Edit ${x.code}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil className="h-4 w-4" /></Link>
              <DeleteButton label={x.code} action={deleteCourse.bind(null, x.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
