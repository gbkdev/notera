import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";
import { getCourse, searchResources, type ResourceSearch } from "@/lib/queries";
import { ResourceFilters } from "@/components/resource-filters";
import { ResourceGrid } from "@/components/resource-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await getCourse(params.id);
  return { title: c ? `${c.code} ${c.name}` : "Course" };
}

export default async function CoursePage({ params, searchParams }: { params: { id: string }; searchParams: ResourceSearch }) {
  const course = await getCourse(params.id);
  if (!course) notFound();
  const result = await searchResources({ ...searchParams, course: course.id });
  const filtered = Object.entries(searchParams).some(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/departments" className="hover:text-foreground">Departments</Link> /{" "}
        <Link href={`/departments/${course.department_slug}`} className="hover:text-foreground">{course.department_name}</Link> /{" "}
        <span className="text-foreground">{course.code}</span>
      </nav>
      <h1 className="text-4xl font-bold sm:text-5xl"><span className="text-primary">{course.code}</span> {course.name}</h1>
      <p className="mt-3 text-muted-foreground">
        {course.year_label} · {course.semester_name} · {course.resource_count} {course.resource_count === 1 ? "file" : "files"}
      </p>
      {course.description && <p className="mt-3 max-w-2xl text-muted-foreground">{course.description}</p>}
      <div className="mt-8"><ResourceFilters /></div>
      <div className="mt-8">
        {result.resources.length === 0 ? (
          <EmptyState icon={SearchX} title={filtered ? "Nothing matches those filters" : "No files for this course yet"}
            action={filtered ? <LinkButton href={`/courses/${course.id}`} variant="outline">Clear filters</LinkButton> : undefined}>
            {filtered ? "Try a different search or remove a filter." : "Check back soon, or browse other courses in this department."}
          </EmptyState>
        ) : (
          <>
            <ResourceGrid resources={result.resources} />
            <Pagination basePath={`/courses/${course.id}`} params={searchParams as Record<string, string | undefined>} page={result.page} pageCount={result.pageCount} />
          </>
        )}
      </div>
    </div>
  );
}
