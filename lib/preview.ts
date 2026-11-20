import type { Resource } from "@/lib/types";
import { publicFileUrl } from "@/lib/storage";

const MB = 1024 * 1024;
// The browser can show these itself, so they open in an embedded frame.
const DIRECT = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp"]);
// Microsoft's free Office viewer handles these; approximate size limits, larger files get the download fallback.
const OFFICE_LIMIT: Record<string, number> = {
  ppt: 10 * MB, pptx: 10 * MB, pps: 10 * MB, ppsx: 10 * MB,
  doc: 10 * MB, docx: 10 * MB, xls: 5 * MB, xlsx: 5 * MB,
};
// Everything else (text, CSV, OpenDocument, RTF, archives…) is download-only: no fake preview buttons.

export type PreviewKind = "direct" | "office" | null;

export function previewKind(r: Pick<Resource, "file_ext" | "file_size">): PreviewKind {
  if (DIRECT.has(r.file_ext)) return "direct";
  const limit = OFFICE_LIMIT[r.file_ext];
  return limit && r.file_size <= limit ? "office" : null;
}

export function previewSrc(r: Pick<Resource, "file_ext" | "file_path" | "file_size">): string | null {
  const kind = previewKind(r);
  if (kind === "direct") return publicFileUrl(r.file_path);
  if (kind === "office")
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl(r.file_path))}`;
  return null;
}
