import type { Resource } from "@/lib/types";
import { publicFileUrl } from "@/lib/storage";

const MB = 1024 * 1024;
// Approximate size limits of Microsoft's free Office viewer. Larger files get the download fallback instead of a broken frame.
const OFFICE_LIMIT: Record<string, number> = {
  ppt: 10 * MB, pptx: 10 * MB, doc: 10 * MB, docx: 10 * MB, xls: 5 * MB, xlsx: 5 * MB,
};

export type PreviewKind = "pdf" | "office" | null;

export function previewKind(r: Pick<Resource, "file_ext" | "file_size">): PreviewKind {
  if (r.file_ext === "pdf") return "pdf";
  const limit = OFFICE_LIMIT[r.file_ext];
  return limit && r.file_size <= limit ? "office" : null;
}

export function previewSrc(r: Pick<Resource, "file_ext" | "file_path" | "file_size">): string | null {
  const kind = previewKind(r);
  if (kind === "pdf") return publicFileUrl(r.file_path);
  if (kind === "office")
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl(r.file_path))}`;
  return null;
}
