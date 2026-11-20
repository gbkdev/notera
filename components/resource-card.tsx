import Link from "next/link";
import { Download, Eye, FileArchive, FileSpreadsheet, FileText, Image as ImageIcon, Info, Presentation } from "lucide-react";
import { FORMAT_STYLE, formatGroupOf } from "@/lib/constants";
import type { Resource } from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { previewKind } from "@/lib/preview";
import { SaveButton } from "@/components/save-button";
import { LARGE_FILE } from "@/lib/constants";

const GROUP_ICON = { pdf: FileText, ppt: Presentation, doc: FileText, xls: FileSpreadsheet, txt: FileText, img: ImageIcon, zip: FileArchive } as const;

export function FormatBadge({ ext, className }: { ext: string; className?: string }) {
  const s = FORMAT_STYLE[formatGroupOf(ext)];
  return (
    <span className={cn("rounded-sm px-1.5 py-0.5 text-xs font-semibold", s.chip, className)}>{ext.toUpperCase()}</span>
  );
}

/** The coloured spine on the left edge works like a book spine: its colour tells you the file format at a glance. */
export function ResourceCard({ r }: { r: Resource }) {
  const s = FORMAT_STYLE[formatGroupOf(r.file_ext)];
  const canPreview = previewKind(r) !== null;
  const Icon = GROUP_ICON[formatGroupOf(r.file_ext)];
  return (
    <article className="group relative flex overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className={cn("w-2 shrink-0", s.spine)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            <Link href={`/resources/${r.id}`} prefetch={false} className="after:absolute after:inset-0 after:content-['']">{r.title}</Link>
          </h3>
          <FormatBadge ext={r.file_ext} />
        </div>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{r.file_name}</span></p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{r.course_code}</span> {r.course_name}
        </p>
        {r.description && <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div><dt className="sr-only">Category</dt><dd>{r.category_label}</dd></div>
          <div><dt className="sr-only">Department</dt><dd>{r.department_name}</dd></div>
          <div><dt className="sr-only">Size</dt><dd className={r.file_size >= LARGE_FILE ? "font-semibold text-foreground" : undefined}>{formatBytes(r.file_size)}{r.file_size >= LARGE_FILE ? " · large file" : ""}</dd></div>
          <div><dt className="sr-only">Uploaded</dt><dd>{formatDate(r.created_at)}</dd></div>
          {r.download_count > 0 && <div><dt className="sr-only">Downloads</dt><dd>{r.download_count} {r.download_count === 1 ? "download" : "downloads"}</dd></div>}
        </dl>
        <div className="relative z-10 mt-auto flex gap-2 pt-1">
          <Link href={`/resources/${r.id}`} prefetch={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {canPreview ? <Eye className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            {canPreview ? "Preview" : "Details"}
          </Link>
          <a href={`/api/download/${r.id}`} className={buttonVariants({ size: "sm" })}>
            <Download className="h-4 w-4" /> Download
          </a>
          <SaveButton id={r.id} />
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
