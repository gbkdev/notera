import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getFilterOptions, searchResources, type ResourceSearch } from "@/lib/public-queries";
import { ResourceFilters } from "@/components/resource-filters";
import { ResourceGrid } from "@/components/resource-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ContributeCta } from "@/components/contribute-cta";

export const metadata: Metadata = { title: "Browse resources" };
export const dynamic = "force-dynamic";

export default async function ResourcesPage(props: { searchParams: Promise<ResourceSearch> }) {
  const searchParams = await props.searchParams;
  const [options, result] = await Promise.all([getFilterOptions(), searchResources(searchParams)]);
  const filtered = Object.entries(searchParams).some(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <div className="py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">{searchParams.q ? `Results for “${searchParams.q.slice(0, 60)}”` : "All resources"}</h1>
      <p className="mt-3 text-muted-foreground" aria-live="polite">
        {result.total} {result.total === 1 ? "resource" : "resources"}{filtered ? " match your filters" : ""}
      </p>
      <div className="mt-8"><ResourceFilters years={options.years} semesterNames={options.semesterNames} departments={options.departments} /></div>
      <div className="mt-8">
        {result.resources.length === 0 ? (
          <EmptyState icon={SearchX} title={filtered ? "Nothing matches those filters" : "No resources yet"}
            action={<div className="flex flex-wrap justify-center gap-2">
              {filtered && <LinkButton href="/resources" variant="outline">Clear filters</LinkButton>}
              <LinkButton href={`/contribute?tab=request${searchParams.q ? `&q=${encodeURIComponent(searchParams.q.slice(0, 100))}` : ""}${searchParams.dept ? `&dept=${searchParams.dept}` : ""}`}>Request this file</LinkButton>
              <LinkButton href="/contribute?tab=share" variant="outline">Share a file</LinkButton>
            </div>}>
            {filtered ? "Try a shorter search, or remove a filter. Still nothing? Ask for it and we’ll look." : "Files appear here as soon as an administrator uploads them."}
          </EmptyState>
        ) : (
          <>
            <ResourceGrid resources={result.resources} />
            <Pagination basePath="/resources" params={searchParams as Record<string, string | undefined>} page={result.page} pageCount={result.pageCount} />
            <div className="mt-10"><ContributeCta q={searchParams.q} deptId={searchParams.dept} compact /></div>
          </>
        )}
      </div>
    </div>
  );
}
