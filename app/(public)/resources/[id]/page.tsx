import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { getResource } from "@/lib/public-queries";
import { downloadUrl, publicFileUrl } from "@/lib/storage";
import { ShareButton } from "@/components/share-button";
import { SaveButton } from "@/components/save-button";
import { ReportProblem } from "@/components/report-problem";
import { formatBytes, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DocumentPreview } from "@/components/document-preview";
import { previewKind, previewSrc } from "@/lib/preview";
import { FORMAT_STYLE, formatGroupOf } from "@/lib/formats";
import { FormatBadge } from "@/components/resource-card";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const r = await getResource(params.id);
  if (!r) return { title: "Resource" };
  const description = r.description || `${r.category_label} for ${r.course_code} ${r.course_name} · ${r.department_name} · ${r.file_ext.toUpperCase()}, ${formatBytes(r.file_size)}`;
  return {
    title: r.title,
    description,
    openGraph: { title: r.title, description, type: "website", siteName: "Notera" },
    twitter: { card: "summary_large_image", title: r.title, description },
  };
}

export default async function ResourcePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const r = await getResource(params.id);
  if (!r) notFound();
  const kind = previewKind(r);
  const src = previewSrc(r);
  const rows: [string, string][] = [
    ["Category", r.category_label], ["Course", `${r.course_code} ${r.course_name}`], ["Department", r.department_name],
    ["Academic year", r.year_label], ["Semester", r.semester_name], ["File", r.file_name],
    ["Size", formatBytes(r.file_size)], ["Uploaded", formatDate(r.created_at)], ["Downloads", String(r.download_count)],
  ];

  return (
    <div className="py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> / <Link href={`/departments/${r.department_slug}`} className="hover:text-foreground">{r.department_name}</Link> /{" "}
        <Link href={`/courses/${r.course_id}`} className="hover:text-foreground">{r.course_code}</Link>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <FormatBadge ext={r.file_ext} />
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{r.title}</h1>
          {r.description && <p className="mt-3 max-w-2xl text-muted-foreground">{r.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <SaveButton id={r.id} labeled />
          <ShareButton path={`/resources/${r.id}`} title={r.title} />
          <a href={`/api/download/${r.id}`} className={buttonVariants({ size: "lg" })}>
            <Download className="h-5 w-5" /> Download ({formatBytes(r.file_size)})
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {kind && src ? (
          <DocumentPreview src={src} office={kind === "office"} title={r.title} sizeLabel={formatBytes(r.file_size)}
            downloadHref={`/api/download/${r.id}`} openHref={kind === "direct" ? publicFileUrl(r.file_path) : downloadUrl(r.file_path, r.file_name)} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
            <FileText className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-semibold">No preview for this file</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">This .{r.file_ext} file ({formatBytes(r.file_size)}) can’t be previewed in the browser. Download it to open it in {FORMAT_STYLE[formatGroupOf(r.file_ext)].openWith}.</p>
          </div>
        )}
        <aside aria-label="File information" className="h-fit rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-semibold">File information</h2>
          <dl className="space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-5 border-t pt-4"><ReportProblem resourceId={r.id} /></div>
        </aside>
      </div>
    </div>
  );
}
