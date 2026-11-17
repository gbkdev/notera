import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getCoursesForDepartment, getDepartmentBySlug } from "@/lib/queries";
import { DeptIcon } from "@/components/dept-icon";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getDepartmentBySlug(params.slug);
  return { title: d?.name ?? "Department" };
}

export default async function DepartmentPage({ params, searchParams }: { params: { slug: string }; searchParams: { year?: string; semester?: string } }) {
  const dept = await getDepartmentBySlug(params.slug);
  if (!dept) notFound();
  const courses = await getCoursesForDepartment(dept.id);

  // Years and semesters that actually have courses, in their configured order.
  const years = Array.from(new Map(courses.map((c) => [c.year_id, { id: c.year_id, label: c.year_label }])).values());
  const year = years.find((y) => y.id === searchParams.year) ?? years[0];
  const semesters = year
    ? Array.from(new Map(courses.filter((c) => c.year_id === year.id).map((c) => [c.semester_id, { id: c.semester_id, name: c.semester_name }])).values())
    : [];
  const semester = semesters.find((s) => s.id === searchParams.semester) ?? semesters[0];
  const shown = courses.filter((c) => c.year_id === year?.id && c.semester_id === semester?.id);
  const base = `/departments/${dept.slug}`;
  const pill = (active: boolean) => cn("rounded-full border px-4 py-1.5 text-sm font-medium", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary");

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> / <Link href="/departments" className="hover:text-foreground">Departments</Link> / <span className="text-foreground">{dept.name}</span>
      </nav>
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><DeptIcon name={dept.icon} className="h-7 w-7" /></span>
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl">{dept.name}</h1>
          {dept.description && <p className="mt-2 max-w-2xl text-muted-foreground">{dept.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{dept.course_count} {dept.course_count === 1 ? "course" : "courses"} · {dept.resource_count} {dept.resource_count === 1 ? "resource" : "resources"}</p>
        </div>
      </div>
      <div className="mt-6"><LinkButton href={`/resources?dept=${dept.id}`} variant="outline">Search this department</LinkButton></div>

      {courses.length === 0 ? (
        <div className="mt-10"><EmptyState icon={FolderOpen} title="No courses yet">Courses for this department haven’t been added.</EmptyState></div>
      ) : (
        <div className="mt-10 space-y-6">
          <div role="group" aria-label="Academic year" className="flex flex-wrap gap-2">
            {years.map((y) => (
              <Link key={y.id} href={`${base}?year=${y.id}`} aria-current={y.id === year?.id ? "true" : undefined} className={pill(y.id === year?.id)}>{y.label}</Link>
            ))}
          </div>
          <div role="group" aria-label="Semester" className="flex flex-wrap gap-2 border-b pb-6">
            {semesters.map((s) => (
              <Link key={s.id} href={`${base}?year=${year!.id}&semester=${s.id}`} aria-current={s.id === semester?.id ? "true" : undefined} className={pill(s.id === semester?.id)}>{s.name}</Link>
            ))}
          </div>
          <h2 className="text-2xl font-bold">{year?.label} · {semester?.name}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary">
                  <span><span className="font-semibold">{c.code}</span> <span className="text-muted-foreground">{c.name}</span></span>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.resource_count} {c.resource_count === 1 ? "file" : "files"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
