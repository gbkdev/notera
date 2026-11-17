import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { getResource } from "@/lib/queries";
import { downloadUrl, publicFileUrl } from "@/lib/storage";
import { formatBytes, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FormatBadge } from "@/components/resource-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await getResource(params.id);
  return { title: r?.title ?? "Resource" };
}

export default async function ResourcePage({ params }: { params: { id: string } }) {
  const r = await getResource(params.id);
  if (!r) notFound();
  const isPdf = r.file_ext === "pdf";
  const rows: [string, string][] = [
    ["Category", r.category_label], ["Course", `${r.course_code} ${r.course_name}`], ["Department", r.department_name],
    ["Academic year", r.year_label], ["Semester", r.semester_name], ["File", r.file_name],
    ["Size", formatBytes(r.file_size)], ["Uploaded", formatDate(r.created_at)],
  ];

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href={`/departments/${r.department_slug}`} className="hover:text-foreground">{r.department_name}</Link> /{" "}
        <Link href={`/courses/${r.course_id}`} className="hover:text-foreground">{r.course_code}</Link>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <FormatBadge ext={r.file_ext} />
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{r.title}</h1>
          {r.description && <p className="mt-3 max-w-2xl text-muted-foreground">{r.description}</p>}
        </div>
        <a href={downloadUrl(r.file_path, r.file_name)} className={buttonVariants({ size: "lg" })}>
          <Download className="h-5 w-5" /> Download ({formatBytes(r.file_size)})
        </a>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {isPdf ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <iframe src={publicFileUrl(r.file_path)} title={`Preview of ${r.title}`} className="h-[75vh] min-h-[480px] w-full" />
            <p className="border-t p-3 text-xs text-muted-foreground">
              Preview not showing? <a className="text-primary underline" href={publicFileUrl(r.file_path)} target="_blank" rel="noopener noreferrer">Open the PDF in a new tab</a>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
            <FileText className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-semibold">Preview isn’t available for .{r.file_ext} files</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Download the file to open it in {r.file_ext.startsWith("ppt") ? "PowerPoint" : r.file_ext.startsWith("doc") ? "Word" : "Excel"}.</p>
          </div>
        )}
        <aside aria-label="File information" className="h-fit rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-semibold">File information</h2>
          <dl className="space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
