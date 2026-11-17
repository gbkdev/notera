import Link from "next/link";
import { Download, Eye, Info } from "lucide-react";
import { FORMAT_STYLE, formatGroupOf } from "@/lib/constants";
import { downloadUrl } from "@/lib/storage";
import type { Resource } from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function FormatBadge({ ext, className }: { ext: string; className?: string }) {
  const s = FORMAT_STYLE[formatGroupOf(ext)];
  return (
    <span className={cn("rounded-sm px-1.5 py-0.5 text-xs font-semibold", s.chip, className)}>{ext.toUpperCase()}</span>
  );
}

/** The coloured spine on the left edge works like a book spine: its colour tells you the file format at a glance. */
export function ResourceCard({ r }: { r: Resource }) {
  const s = FORMAT_STYLE[formatGroupOf(r.file_ext)];
  const canPreview = r.file_ext === "pdf";
  return (
    <article className="group relative flex overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className={cn("w-2 shrink-0", s.spine)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            <Link href={`/resources/${r.id}`} className="after:absolute after:inset-0 after:content-['']">{r.title}</Link>
          </h3>
          <FormatBadge ext={r.file_ext} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{r.course_code}</span> {r.course_name}
        </p>
        {r.description && <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div><dt className="sr-only">Category</dt><dd>{r.category_label}</dd></div>
          <div><dt className="sr-only">Department</dt><dd>{r.department_name}</dd></div>
          <div><dt className="sr-only">Size</dt><dd>{formatBytes(r.file_size)}</dd></div>
          <div><dt className="sr-only">Uploaded</dt><dd>{formatDate(r.created_at)}</dd></div>
        </dl>
        <div className="relative z-10 mt-auto flex gap-2 pt-1">
          <Link href={`/resources/${r.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {canPreview ? <Eye className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            {canPreview ? "Preview" : "Details"}
          </Link>
          <a href={downloadUrl(r.file_path, r.file_name)} className={buttonVariants({ size: "sm" })}>
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      </div>
    </article>
  );
}

export function ResourceGrid({ resources }: { resources: Resource[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => <ResourceCard key={r.id} r={r} />)}
    </div>
  );
}
