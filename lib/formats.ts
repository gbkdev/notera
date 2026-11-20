/**
 * Single source of truth for which file types Notera accepts. Upload checks, previews, filters, card colours
 * and the database/storage limits (supabase/migrations/0008) are all built from this list.
 *
 * Deliberately NOT accepted: programs and scripts (exe, msi, apk, bat, sh, js…), web pages and SVG (they can run
 * code when opened from our domain), and macro-enabled Office files (docm, xlsm, pptm). Zip a project folder instead.
 */
export type Group = "pdf" | "ppt" | "doc" | "xls" | "txt" | "img" | "zip";
export type Magic = "pdf" | "ole" | "ooxml-word" | "ooxml-ppt" | "ooxml-xl" | "odf" | "rtf" | "text" | "png" | "jpg" | "gif" | "webp" | "zip" | "7z" | "rar";

const OOXML = "application/vnd.openxmlformats-officedocument";
const ODF = "application/vnd.oasis.opendocument";

export const FORMATS = {
  // PDF
  pdf: { group: "pdf", mime: "application/pdf", magic: "pdf" },
  // Documents
  doc: { group: "doc", mime: "application/msword", magic: "ole" },
  dot: { group: "doc", mime: "application/msword", magic: "ole" },
  docx: { group: "doc", mime: `${OOXML}.wordprocessingml.document`, magic: "ooxml-word" },
  dotx: { group: "doc", mime: `${OOXML}.wordprocessingml.template`, magic: "ooxml-word" },
  odt: { group: "doc", mime: `${ODF}.text`, magic: "odf" },
  rtf: { group: "doc", mime: "application/rtf", magic: "rtf" },
  // Presentations
  ppt: { group: "ppt", mime: "application/vnd.ms-powerpoint", magic: "ole" },
  pps: { group: "ppt", mime: "application/vnd.ms-powerpoint", magic: "ole" },
  pot: { group: "ppt", mime: "application/vnd.ms-powerpoint", magic: "ole" },
  pptx: { group: "ppt", mime: `${OOXML}.presentationml.presentation`, magic: "ooxml-ppt" },
  ppsx: { group: "ppt", mime: `${OOXML}.presentationml.slideshow`, magic: "ooxml-ppt" },
  potx: { group: "ppt", mime: `${OOXML}.presentationml.template`, magic: "ooxml-ppt" },
  odp: { group: "ppt", mime: `${ODF}.presentation`, magic: "odf" },
  // Spreadsheets
  xls: { group: "xls", mime: "application/vnd.ms-excel", magic: "ole" },
  xlsx: { group: "xls", mime: `${OOXML}.spreadsheetml.sheet`, magic: "ooxml-xl" },
  ods: { group: "xls", mime: `${ODF}.spreadsheet`, magic: "odf" },
  csv: { group: "xls", mime: "text/csv", magic: "text" },
  // Plain text
  txt: { group: "txt", mime: "text/plain", magic: "text" },
  md: { group: "txt", mime: "text/markdown", magic: "text" },
  // Images (scanned notes, diagrams, photos of whiteboards)
  png: { group: "img", mime: "image/png", magic: "png" },
  jpg: { group: "img", mime: "image/jpeg", magic: "jpg" },
  jpeg: { group: "img", mime: "image/jpeg", magic: "jpg" },
  gif: { group: "img", mime: "image/gif", magic: "gif" },
  webp: { group: "img", mime: "image/webp", magic: "webp" },
  // Archives (e.g. a code project)
  zip: { group: "zip", mime: "application/zip", magic: "zip" },
  rar: { group: "zip", mime: "application/vnd.rar", magic: "rar" },
  "7z": { group: "zip", mime: "application/x-7z-compressed", magic: "7z" },
} as const satisfies Record<string, { group: Group; mime: string; magic: Magic }>;

export type FileExt = keyof typeof FORMATS;
export const ALLOWED_EXTS = Object.keys(FORMATS) as FileExt[];
export const EXT_MIME = Object.fromEntries(ALLOWED_EXTS.map((e) => [e, FORMATS[e].mime])) as Record<FileExt, string>;
export const ALL_MIMES = Array.from(new Set(ALLOWED_EXTS.map((e) => FORMATS[e].mime)));

/** Value for <input type="file" accept="…">. */
export const ACCEPT = ALLOWED_EXTS.map((e) => `.${e}`).join(",");
export const SUPPORTED_HINT = "PDF, Word, PowerPoint, Excel, OpenDocument, text, images or ZIP";

export function formatGroupOf(ext: string): Group {
  return (FORMATS as Record<string, { group: Group }>)[ext.toLowerCase()]?.group ?? "doc";
}

// Full class names are written out so Tailwind can see them.
export const FORMAT_STYLE: Record<Group, { label: string; spine: string; chip: string; hex: string; openWith: string }> = {
  pdf: { label: "PDF", spine: "bg-fmt-pdf", chip: "bg-fmt-pdf/15 text-fmt-pdf", hex: "#C62F2F", openWith: "a PDF reader" },
  ppt: { label: "Presentations", spine: "bg-fmt-ppt", chip: "bg-fmt-ppt/15 text-fmt-ppt", hex: "#C8561A", openWith: "PowerPoint" },
  doc: { label: "Documents", spine: "bg-fmt-doc", chip: "bg-fmt-doc/15 text-fmt-doc", hex: "#2F62C6", openWith: "Word" },
  xls: { label: "Spreadsheets", spine: "bg-fmt-xls", chip: "bg-fmt-xls/15 text-fmt-xls", hex: "#1F7A4D", openWith: "Excel" },
  txt: { label: "Text", spine: "bg-fmt-txt", chip: "bg-fmt-txt/15 text-fmt-txt", hex: "#5C6B80", openWith: "a text editor" },
  img: { label: "Images", spine: "bg-fmt-img", chip: "bg-fmt-img/15 text-fmt-img", hex: "#8A3FC2", openWith: "an image viewer" },
  zip: { label: "Archives", spine: "bg-fmt-zip", chip: "bg-fmt-zip/15 text-fmt-zip", hex: "#9A6A1E", openWith: "an unzip tool" },
};

/** Groups for the "format" filter. */
export const FORMAT_GROUPS = (Object.keys(FORMAT_STYLE) as Group[]).map((value) => ({
  value,
  label: FORMAT_STYLE[value].label,
  exts: ALLOWED_EXTS.filter((e) => FORMATS[e].group === value) as string[],
}));
