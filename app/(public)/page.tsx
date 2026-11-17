import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { getDepartments, getFeaturedResources, getRecentResources } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { ResourceCard, ResourceGrid } from "@/components/resource-card";
import { DepartmentCard } from "@/components/department-card";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function SectionHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
        {linkLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [departments, recent, featured] = await Promise.all([getDepartments(6), getRecentResources(6), getFeaturedResources(6)]);
  const shelf = recent.slice(0, 3);

  return (
    <>
      <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.25fr_1fr] lg:py-24">
        <div>
          <h1 className="text-balance text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
            Your Learning Resources, All in One Place.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Lecture notes, assignments, past exams and slides for your courses. Preview them here and download — no account needed.
          </p>
          <div className="mt-8 max-w-2xl"><SearchBar large /></div>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Browse by category">
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link href={`/resources?category=${c.value}`}
                  className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary">
                  <c.icon className="h-4 w-4" aria-hidden />{c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div aria-label="Latest uploads" className="relative hidden lg:block">
          {shelf.length === 0 ? (
            <EmptyState icon={FolderOpen} title="The shelves are empty">Resources appear here as soon as they're uploaded.</EmptyState>
          ) : (
            <div className="space-y-3">
              {shelf.map((r, i) => (
                <div key={r.id} style={{ marginLeft: `${(i % 2) * 28}px` }}><ResourceCard r={r} /></div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10">
        <SectionHead title="Browse by department" href="/departments" linkLabel="All departments" />
        {departments.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No departments yet">An administrator needs to add departments before they appear here.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => <DepartmentCard key={d.id} d={d} />)}
          </div>
        )}
      </section>

      <section className="py-10">
        <SectionHead title="Recently added" href="/resources" linkLabel="See everything" />
        {recent.length === 0
          ? <EmptyState icon={FolderOpen} title="Nothing uploaded yet" action={<LinkButton href="/departments" variant="outline">Browse departments</LinkButton>}>New files will show up here.</EmptyState>
          : <ResourceGrid resources={recent} />}
      </section>

      {featured.length > 0 && (
        <section className="py-10">
          <SectionHead title="Featured resources" href="/resources" linkLabel="Browse all" />
          <ResourceGrid resources={featured} />
        </section>
      )}
    </>
  );
}
