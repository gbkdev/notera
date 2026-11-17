import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getCoursesForDepartment, getDepartmentBySlug } from "@/lib/queries";
import { DeptIcon } from "@/components/dept-icon";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getDepartmentBySlug(params.slug);
  return { title: d?.name ?? "Department" };
}

export default async function DepartmentPage({ params }: { params: { slug: string } }) {
  const dept = await getDepartmentBySlug(params.slug);
  if (!dept) notFound();
  const courses = await getCoursesForDepartment(dept.id);

  // Group: academic year → semester → courses (already ordered by the query).
  const years = new Map<string, { label: string; semesters: Map<string, { name: string; courses: Course[] }> }>();
  for (const c of courses) {
    const y = years.get(c.year_id) ?? { label: c.year_label, semesters: new Map() };
    const s = y.semesters.get(c.semester_id) ?? { name: c.semester_name, courses: [] };
    s.courses.push(c);
    y.semesters.set(c.semester_id, s);
    years.set(c.year_id, y);
  }

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/departments" className="hover:text-foreground">Departments</Link> / <span className="text-foreground">{dept.name}</span>
      </nav>
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><DeptIcon name={dept.icon} className="h-7 w-7" /></span>
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl">{dept.name}</h1>
          {dept.description && <p className="mt-2 max-w-2xl text-muted-foreground">{dept.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{dept.course_count} courses · {dept.resource_count} resources</p>
        </div>
      </div>

      <div className="mt-6">
        <LinkButton href={`/resources?dept=${dept.id}`} variant="outline">Search this department</LinkButton>
      </div>

      <div className="mt-10 space-y-12">
        {courses.length === 0 && (
          <EmptyState icon={FolderOpen} title="No courses yet">Courses for this department haven't been added.</EmptyState>
        )}
        {Array.from(years.entries()).map(([yid, y]) => (
          <section key={yid} aria-labelledby={`y-${yid}`}>
            <h2 id={`y-${yid}`} className="mb-5 border-b pb-2 text-2xl font-bold">{y.label}</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {Array.from(y.semesters.entries()).map(([sid, s]) => (
                <div key={sid}>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{s.name}</h3>
                  <ul className="space-y-2">
                    {s.courses.map((c) => (
                      <li key={c.id}>
                        <Link href={`/courses/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary">
                          <span><span className="font-semibold">{c.code}</span> <span className="text-muted-foreground">{c.name}</span></span>
                          <span className="shrink-0 text-xs text-muted-foreground">{c.resource_count} {c.resource_count === 1 ? "file" : "files"}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
