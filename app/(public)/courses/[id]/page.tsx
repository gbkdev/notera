import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";
import { getCourse, searchResources, type ResourceSearch } from "@/lib/public-queries";
import { ResourceFilters } from "@/components/resource-filters";
import { ResourceGrid } from "@/components/resource-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { ContributeCta } from "@/components/contribute-cta";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const c = await getCourse(params.id);
  if (!c) return { title: "Course" };
  const title = `${c.code} ${c.name}`;
  const description = `${c.resource_count} ${c.resource_count === 1 ? "file" : "files"} for ${title} · ${c.department_name}, ${c.year_label}, ${c.semester_name}`;
  return { title, description, openGraph: { title, description, siteName: "Notera" } };
}

export default async function CoursePage(props: { params: Promise<{ id: string }>; searchParams: Promise<ResourceSearch> }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const course = await getCourse(params.id);
  if (!course) notFound();
  const result = await searchResources({ ...searchParams, course: course.id });
  const filtered = Object.entries(searchParams).some(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> / <Link href="/departments" className="hover:text-foreground">Departments</Link> /{" "}
        <Link href={`/departments/${course.department_slug}`} className="hover:text-foreground">{course.department_name}</Link> /{" "}
        <span className="text-foreground">{course.code}</span>
      </nav>
      <h1 className="text-4xl font-bold sm:text-5xl"><span className="text-primary">{course.code}</span> {course.name}</h1>
      <p className="mt-3 text-muted-foreground">
        {course.year_label} · {course.semester_name} · {course.resource_count} {course.resource_count === 1 ? "file" : "files"}
      </p>
      {course.description && <p className="mt-3 max-w-2xl text-muted-foreground">{course.description}</p>}
      <div className="mt-5"><ShareButton path={`/courses/${course.id}`} title={`${course.code} ${course.name}`} /></div>
      <div className="mt-8"><ResourceFilters /></div>
      <div className="mt-8">
        {result.resources.length === 0 ? (
          <EmptyState icon={SearchX} title={filtered ? "Nothing matches those filters" : "No files for this course yet"}
            action={<div className="flex flex-wrap justify-center gap-2">
              {filtered && <LinkButton href={`/courses/${course.id}`} variant="outline">Clear filters</LinkButton>}
              <LinkButton href={`/contribute?tab=request&course=${course.id}`}>Request files</LinkButton>
              <LinkButton href={`/contribute?tab=share&course=${course.id}`} variant="outline">Share a file</LinkButton>
            </div>}>
            {filtered ? "Try a different search or remove a filter." : "Check back soon, or browse other courses in this department."}
          </EmptyState>
        ) : (
          <>
            <ResourceGrid resources={result.resources} />
            <div className="mt-8"><ContributeCta courseId={course.id} compact /></div>
            <Pagination basePath={`/courses/${course.id}`} params={searchParams as Record<string, string | undefined>} page={result.page} pageCount={result.pageCount} />
          </>
        )}
      </div>
    </div>
  );
}
