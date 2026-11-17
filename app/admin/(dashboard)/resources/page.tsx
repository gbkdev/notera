import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { searchResources, type ResourceSearch } from "@/lib/queries";
import { DeleteButton, FeatureToggle } from "@/components/admin/bits";
import { buttonVariants, LinkButton } from "@/components/ui/button";
import { FormatBadge } from "@/components/resource-card";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/app/actions/admin";
import { formatBytes, formatDate } from "@/lib/utils";

export default async function AdminResources({ searchParams }: { searchParams: ResourceSearch }) {
  await requireAdmin();
  const result = await searchResources({ q: searchParams.q, page: searchParams.page, sort: searchParams.sort });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Resources</h1>
        <LinkButton href="/admin/resources/new">Upload resource</LinkButton>
      </div>
      <form role="search" className="flex max-w-lg gap-2">
        <Input name="q" defaultValue={searchParams.q ?? ""} aria-label="Search resources" placeholder="Search by title, course or department" />
        <Button type="submit" variant="outline"><Search className="h-4 w-4" /> Search</Button>
      </form>
      <ul className="divide-y rounded-lg border bg-card">
        {result.resources.length === 0 && (
          <li className="p-6 text-sm text-muted-foreground">{searchParams.q ? "No resources match that search." : "No resources yet. Upload the first one."}</li>
        )}
        {result.resources.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium"><FormatBadge ext={r.file_ext} /><span className="truncate">{r.title}</span></p>
              <p className="text-sm text-muted-foreground">{r.course_code} · {r.category_label} · {formatBytes(r.file_size)} · {formatDate(r.created_at)}</p>
            </div>
            <div className="flex items-center gap-1">
              <FeatureToggle id={r.id} featured={r.featured} />
              <Link href={`/admin/resources/${r.id}`} aria-label={`Edit ${r.title}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil className="h-4 w-4" /></Link>
              <DeleteButton label={r.title} action={deleteResource.bind(null, r.id)} />
            </div>
          </li>
        ))}
      </ul>
      <Pagination basePath="/admin/resources" params={{ q: searchParams.q }} page={result.page} pageCount={result.pageCount} />
    </div>
  );
}
